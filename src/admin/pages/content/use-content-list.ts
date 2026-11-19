import { useEffect, useState } from 'react';
import { toQueryString } from '../../../shared/query';
import { resolveAdminError } from '../../lib/api';
import { deleteContent, deleteContents, listContent } from '../../lib/content-api';
import { useAsyncData } from '../../lib/use-async-data';
import { useSelection } from '../../lib/use-selection';
import type { AdminContentItem, ContentListResponse } from '../../lib/content-api';
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingBatch, setDeletingBatch] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

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
  const queryKey = toQueryString(filters);
  const { data, loading, error, reload } = useAsyncData<ContentListResponse>(
    (signal) => listContent(filters, signal),
    {
      queryKey,
      fallback: '内容列表加载失败',
      onUnauthorized,
    },
  );

  // 筛选或翻页后，旧的选择不再可见，直接清空
  const items = data?.items ?? [];
  const { selectedIds, toggleSelect, toggleSelectAll, clearSelection, deselect } = useSelection(
    items,
    { resetKey: queryKey },
  );
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

  async function deleteOne(item: AdminContentItem) {
    if (deletingId || deletingBatch) return;
    if (!window.confirm(`确定删除「${item.title}」？删除后无法恢复。`)) return;

    setDeletingId(item.id);
    setNotice(null);
    try {
      await deleteContent(item.id);
      deselect(item.id);
      setNotice({ tone: 'ok', text: `已删除「${item.title}」` });
      reload();
    } catch (caught) {
      const message = resolveAdminError(caught, '删除失败', onUnauthorized);
      if (message) setNotice({ tone: 'error', text: message });
    } finally {
      setDeletingId(null);
    }
  }

  async function deleteSelected() {
    if (deletingId || deletingBatch || selectedIds.length === 0) return;
    if (
      !window.confirm(
        `确定删除选中的 ${selectedIds.length} 条内容？\n删除后无法恢复，前台相关页面会同步移除。`,
      )
    ) {
      return;
    }

    setDeletingBatch(true);
    setNotice(null);
    try {
      const payload = await deleteContents(selectedIds);
      clearSelection();
      setNotice({ tone: 'ok', text: `已删除 ${payload.deleted} 条内容` });
      reload();
    } catch (caught) {
      const message = resolveAdminError(caught, '批量删除失败', onUnauthorized);
      if (message) setNotice({ tone: 'error', text: message });
    } finally {
      setDeletingBatch(false);
    }
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
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    deletingId,
    deletingBatch,
    notice,
    deleteOne,
    deleteSelected,
  };
}
