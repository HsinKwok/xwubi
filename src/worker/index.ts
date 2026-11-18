import { Hono } from 'hono';
import type { Context } from 'hono';
import type { AppEnv, Env } from './lib/env';
import { fail, isSameOrigin } from './lib/http';
import { loadSession } from './lib/session';
import { adminRoutes } from './routes/admin/index';
import { authRoutes } from './routes/auth';
import { dataRoutes } from './routes/data/index';
import { profileRoutes } from './routes/profile';
import { siteRoutes } from './routes/site/index';

const app = new Hono<AppEnv>();

app.use('*', async (c, next) => {
  const requestId = crypto.randomUUID();
  c.set('requestId', requestId);

  await next();

  // 统一给 JSON 响应补 charset，避免 PowerShell 等外部工具按本地代码页误解码
  const contentType = c.res.headers.get('Content-Type');
  if (contentType && !/charset=/i.test(contentType) && /^application\/json\b/i.test(contentType)) {
    c.header('Content-Type', `${contentType.split(';')[0].trim()}; charset=utf-8`);
  }

  c.header('X-Request-Id', requestId);
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
});

app.use('/api/*', async (c, next) => {
  // 写请求不做共享缓存；公开 GET 的缓存策略由 edgeCached 决定
  if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
    c.header('Cache-Control', 'no-store');

    const origin = c.req.header('origin');
    if (origin && !isSameOrigin(c.req.url, origin)) {
      return fail(c, 403, 'origin_forbidden', '请求来源不被允许');
    }
  }

  await next();
});

// 登录态与后台数据与用户相关，禁止任何层级的共享缓存
const privateNoStore = async (c: Context<AppEnv>, next: () => Promise<void>) => {
  c.header('Cache-Control', 'no-store');
  await next();
};

// 只有需要登录态的接口才解析会话；公开站点接口不再查询 D1
app.use('/api/auth/*', privateNoStore, loadSession);
app.use('/api/profile/*', privateNoStore, loadSession);
app.use('/api/admin/*', privateNoStore, loadSession);

app.get('/api/health', (c) => c.json({ ok: true, service: 'xwubi' }));

app.route('/api/site', siteRoutes);
app.route('/api/auth', authRoutes);
app.route('/api/profile', profileRoutes);
app.route('/api/admin/data', dataRoutes);
app.route('/api/admin', adminRoutes);

/* 媒体库公开读取：R2 中 key 与 URL 路径一一对应，如 media/2026/xxx.png */
app.get('/media/*', async (c) => {
  const key = new URL(c.req.url).pathname.replace(/^\/+/, '');
  if (!key.startsWith('media/')) return c.text('Not Found', 404);

  // 媒体地址带内容哈希且长期不变，命中边缘缓存后不再回源 R2
  const cacheKey = new Request(c.req.url, { method: 'GET' });
  const cache = caches.default;
  const cached = await cache.match(cacheKey);
  if (cached) {
    const etag = cached.headers.get('ETag');
    const ifNoneMatch = c.req.header('if-none-match');
    if (etag && ifNoneMatch?.split(',').some((tag) => tag.trim() === etag)) {
      return new Response(null, { status: 304, headers: cached.headers });
    }
    return cached;
  }

  const object = await c.env.BUCKET.get(key);
  if (!object) return c.text('Not Found', 404);

  const headers = new Headers();
  headers.set('Content-Type', object.httpMetadata?.contentType ?? 'application/octet-stream');
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('ETag', object.httpEtag);
  headers.set('Content-Length', String(object.size));

  const ifNoneMatch = c.req.header('if-none-match');
  if (ifNoneMatch && ifNoneMatch.split(',').some((tag) => tag.trim() === object.httpEtag)) {
    return new Response(null, { status: 304, headers });
  }

  const response = new Response(object.body, { status: 200, headers });
  try {
    c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));
  } catch {
    // 本地脚本等无执行上下文时跳过缓存
  }
  return response;
});

function assetRequest(request: Request, pathname: string): Request {
  const url = new URL(request.url);
  url.pathname = pathname;
  url.search = '';
  return new Request(url.toString(), {
    method: 'GET',
    headers: { Accept: 'text/html' },
  });
}

function withShellHeaders(response: Response, cacheControl: string): Response {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', cacheControl);
  headers.set('Content-Type', 'text/html; charset=utf-8');
  return new Response(response.body, { status: response.status, headers });
}

async function serveAdminShell(c: Context<AppEnv>): Promise<Response> {
  const response = await c.env.ASSETS.fetch(assetRequest(c.req.raw, '/admin.html'));
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-cache');
  headers.set('X-Robots-Tag', 'noindex, nofollow');
  headers.set('Content-Type', 'text/html; charset=utf-8');
  return new Response(response.body, { status: response.status, headers });
}

async function serveSiteShell(c: Context<AppEnv>): Promise<Response> {
  const response = await c.env.ASSETS.fetch(assetRequest(c.req.raw, '/index.html'));
  return withShellHeaders(response, 'public, max-age=0, must-revalidate');
}

app.get('/admin', serveAdminShell);
app.get('/admin/*', serveAdminShell);

/** 未命中任何路由时统一回退：接口返回 JSON 404，页面路径回退到站点外壳 */
function fallback(c: Context<AppEnv>) {
  const path = new URL(c.req.url).pathname;
  if (path.startsWith('/api/')) return fail(c, 404, 'not_found', '接口不存在');
  if (c.req.method === 'GET' && !/\.[a-z0-9]+$/i.test(path)) return serveSiteShell(c);
  return c.text('Not Found', 404);
}

app.get('*', fallback);
app.notFound(fallback);

app.onError((error, c) => {
  console.error(`[${c.get('requestId') ?? 'no-request-id'}]`, error);
  return c.json(
    {
      error: {
        code: 'internal_error',
        message: '服务器内部错误',
        request_id: c.get('requestId') ?? '',
      },
    },
    500,
  );
});

export default app;
