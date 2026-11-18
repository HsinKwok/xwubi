import type { Env } from './env';

/**
 * 固定窗口限流：KV 计数，用于登录、投稿等公开写接口。
 * 返回 true 表示放行。
 */
export async function consumeRateLimit(
  env: Env,
  bucket: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const windowKey = Math.floor(Date.now() / (windowSeconds * 1000));
  const key = `rl:${bucket}:${windowKey}`;

  try {
    const current = Number((await env.CACHE.get(key)) ?? '0');
    if (current >= limit) return false;
    await env.CACHE.put(key, String(current + 1), { expirationTtl: windowSeconds });
    return true;
  } catch {
    // KV 不可用时不影响主流程
    return true;
  }
}
