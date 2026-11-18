import { useCallback, useEffect, useRef, useState } from 'react';
import { getJson } from './api';
import { errorMessage } from './format';
import { getJsonCached } from './json-cache';

export interface SiteResourceOptions<T> {
  /** 请求地址；传 null 表示当前无需加载 */
  url: string | null;
  /** 浏览器端缓存时长，0 表示始终取网络数据 */
  ttlMs?: number;
  /** 失败时的兜底文案 */
  fallback: string;
  /** 为 false 时暂停加载，已加载的数据会保留 */
  enabled?: boolean;
  /** 加载成功后的附加处理，比如选中默认项 */
  onSuccess?: (data: T) => void;
}

export interface SiteResource<T> {
  data: T | null;
  setData: (updater: T | null | ((previous: T | null) => T | null)) => void;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * 站点内通用的 JSON 资源加载：统一处理 loading / error / 重试与请求中止。
 * url 变化时自动重新请求，配合 getJsonCached 复用浏览器缓存。
 */
export function useSiteResource<T>({
  url,
  ttlMs = 300_000,
  fallback,
  enabled = true,
  onSuccess,
}: SiteResourceOptions<T>): SiteResource<T> {
  const [data, setDataState] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled && url !== null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // 回调只保留最新引用，避免因内联函数导致重复请求
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  useEffect(() => {
    if (!enabled || url === null) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const request =
      ttlMs > 0
        ? getJsonCached<T>(url, ttlMs, controller.signal)
        : getJson<T>(url, controller.signal);

    request
      .then((payload) => {
        if (controller.signal.aborted) return;
        setDataState(payload);
        setLoading(false);
        onSuccessRef.current?.(payload);
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        setError(errorMessage(caught, fallback));
        setLoading(false);
      });

    return () => controller.abort();
  }, [url, ttlMs, enabled, reloadKey, fallback]);

  const setData = useCallback(
    (updater: T | null | ((previous: T | null) => T | null)) => {
      setDataState((previous) =>
        typeof updater === 'function'
          ? (updater as (value: T | null) => T | null)(previous)
          : updater,
      );
    },
    [],
  );

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return { data, setData, loading, error, reload };
}
