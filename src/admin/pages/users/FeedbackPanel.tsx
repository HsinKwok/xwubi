import { useEffect, useState } from 'react';
import { Icon } from '../../components/icons';
import { toQueryString } from '../../../shared/query';
import { resolveAdminError } from '../../lib/api';
import { useAsyncData } from '../../lib/use-async-data';
import { versionLabel } from '../../lib/versions';
import {
  FEEDBACK_STATUSES,
  deleteFeedback,
  deleteFeedbacks,
  listFeedback,
  updateFeedback,
} from '../../lib/inbox-api';
import type { FeedbackItem, FeedbackStatus, InboxListResponse } from '../../lib/inbox-api';
import { FEEDBACK_STATUS_LABELS, formatDate } from './inbox-shared';
import type { Notice } from './inbox-shared';
import { Pager } from '../../components/Pager';
import { NoticeBar } from '../../components/NoticeBar';
import { useSelection } from '../../lib/use-selection';

export function FeedbackPanel({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingBatch, setDeletingBatch] = useState(false);

  const filters = { status: status || undefined, page, per_page: 20 };
  const queryKey = toQueryString(filters);
  const { data, loading, error, reload } = useAsyncData<InboxListResponse<FeedbackItem>>(
    (signal) => listFeedback(filters, signal),
    {
      queryKey,
      fallback: '纠错列表加载失败',
      onUnauthorized,
    },
  );

  const items = data?.items ?? [];
  const counts = data?.counts ?? {};
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / (data?.per_page ?? 20)));
  const { selectedIds, allSelected, toggleSelect, toggleSelectAll, clearSelection, deselect } =
    useSelection(items, { resetKey: queryKey });

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

  async function changeStatus(item: FeedbackItem, next: FeedbackStatus) {
    if (pending) return;
    setPending(`${item.id}:${next}`);
    setNotice(null);

    try {
      await updateFeedback(item.id, { status: next });
      setNotice({ tone: 'ok', text: `纠错工单已更新为${FEEDBACK_STATUS_LABELS[next]}。` });
      reload();
    } catch (caught) {
      handleError(caught);
    } finally {
      setPending(null);
    }
  }

  async function deleteOne(item: FeedbackItem) {
    if (deletingId || deletingBatch) return;
    if (!window.confirm(`确定删除这条纠错记录？删除后无法恢复。\n${item.page_url}`)) return;

    setDeletingId(item.id);
    setNotice(null);
    try {
      await deleteFeedback(item.id);
      deselect(item.id);
      setNotice({ tone: 'ok', text: '已删除纠错记录' });
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
        `确定删除选中的 ${selectedIds.length} 条纠错记录？\n删除后无法恢复，提交者查询反馈时将不再显示这些记录。`,
      )
    ) {
      return;
    }

    setDeletingBatch(true);
    setNotice(null);
    try {
      const payload = await deleteFeedbacks(selectedIds);
      clearSelection();
      setNotice({ tone: 'ok', text: `已删除 ${payload.deleted} 条纠错记录` });
      reload();
    } catch (caught) {
      handleError(caught);
    } finally {
      setDeletingBatch(false);
    }
  }

  return (
    <>
      <div className="xw-toolbar">
        <select
          className="xw-select"
          aria-label="按状态筛选纠错"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
        >
          <option value="">全部状态</option>
          {FEEDBACK_STATUSES.map((item) => (
            <option value={item} key={item}>
              {FEEDBACK_STATUS_LABELS[item]}（{counts[item] ?? 0}）
            </option>
          ))}
        </select>

        <label className="xw-check-line">
          <input
            type="checkbox"
            className="xw-check"
            checked={allSelected}
            onChange={toggleSelectAll}
            disabled={items.length === 0}
          />
          全选本页
        </label>

        <span className="xw-toolbar__spacer" />
        {selectedIds.length > 0 && (
          <button
            type="button"
            className="xw-btn xw-btn--danger xw-btn--sm"
            disabled={deletingBatch}
            onClick={() => void deleteSelected()}
          >
            {deletingBatch ? '删除中…' : `批量删除（${selectedIds.length}）`}
          </button>
        )}
        <span className="xw-toolbar__count">{loading ? '加载中…' : `纠错 ${data?.total ?? 0} 条`}</span>
        <button
          type="button"
          className="xw-btn xw-btn--ghost xw-btn--sm"
          disabled={loading}
          onClick={reload}
        >
          <Icon name="checkSquare" size={15} />
          刷新
        </button>
      </div>

      <NoticeBar notice={notice} />

      {error ? (
        <div className="xw-panel">
          <div className="xw-empty">
            <Icon name="shield" size={22} />
            <p>{error}</p>
            <button
              type="button"
              className="xw-btn xw-btn--ghost xw-btn--sm"
              onClick={reload}
            >
              重新加载
            </button>
          </div>
        </div>
      ) : !loading && items.length === 0 ? (
        <div className="xw-panel">
          <div className="xw-empty">
            <Icon name="shield" size={22} />
            <p>没有符合条件的纠错记录。</p>
          </div>
        </div>
      ) : (
        <div className="xw-review">
          {items.map((item) => {
            const actionable = item.status === 'open' || item.status === 'assigned';

            return (
              <article className="xw-review-card" key={item.id}>
                <div className="xw-review-card__main">
                  <div className="xw-review-card__top">
                    <input
                      type="checkbox"
                      className="xw-check"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      aria-label="选择这条纠错记录"
                    />
                    {item.version && (
                      <span className="xw-review-card__version">
                        {versionLabel(item.version)}
                      </span>
                    )}
                    <span className={`xw-status xw-status--${item.status}`}>
                      {FEEDBACK_STATUS_LABELS[item.status] ?? item.status}
                    </span>
                  </div>

                  <a
                    className="xw-inbox-card__title"
                    href={item.page_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {item.page_url}
                  </a>

                  <p className="xw-inbox-card__meta">
                    <span>{item.email || '未留邮箱'}</span>
                    <span>{formatDate(item.created_at)} 提交</span>
                  </p>

                  <p className="xw-inbox-card__body">{item.body}</p>
                </div>

                <div className="xw-review-card__actions">
                  {actionable ? (
                    <>
                      {item.status !== 'assigned' && (
                        <button
                          type="button"
                          className="xw-btn xw-btn--ghost xw-btn--sm"
                          disabled={pending !== null}
                          onClick={() => changeStatus(item, 'assigned')}
                        >
                          处理中
                        </button>
                      )}
                      <button
                        type="button"
                        className="xw-btn xw-btn--primary xw-btn--sm"
                        disabled={pending !== null}
                        onClick={() => changeStatus(item, 'fixed')}
                      >
                        {pending === `${item.id}:fixed` ? '处理中…' : '标记修复'}
                      </button>
                      <button
                        type="button"
                        className="xw-btn xw-btn--ghost xw-btn--sm"
                        disabled={pending !== null}
                        onClick={() => changeStatus(item, 'closed')}
                      >
                        关闭
                      </button>
                      <button
                        type="button"
                        className="xw-btn xw-btn--ghost xw-btn--sm"
                        disabled={pending !== null}
                        onClick={() => changeStatus(item, 'spam')}
                      >
                        垃圾
                      </button>
                    </>
                  ) : (
                    <span className="xw-toolbar__count">已处理</span>
                  )}
                  <button
                    type="button"
                    className="xw-btn xw-btn--danger xw-btn--sm"
                    disabled={pending !== null || deletingId === item.id}
                    onClick={() => void deleteOne(item)}
                  >
                    {deletingId === item.id ? '删除中…' : '删除'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {data && (
        <Pager
          page={page}
          totalPages={totalPages}
          total={total}
          hideOnSinglePage
          onChange={setPage}
        />
      )}
    </>
  );
}
