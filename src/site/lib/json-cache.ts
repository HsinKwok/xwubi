import { abortError, withSignal } from '../../shared/async';
import { getJson } from './api';

interface CacheEntry {
  value: unknown;
  at: number;
}

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<unknown>>();

/**
 * 带 TTL 的 GET 缓存：
 *   - 同一 URL 在 TTL 内直接复用结果；
 *   - 并发请求共享同一个网络请求；
 *   - 调用方 AbortSignal 只影响自身等待，不取消共享请求，结果仍会写入缓存。
 */
export async function getJsonCached<T>(
  url: string,
  ttlMs: number,
  signal?: AbortSignal,
): Promise<T> {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.at <= ttlMs) return cached.value as T;
  if (signal?.aborted) throw abortError();

  let pending = inflight.get(url) as Promise<T> | undefined;
  if (!pending) {
    pending = getJson<T>(url)
      .then((value) => {
        cache.set(url, { value, at: Date.now() });
        return value;
      })
      .finally(() => {
        inflight.delete(url);
      });
    inflight.set(url, pending);
  }

  return withSignal(pending, signal);
}
