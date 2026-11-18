import { versionLabel } from '../../lib/versions';
import type { SubmissionItem, SubmissionStatus } from '../../lib/inbox-api';
import {
  SUBMISSION_KIND_LABELS,
  SUBMISSION_STATUS_LABELS,
  formatDate,
} from './inbox-shared';

interface Props {
  item: SubmissionItem;
  pending: string | null;
  rejecting: boolean;
  rejectNote: string;
  onChangeRejectNote: (value: string) => void;
  onStatus: (next: SubmissionStatus) => void;
  onReject: () => void;
  onToggleReject: () => void;
  onCancelReject: () => void;
}

/** 单条投稿卡片：内容信息与受理、采纳、拒绝、垃圾操作 */
export function SubmissionCard({
  item,
  pending,
  rejecting,
  rejectNote,
  onChangeRejectNote,
  onStatus,
  onReject,
  onToggleReject,
  onCancelReject,
}: Props) {
  const actionable =
    item.status === 'new' || item.status === 'confirmed' || item.status === 'claimed';

  return (
    <article className="xw-review-card">
      <div className="xw-review-card__main">
        <div className="xw-review-card__top">
          <span className="xw-tag">{SUBMISSION_KIND_LABELS[item.kind] ?? item.kind}</span>
          {item.version && (
            <span className="xw-review-card__version">{versionLabel(item.version)}</span>
          )}
          <span className={`xw-status xw-status--${item.status}`}>
            {SUBMISSION_STATUS_LABELS[item.status] ?? item.status}
          </span>
        </div>

        <h3 className="xw-inbox-card__title">{item.title}</h3>

        <p className="xw-inbox-card__meta">
          <span>
            {item.display_name || '匿名'} · {item.email}
          </span>
          <span>{formatDate(item.created_at)} 提交</span>
        </p>

        {item.note && <p className="xw-inbox-card__body">{item.note}</p>}

        {(item.url || item.page_url) && (
          <p className="xw-inbox-card__fact">
            {item.url && (
              <a className="xw-inbox-card__link" href={item.url} target="_blank" rel="noreferrer">
                相关链接 ↗
              </a>
            )}
            {item.page_url && (
              <a
                className="xw-inbox-card__link"
                href={item.page_url}
                target="_blank"
                rel="noreferrer"
              >
                出错页面 ↗
              </a>
            )}
          </p>
        )}

        {item.reject_reason && (
          <p className="xw-inbox-card__reason">拒绝原因：{item.reject_reason}</p>
        )}
      </div>

      <div className="xw-review-card__actions">
        {actionable ? (
          <>
            {item.status !== 'claimed' && (
              <button
                type="button"
                className="xw-btn xw-btn--ghost xw-btn--sm"
                disabled={pending !== null}
                onClick={() => onStatus('claimed')}
              >
                受理
              </button>
            )}
            <button
              type="button"
              className="xw-btn xw-btn--primary xw-btn--sm"
              disabled={pending !== null}
              onClick={() => onStatus('accepted')}
            >
              {pending === `${item.id}:accepted` ? '处理中…' : '采纳'}
            </button>
            <button
              type="button"
              className="xw-btn xw-btn--ghost xw-btn--sm"
              disabled={pending !== null}
              onClick={onToggleReject}
            >
              拒绝
            </button>
            <button
              type="button"
              className="xw-btn xw-btn--ghost xw-btn--sm"
              disabled={pending !== null}
              onClick={() => onStatus('spam')}
            >
              垃圾
            </button>
          </>
        ) : (
          <span className="xw-toolbar__count">已处理</span>
        )}
      </div>

      {rejecting && (
        <div className="xw-inbox-card__reject">
          <label className="xw-field">
            <span className="xw-field__label">拒绝说明</span>
            <textarea
              className="xw-textarea"
              rows={2}
              value={rejectNote}
              placeholder="简要说明拒绝原因，可留空"
              onChange={(event) => onChangeRejectNote(event.target.value)}
            />
          </label>
          <div className="xw-inbox-card__reject-actions">
            <button
              type="button"
              className="xw-btn xw-btn--ghost xw-btn--sm"
              onClick={onCancelReject}
            >
              取消
            </button>
            <button
              type="button"
              className="xw-btn xw-btn--primary xw-btn--sm"
              disabled={pending !== null}
              onClick={onReject}
            >
              {pending === `${item.id}:rejected` ? '拒绝中…' : '确认拒绝'}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
