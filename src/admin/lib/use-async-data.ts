import { useCallback, useEffect, useRef, useState } from 'react';
import { resolveAdminError } from './api';

interface UseAsyncDataOptions {
  /** 查询条件序列化后的标识，变化时自动取消旧请求并重新加载 */
  queryKey: string;
  enabled?: boolean;
  fallback: string;
  onUnauthorized?: () => void;
}

/** 简单列表共用的数据加载、取消、错误处理与刷新逻辑 */
export function useAsyncData<T>(
  loader: (signal: AbortSignal) => Promise<T>,
  { queryKey, enabled = true, fallback, onUnauthorized }: UseAsyncDataOptions,
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const loaderRef = useRef(loader);
  const unauthorizedRef = useRef(onUnauthorized);

  loaderRef.current = loader;
  unauthorizedRef.current = onUnauthorized;

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    loaderRef.current(controller.signal)
      .then((payload) => {
        if (controller.signal.aborted) return;
        setData(payload);
        setLoading(false);
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        const message = resolveAdminError(caught, fallback, unauthorizedRef.current);
        if (!message) return;
        setError(message);
        setLoading(false);
      });

    return () => controller.abort();
  }, [enabled, queryKey, reloadKey, fallback]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return { data, setData, loading, error, setError, reload };
}
