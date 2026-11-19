import type { MouseEvent as ReactMouseEvent } from 'react';
import type { ReviewQueueItem } from '../../lib/content-api';
import { CONTENT_STATUS_LABELS, typeLabel } from '../content/content-meta';
import { versionLabel } from '../../lib/versions';
import { formatShortDateTime as formatDate } from '../../lib/format';

interface ReviewCardProps {
  item: ReviewQueueItem;
  contentTypes: Array<{ slug: string; label: string }>;
  canReview: boolean;
  pending: string | null;
  rejecting: boolean;
  rejectNote: string;
  selected: boolean;
  deleting: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
  onRejectNoteChange: (value: string) => void;
  onOpen: (href: string) => void;
  onPublish: () => void;
  onToggleReject: () => void;
  onCancelReject: () => void;
  onReject: () => void;
}

/** 审核队列单条卡片：状态、问题清单与发布/驳回操作 */
export function ReviewCard({
  item,
  contentTypes,
  canReview,
  pending,
  rejecting,
  rejectNote,
  selected,
  deleting,
  onToggleSelect,
  onDelete,
  onRejectNoteChange,
  onOpen,
  onPublish,
  onToggleReject,
  onCancelReject,
  onReject,
}: ReviewCardProps) {
  const detailHref = `/admin/content/${item.id}`;

  function go(event: ReactMouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    onOpen(detailHref);
  }

  return (
    <article className="xw-review-card">
      <div className="xw-review-card__main">
        <div className="xw-review-card__top">
          {canReview && (
            <input
              type="checkbox"
              className="xw-check"
              checked={selected}
              onChange={onToggleSelect}
              aria-label={`选择《${item.title}》`}
            />
          )}
          <span className="xw-tag">{typeLabel(item.type, contentTypes)}</span>
          <span className="xw-review-card__version">{versionLabel(item.version)}</span>
          <span className={`xw-status xw-status--${item.status}`}>
            {CONTENT_STATUS_LABELS[item.status]}
          </span>
          {item.ready ? (
            <span className="xw-review-card__ready">可发布</span>
          ) : (
            <span className="xw-review-card__blocked">缺 {item.problems.length} 项</span>
          )}
        </div>

        <a className="xw-review-card__title" href={detailHref} onClick={go}>
          {item.title}
        </a>

        <p className="xw-review-card__meta">
          {item.author ?? '站内编辑'} · {formatDate(item.updated_at)} 提交
        </p>

        {item.problems.length > 0 && (
          <ul className="xw-review-card__problems">
            {item.problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="xw-review-card__actions">
        <a className="xw-btn xw-btn--ghost xw-btn--sm" href={detailHref} onClick={go}>
          查看
        </a>
        {canReview && (
          <button
            type="button"
            className="xw-btn xw-btn--danger xw-btn--sm"
            disabled={pending !== null || deleting}
            onClick={onDelete}
          >
            {deleting ? '删除中…' : '删除'}
          </button>
        )}
        {canReview && (
          <>
            <button
              type="button"
              className="xw-btn xw-btn--primary xw-btn--sm"
              disabled={!item.ready || pending !== null}
              title={item.ready ? undefined : '还有未满足的发布条件'}
              onClick={onPublish}
            >
              {pending === `${item.id}:publish` ? '发布中…' : '发布'}
            </button>
            <button
              type="button"
              className="xw-btn xw-btn--ghost xw-btn--sm"
              disabled={pending !== null}
              onClick={onToggleReject}
            >
              驳回
            </button>
          </>
        )}
      </div>

      {canReview && rejecting && (
        <div className="xw-review-card__reject">
          <label className="xw-field">
            <span className="xw-field__label">驳回说明</span>
            <textarea
              className="xw-textarea"
              rows={2}
              value={rejectNote}
              placeholder="告诉作者需要补充什么，会写入修订记录"
              onChange={(event) => onRejectNoteChange(event.target.value)}
            />
          </label>
          <div className="xw-review-card__reject-actions">
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
              {pending === `${item.id}:reject` ? '驳回中…' : '确认驳回'}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
