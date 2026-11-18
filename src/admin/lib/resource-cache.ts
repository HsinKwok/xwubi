import { withSignal } from '../../shared/async';

export interface ResourceCache<T> {
  /** 命中快照直接返回；并发请求合并为一次网络往返 */
  load(signal?: AbortSignal): Promise<T>;
  /** 写入成功后强制刷新，并通知所有订阅者 */
  refresh(): Promise<T>;
  read(): T | null;
  subscribe(listener: (value: T) => void): () => void;
}

/**
 * 管理台通用资源缓存：分类、标签这类低频数据共用同一套
 * 「TTL 快照 + 并发合并 + 刷新通知」逻辑。
 */
export function createResourceCache<T>(
  fetcher: () => Promise<T>,
  ttlMs: number,
): ResourceCache<T> {
  let snapshot: T | null = null;
  let snapshotAt = 0;
  let inflight: Promise<T> | null = null;
  const listeners = new Set<(value: T) => void>();

  async function fetchAll(): Promise<T> {
    const value = await fetcher();
    snapshot = value;
    snapshotAt = Date.now();
    listeners.forEach((listener) => listener(value));
    return value;
  }

  return {
    async load(signal) {
      if (snapshot !== null && Date.now() - snapshotAt <= ttlMs) return snapshot;

      let pending = inflight;
      if (!pending) {
        pending = fetchAll().finally(() => {
          inflight = null;
        });
        inflight = pending;
      }
      return withSignal(pending, signal);
    },

    async refresh() {
      snapshot = null;
      snapshotAt = 0;
      inflight = fetchAll();
      try {
        return await inflight;
      } finally {
        inflight = null;
      }
    },

    read: () => snapshot,

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
