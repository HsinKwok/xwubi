import type { MouseEvent as ReactMouseEvent } from 'react';
import { Icon } from '../../components/icons';
import type { AdminContentItem } from '../../lib/content-api';
import { CONTENT_STATUS_LABELS, typeLabel } from './content-meta';
import type { TypeOption } from './content-meta';
import { formatDate, publicHref } from './editor-format';

export interface EditorHeaderProps {
  item: AdminContentItem | null;
  title: string;
  contentTypes: TypeOption[];
  itemRoute: string | undefined;
  dirty: boolean;
  pending: string | null;
  canEdit: boolean;
  canReview: boolean;
  onGo: (event: ReactMouseEvent<HTMLAnchorElement>, href: string) => void;
  onSave: () => void;
  onSubmit: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onArchive: () => void;
}

export function EditorHeader({
  item,
  title,
  contentTypes,
  itemRoute,
  dirty,
  pending,
  canEdit,
  canReview,
  onGo,
  onSave,
  onSubmit,
  onPublish,
  onUnpublish,
  onArchive,
}: EditorHeaderProps) {
  return (
    <header className="xw-editor__head">
      <div className="xw-editor__heading">
        <a
          className="xw-editor__back"
          href="/admin/content"
          onClick={(event) => onGo(event, '/admin/content')}
        >
          <Icon name="chevronLeft" size={14} />
          内容管理
        </a>
        <h1 className="xw-editor__title">{title}</h1>
        <p className="xw-editor__sub">
          {item ? (
            <>
              <span className={`xw-status xw-status--${item.status}`}>
                {CONTENT_STATUS_LABELS[item.status]}
              </span>
              <span>{typeLabel(item.type, contentTypes)}</span>
              <span>更新于 {formatDate(item.updated_at)}</span>
              <span>作者 {item.author ?? '—'}</span>
              {dirty && <span className="xw-editor__dirty">有未保存改动</span>}
            </>
          ) : (
            <span>填写标题与正文后先保存草稿，再提交审核。</span>
          )}
        </p>
      </div>

      <div className="xw-editor__actions">
        {item?.status === 'published' && (
          <a
            className="xw-btn xw-btn--ghost"
            href={publicHref(item, itemRoute)}
            target="_blank"
            rel="noreferrer"
          >
            查看前台
            <Icon name="external" size={14} />
          </a>
        )}

        {canEdit && (
          <button type="button" className="xw-btn xw-btn--ghost" disabled={pending !== null} onClick={onSave}>
            {pending === 'save' ? '保存中…' : '保存'}
          </button>
        )}

        {canEdit && item && (item.status === 'draft' || item.status === 'needs_review') && (
          <button
            type="button"
            className="xw-btn xw-btn--ghost"
            disabled={pending !== null}
            onClick={onSubmit}
          >
            {pending === 'submit' ? '提交中…' : '提交审核'}
          </button>
        )}

        {canReview && item && item.status !== 'published' && item.status !== 'archived' && (
          <button
            type="button"
            className="xw-btn xw-btn--primary"
            disabled={pending !== null}
            onClick={onPublish}
          >
            {pending === 'publish' ? '发布中…' : '发布'}
          </button>
        )}

        {canReview && item?.status === 'published' && (
          <button
            type="button"
            className="xw-btn xw-btn--ghost"
            disabled={pending !== null}
            onClick={onUnpublish}
          >
            下架
          </button>
        )}

        {canReview && item && item.status !== 'archived' && (
          <button
            type="button"
            className="xw-btn xw-btn--ghost"
            disabled={pending !== null}
            onClick={onArchive}
          >
            归档
          </button>
        )}
      </div>
    </header>
  );
}
