import { useState } from 'react';
import { toQueryString } from '../../../shared/query';
import { resolveAdminError } from '../../lib/api';
import { useAsyncData } from '../../lib/use-async-data';
import { listSubmissions, updateSubmission } from '../../lib/inbox-api';
import type { InboxListResponse, SubmissionItem, SubmissionStatus } from '../../lib/inbox-api';
import { SUBMISSION_STATUS_LABELS } from './inbox-shared';
import type { Notice } from './inbox-shared';

/**
 * 投稿列表的筛选、分页与状态流转逻辑。
 */
export function useSubmissions({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  const filters = { status: status || undefined, page, per_page: 20 };
  const { data, loading, error, reload } = useAsyncData<InboxListResponse<SubmissionItem>>(
    (signal) => listSubmissions(filters, signal),
    {
      queryKey: toQueryString(filters),
      fallback: '投稿列表加载失败',
      onUnauthorized,
    },
  );

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

  return {
    data,
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
  };
}
