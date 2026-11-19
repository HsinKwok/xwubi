import { useEffect, useState } from 'react';
import { toQueryString } from '../../../shared/query';
import { resolveAdminError } from '../../lib/api';
import { useAsyncData } from '../../lib/use-async-data';
import { useSelection } from '../../lib/use-selection';
import {
  deleteSubmission,
  deleteSubmissions,
  listSubmissions,
  updateSubmission,
} from '../../lib/inbox-api';
import type { InboxListResponse, SubmissionItem, SubmissionStatus } from '../../lib/inbox-api';
import { SUBMISSION_STATUS_LABELS } from './inbox-shared';
import type { Notice } from './inbox-shared';

/**
 * 投稿列表的筛选、分页、状态流转与删除逻辑。
 */
export function useSubmissions({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingBatch, setDeletingBatch] = useState(false);

  const filters = { status: status || undefined, page, per_page: 20 };
  const queryKey = toQueryString(filters);
  const { data, loading, error, reload } = useAsyncData<InboxListResponse<SubmissionItem>>(
    (signal) => listSubmissions(filters, signal),
    {
      queryKey,
      fallback: '投稿列表加载失败',
      onUnauthorized,
    },
  );

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const { selectedIds, toggleSelect, toggleSelectAll, clearSelection, deselect } = useSelection(
    items,
    { resetKey: queryKey },
  );

  useEffect(() => {
    if (!loading && page > 1 && items.length === 0 && total > 0) {
      setPage((previous) => Math.max(1, previous - 1));
    }
  }, [loading, page, items.length, total]);

  function handleError(caught: unknown) {
    const message = resolveAdminError(caught, '操作失败，请重试', onUnauthorized);
    if (!message) return;
    setNotice({ tone: 'error', text: message });
  }

  async function changeStatus(item: SubmissionItem, next: SubmissionStatus, reason?: string) {
    if (pending) return;
    setPending(`${item.id}:${next}`);
    setNotice(null);

    try {
      await updateSubmission(item.id, { status: next, reject_reason: reason });
      setNotice({ tone: 'ok', text: `《${item.title}》已更新为${SUBMISSION_STATUS_LABELS[next]}。` });
      setRejectingId(null);
      setRejectNote('');
      reload();
    } catch (caught) {
      handleError(caught);
    } finally {
      setPending(null);
    }
  }

  /** 切换状态筛选并回到第一页 */
  function changeStatusFilter(value: string) {
    setStatus(value);
    setPage(1);
  }

  function toggleReject(id: string) {
    setRejectingId((current) => (current === id ? null : id));
    setRejectNote('');
  }

  function cancelReject() {
    setRejectingId(null);
    setRejectNote('');
  }

  async function deleteOne(item: SubmissionItem) {
    if (deletingId || deletingBatch) return;
    if (!window.confirm(`确定删除投稿《${item.title}》？删除后无法恢复。`)) return;

    setDeletingId(item.id);
    setNotice(null);
    try {
      await deleteSubmission(item.id);
      deselect(item.id);
      setNotice({ tone: 'ok', text: `已删除投稿《${item.title}》` });
      reload();
    } catch (caught) {
      handleError(caught);
    } finally {
      setDeletingId(null);
    }
  }

  async function deleteSelected() {
    if (deletingId || deletingBatch || selectedIds.length === 0) return;
    if (
      !window.confirm(
        `确定删除选中的 ${selectedIds.length} 条投稿？\n删除后无法恢复，这些投稿记录将从列表中移除。`,
      )
    ) {
      return;
    }

    setDeletingBatch(true);
    setNotice(null);
    try {
      const payload = await deleteSubmissions(selectedIds);
      clearSelection();
      setNotice({ tone: 'ok', text: `已删除 ${payload.deleted} 条投稿` });
      reload();
    } catch (caught) {
      handleError(caught);
    } finally {
      setDeletingBatch(false);
    }
  }

  return {
    data,
    items,
    loading,
    error,
    reload,
    status,
    changeStatusFilter,
    page,
    setPage,
    pending,
    notice,
    rejectingId,
    rejectNote,
    setRejectNote,
    changeStatus,
    toggleReject,
    cancelReject,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    deletingId,
    deletingBatch,
    deleteOne,
    deleteSelected,
  };
}
