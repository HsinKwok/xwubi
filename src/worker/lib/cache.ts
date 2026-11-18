import type { Context } from 'hono';
import type { AppEnv } from './env';

/** 浏览器端短缓存，保证切页时仍会回源校验；边缘缓存由 s-maxage 控制 */
const CLIENT_MAX_AGE = 30;
const STALE_WHILE_REVALIDATE = 600;

/** FNV-1a 32 位哈希：用于生成稳定的弱 ETag，避免对响应体再做一次摘要 */
function weakEtag(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `W/"${hash.toString(16)}-${input.length.toString(16)}"`;
}

/**
 * 边缘缓存（Cache API）：仅用于公开、与登录态无关的 GET 接口。
 * 命中时直接由边缘节点返回，不再触发 D1 查询与 JSON 序列化。
 *
 * 压缩交给 Workers 运行时处理（Response 默认 encodeBody="automatic"），
 * Promise 与响应体保持未压缩，避免重复 gzip 浪费 CPU。
 *
 * cacheKey 由调用方归一化（固定参数顺序、带站点 epoch），
 * 因此发布内容或切换版本后键会自然失效，无需枚举删除旧 URL。
 * ETag 由缓存键推导，配合 If-None-Match 可直接返回 304。
 */
export async function edgeCached(
  c: Context<AppEnv>,
  ttlSeconds: number,
  cacheKey: string,
  build: () => Promise<Response>,
): Promise<Response> {
  const cacheControl = `public, max-age=${CLIENT_MAX_AGE}, s-maxage=${ttlSeconds}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`;
  const etag = weakEtag(cacheKey);
  const headers = { 'Cache-Control': cacheControl, ETag: etag };

  // 条件请求：客户端已有当前 epoch 的副本，直接应答 304，不读缓存也不查库
  const ifNoneMatch = c.req.header('if-none-match');
  if (ifNoneMatch?.split(',').some((tag) => tag.trim() === etag)) {
    return new Response(null, { status: 304, headers });
  }

  const request = new Request(cacheKey, { method: 'GET' });
  const cache = caches.default;

  const hit = await cache.match(request);
  if (hit) return hit;

  const response = await build();
  if (!response.ok) return response;

  const responseHeaders = new Headers(response.headers);
  responseHeaders.set('Cache-Control', cacheControl);
  responseHeaders.set('ETag', etag);
  const cached = new Response(response.body, { status: response.status, headers: responseHeaders });

  try {
    c.executionCtx.waitUntil(cache.put(request, cached.clone()));
  } catch {
    // 非 Worker 运行环境（如脚本内直接调用）忽略缓存写入
  }

  return cached;
}
