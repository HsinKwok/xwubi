import { useEffect, useState } from 'react';
import { toQueryString } from '../../../shared/query';
import { ApiError, resolveAdminError } from '../../lib/api';
import { useAsyncData } from '../../lib/use-async-data';
import { listReviewQueue, publishContent, rejectContent } from '../../lib/content-api';
import type { ReviewQueueItem, ReviewQueueResponse } from '../../lib/content-api';
import { listCategories } from '../../lib/categories-api';
import type { CategoryItem } from '../../lib/categories-api';

export interface ReviewNotice {
  tone: 'ok' | 'error';
  text: string;
}

interface Options {
  canReview: boolean;
  onUnauthorized: () => void;
}

/** 审核队列的筛选、加载与发布/驳回操作 */
export function useReviewQueue({ canReview, onUnauthorized }: Options) {
  const [type, setType] = useState('');
  const [version, setVersion] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState<ReviewNotice | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
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

  const filters = { type: type || undefined, version: version || undefined };
  const { data, loading, error, reload } = useAsyncData<ReviewQueueResponse>(
    (signal) => listReviewQueue(filters, signal),
    {
      queryKey: toQueryString(filters),
      fallback: '审核队列加载失败',
      onUnauthorized,
    },
  );

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

  return {
    type,
    setType,
    version,
    setVersion,
    pending,
    notice,
    rejectingId,
    rejectNote,
    setRejectNote,
    contentTypes,
    items: data?.items ?? [],
    counts: data?.counts,
    loading,
    error,
    reload,
    handlePublish,
    handleReject,
    toggleReject,
  };
}
