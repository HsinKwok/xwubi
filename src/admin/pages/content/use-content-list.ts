import { useEffect, useState } from 'react';
import { toQueryString } from '../../../shared/query';
import { listContent } from '../../lib/content-api';
import { useAsyncData } from '../../lib/use-async-data';
import type { ContentListResponse } from '../../lib/content-api';
import { listCategories } from '../../lib/categories-api';
import type { CategoryItem } from '../../lib/categories-api';

const PER_PAGE = 20;

interface Options {
  initialQuery?: string;
  onUnauthorized: () => void;
}

/**
 * 内容列表的筛选、防抖搜索与分页逻辑。
 */
export function useContentList({ initialQuery = '', onUnauthorized }: Options) {
  const [keyword, setKeyword] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState('');
  const [version, setVersion] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    listCategories(undefined, controller.signal)
      .then((payload) => {
        if (!controller.signal.aborted) setCategories(payload.items);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const contentTypes = categories
    .filter((category) => category.domain === 'content_type')
    .map((category) => ({ slug: category.slug, label: category.label }));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(keyword.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [keyword]);

  const filters = {
    q: query || undefined,
    type: type || undefined,
    version: version || undefined,
    status: status || undefined,
    page,
    per_page: PER_PAGE,
  };
  const { data, loading, error, reload } = useAsyncData<ContentListResponse>(
    (signal) => listContent(filters, signal),
    {
      queryKey: toQueryString(filters),
      fallback: '内容列表加载失败',
      onUnauthorized,
    },
  );

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  /** 任一筛选变化后回到第一页 */
  function changeType(value: string) {
    setType(value);
    setPage(1);
  }

  function changeVersion(value: string) {
    setVersion(value);
    setPage(1);
  }

  function changeStatus(value: string) {
    setStatus(value);
    setPage(1);
  }

  return {
    keyword,
    setKeyword,
    query,
    type,
    changeType,
    version,
    changeVersion,
    status,
    changeStatus,
    page,
    setPage,
    totalPages,
    contentTypes,
    data,
    loading,
    error,
    reload,
    items,
    total,
  };
}
