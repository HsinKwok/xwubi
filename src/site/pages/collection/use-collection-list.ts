// 集合页数据加载：筛选条件、游标追加与错误重试
import { useEffect, useMemo, useState } from 'react';
import type {
  BootstrapPayload,
  CollectionPayload,
  PublicContentItem,
} from '../../../shared/site-config';
import { useSiteResource } from '../../lib/use-site-resource';
import { versionLabel as formatVersionLabel } from '../../lib/format';
import { currentSearch, replaceSearch } from '../../lib/router';

interface Options {
  boot: BootstrapPayload;
  type: string;
  version: string;
}

export function useCollectionList({ boot, type, version }: Options) {
  const meta = boot.collections[type];
  const filterKeys = useMemo(
    () => (meta?.filters ?? []).map((filter) => filter.key),
    [meta],
  );

  const [filters, setFilters] = useState<Record<string, string>>(() => {
    const search = currentSearch();
    const initial: Record<string, string> = {};
    for (const key of filterKeys) initial[key] = search.get(key) ?? '';
    return initial;
  });
  const [items, setItems] = useState<PublicContentItem[]>([]);
  // 新闻/软件等持续增长的列表用游标；教学按课次且条数有限，继续用 page
  const [cursor, setCursor] = useState<string | null>(null);
  const [pageNo, setPageNo] = useState(1);
  const firstPage = cursor === null && pageNo === 1;

  const filterQuery = filterKeys.map((key) => `${key}=${filters[key] ?? ''}`).join('&');

  useEffect(() => {
    replaceSearch(filters);
  }, [filterQuery]);

  const pageUrl = useMemo(() => {
    const params = new URLSearchParams({ type, version });
    if (cursor) params.set('cursor', cursor);
    else params.set('page', String(pageNo));
    for (const key of filterKeys) {
      const value = filters[key];
      if (value) params.set(key, value);
    }
    return `/api/site/collection?${params.toString()}`;
  }, [type, version, cursor, pageNo, filterQuery]);

  // 首页替换列表，后续页追加，避免整页闪动
  const { data, loading, error, reload } = useSiteResource<CollectionPayload>({
    url: pageUrl,
    ttlMs: 60_000,
    fallback: boot.labels.errorTitle ?? '加载失败',
    onSuccess: (payload) => {
      setItems((previous) => (firstPage ? payload.items : [...previous, ...payload.items]));
    },
  });

  function reset() {
    setCursor(null);
    setPageNo(1);
  }

  function selectFilter(key: string, value: string) {
    setFilters((previous) => ({ ...previous, [key]: value }));
    reset();
  }

  function retry() {
    reset();
    reload();
  }

  function loadMore() {
    if (data?.next_cursor) {
      setCursor(data.next_cursor);
      return;
    }
    setPageNo((current) => current + 1);
  }

  return {
    meta,
    data,
    items,
    error,
    loading: loading && firstPage,
    loadingMore: loading && !firstPage,
    filters,
    pageFilters: data?.page?.filters ?? [],
    versionLabel: formatVersionLabel(version, boot.versions, boot.labels),
    hasMore: data !== null && items.length < data.total,
    selectFilter,
    retry,
    retryMore: reload,
    loadMore,
  };
}

export type CollectionListModel = ReturnType<typeof useCollectionList>;
