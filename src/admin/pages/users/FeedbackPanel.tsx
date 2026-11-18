import { useState } from 'react';
import { Icon } from '../../components/icons';
import { toQueryString } from '../../../shared/query';
import { resolveAdminError } from '../../lib/api';
import { useAsyncData } from '../../lib/use-async-data';
import { versionLabel } from '../../lib/versions';
import { FEEDBACK_STATUSES, listFeedback, updateFeedback } from '../../lib/inbox-api';
import type { FeedbackItem, FeedbackStatus, InboxListResponse } from '../../lib/inbox-api';
import { FEEDBACK_STATUS_LABELS, Pager, formatDate } from './inbox-shared';
import type { Notice } from './inbox-shared';

export function FeedbackPanel({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const filters = { status: status || undefined, page, per_page: 20 };
  const { data, loading, error, reload } = useAsyncData<InboxListResponse<FeedbackItem>>(
    (signal) => listFeedback(filters, signal),
    {
      queryKey: toQueryString(filters),
      fallback: '纠错列表加载失败',
      onUnauthorized,
    },
  );

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

  const items = data?.items ?? [];
  const counts = data?.counts ?? {};

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
        <span className="xw-toolbar__spacer" />
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

      {notice && (
        <div className={`xw-notice xw-notice--${notice.tone}`} role="status">
          {notice.text}
        </div>
      )}

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
                </div>
              </article>
            );
          })}
        </div>
      )}

      {data && (
        <Pager total={data.total} page={data.page} perPage={data.per_page} onChange={setPage} />
      )}
    </>
  );
}
