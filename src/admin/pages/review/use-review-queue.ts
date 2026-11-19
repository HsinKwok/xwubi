import { useEffect, useState } from 'react';
import { toQueryString } from '../../../shared/query';
import { ApiError, resolveAdminError } from '../../lib/api';
import { useAsyncData } from '../../lib/use-async-data';
import { useSelection } from '../../lib/use-selection';
import {
  deleteReviewItem,
  deleteReviewItems,
  listReviewQueue,
  publishContent,
  rejectContent,
} from '../../lib/content-api';
import type { ReviewQueueItem, ReviewQueueResponse } from '../../lib/content-api';
import { listCategories } from '../../lib/categories-api';
import type { CategoryItem } from '../../lib/categories-api';

const PER_PAGE = 20;

export interface ReviewNotice {
  tone: 'ok' | 'error';
  text: string;
}

interface Options {
  canReview: boolean;
  onUnauthorized: () => void;
}

/** 审核队列的筛选、加载、分页与发布/驳回/删除操作 */
export function useReviewQueue({ canReview, onUnauthorized }: Options) {
  const [type, setType] = useState('');
  const [version, setVersion] = useState('');
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState<ReviewNotice | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingBatch, setDeletingBatch] = useState(false);
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

  const filters = {
    type: type || undefined,
    version: version || undefined,
    page,
    per_page: PER_PAGE,
  };
  const queryKey = toQueryString({ type, version, page });
  const { data, loading, error, reload } = useAsyncData<ReviewQueueResponse>(
    (signal) => listReviewQueue(filters, signal),
    {
      queryKey,
      fallback: '审核队列加载失败',
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

  // 删除后当前页可能已空，回退到上一页
  useEffect(() => {
    if (!loading && page > 1 && items.length === 0 && total > 0) {
      setPage((previous) => Math.max(1, previous - 1));
    }
  }, [loading, page, items.length, total]);

  function changeType(value: string) {
    setType(value);
    setPage(1);
  }

  function changeVersion(value: string) {
    setVersion(value);
    setPage(1);
  }

  function handleError(caught: unknown) {
    if (caught instanceof ApiError && caught.status !== 401) {
      setNotice({ tone: 'error', text: caught.message });
      return;
    }
    const message = resolveAdminError(caught, '操作失败，请重试', onUnauthorized);
    if (!message) return;
    setNotice({ tone: 'error', text: message });
  }

  async function handlePublish(item: ReviewQueueItem) {
    if (!canReview || pending) return;
    setPending(`${item.id}:publish`);
    setNotice(null);

    try {
      await publishContent(item.id);
      setNotice({ tone: 'ok', text: `《${item.title}》已发布。` });
      reload();
    } catch (caught) {
      handleError(caught);
    } finally {
      setPending(null);
    }
  }

  async function handleReject(item: ReviewQueueItem) {
    if (!canReview || pending) return;
    setPending(`${item.id}:reject`);
    setNotice(null);

    try {
      await rejectContent(item.id, rejectNote.trim());
      setNotice({ tone: 'ok', text: `《${item.title}》已驳回为草稿。` });
      setRejectingId(null);
      setRejectNote('');
      reload();
    } catch (caught) {
      handleError(caught);
    } finally {
      setPending(null);
    }
  }

  function toggleReject(itemId: string) {
    setRejectingId((previous) => (previous === itemId ? null : itemId));
    setRejectNote('');
  }

  async function deleteOne(item: ReviewQueueItem) {
    if (!canReview || deletingId || deletingBatch) return;
    if (!window.confirm(`确定删除《${item.title}》？删除后无法恢复。`)) return;

    setDeletingId(item.id);
    setNotice(null);
    try {
      await deleteReviewItem(item.id);
      deselect(item.id);
      setNotice({ tone: 'ok', text: `已删除《${item.title}》` });
      reload();
    } catch (caught) {
      handleError(caught);
    } finally {
      setDeletingId(null);
    }
  }

  async function deleteSelected() {
    if (!canReview || deletingId || deletingBatch || selectedIds.length === 0) return;
    if (
      !window.confirm(
        `确定删除选中的 ${selectedIds.length} 条内容？\n删除后无法恢复，这些内容会立即从审核队列中移除。`,
      )
    ) {
      return;
    }

    setDeletingBatch(true);
    setNotice(null);
    try {
      const payload = await deleteReviewItems(selectedIds);
      clearSelection();
      setNotice({ tone: 'ok', text: `已删除 ${payload.deleted} 条内容` });
      reload();
    } catch (caught) {
      handleError(caught);
    } finally {
      setDeletingBatch(false);
    }
  }

  return {
    type,
    changeType,
    version,
    changeVersion,
    page,
    setPage,
    totalPages,
    total,
    pending,
    notice,
    rejectingId,
    rejectNote,
    setRejectNote,
    contentTypes,
    items,
    counts: data?.counts,
    loading,
    error,
    reload,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    deletingId,
    deletingBatch,
    handlePublish,
    handleReject,
    toggleReject,
    deleteOne,
    deleteSelected,
  };
}
