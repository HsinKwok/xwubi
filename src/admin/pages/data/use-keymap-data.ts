import { useCallback, useEffect, useState } from 'react';
import { resolveAdminError } from '../../lib/api';
import { getMatrix, listExamples, listRoots } from '../../lib/data-api';
import type { MatrixVersion, WubiExampleItem, WubiRootItem } from '../../lib/data-api';
import type { WubiVersion } from '../../types';

export type KeymapTab = 'roots' | 'examples' | 'matrix';

interface Options {
  tab: KeymapTab;
  version: WubiVersion;
  query: string;
  page: number;
  pageSize: number;
  onUnauthorized: () => void;
  /** 版本矩阵没有列表错误面板，失败信息交给页面提示条 */
  onMatrixError: (message: string) => void;
}

/**
 * 码表页的数据加载：字根与例字都走服务端分页，版本矩阵按需加载。
 * 各页签切换时取消旧请求，reload 用于新增/导入/删除后的重新取数。
 */
export function useKeymapData({
  tab,
  version,
  query,
  page,
  pageSize,
  onUnauthorized,
  onMatrixError,
}: Options) {
  const [roots, setRoots] = useState<WubiRootItem[]>([]);
  const [examples, setExamples] = useState<WubiExampleItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  /** 已成功取过数的页签，避免首次切换时误显示空数据 */
  const [loadedTab, setLoadedTab] = useState<KeymapTab | null>(null);

  const [matrix, setMatrix] = useState<MatrixVersion[]>([]);
  const [matrixLoading, setMatrixLoading] = useState(false);

  useEffect(() => {
    if (tab !== 'roots') return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    listRoots(version, query, page, pageSize, controller.signal)
      .then((payload) => {
        if (controller.signal.aborted) return;
        setRoots(payload.items);
        setTotal(payload.total);
        setLoadedTab('roots');
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        const message = resolveAdminError(caught, '码表数据加载失败', onUnauthorized);
        if (!message) return;
        setError(message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [tab, version, query, page, pageSize, reloadKey, onUnauthorized]);

  useEffect(() => {
    if (tab !== 'examples') return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    listExamples(version, query, page, pageSize, controller.signal)
      .then((payload) => {
        if (controller.signal.aborted) return;
        setExamples(payload.items);
        setTotal(payload.total);
        setLoadedTab('examples');
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        const message = resolveAdminError(caught, '码表数据加载失败', onUnauthorized);
        if (!message) return;
        setError(message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [tab, version, query, page, pageSize, reloadKey, onUnauthorized]);

  useEffect(() => {
    if (tab !== 'matrix') return;

    const controller = new AbortController();
    setMatrixLoading(true);

    getMatrix(controller.signal)
      .then((payload) => setMatrix(payload.versions))
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        const message = resolveAdminError(caught, '版本矩阵加载失败', onUnauthorized);
        if (!message) return;
        onMatrixError(message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setMatrixLoading(false);
      });

    return () => controller.abort();
  }, [tab, reloadKey, onUnauthorized]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return {
    roots,
    setRoots,
    examples,
    setExamples,
    total,
    setTotal,
    loading,
    error,
    loadedTab,
    matrix,
    matrixLoading,
    reload,
  };
}
