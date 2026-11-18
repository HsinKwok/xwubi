import type { RevisionItem } from '../../lib/content-api';
import { formatDate } from './editor-format';

export interface RevisionPanelProps {
  revisions: RevisionItem[];
  canEdit: boolean;
  pending: string | null;
  restoring: number | null;
  onRestore: (revision: RevisionItem) => void;
}

export function RevisionPanel({ revisions, canEdit, pending, restoring, onRestore }: RevisionPanelProps) {
  return (
    <section className="xw-panel">
      <div className="xw-panel__head">
        <h2 className="xw-panel__title">修订记录</h2>
        {revisions.length > 0 && <span className="xw-panel__count">{revisions.length}</span>}
      </div>
      <div className="xw-panel__body">
        {revisions.length === 0 ? (
          <p className="xw-field__hint">保存后会在这里生成修订记录。</p>
        ) : (
          <ol className="xw-revisions">
            {revisions.slice(0, 8).map((revision) => (
              <li className="xw-revision" key={revision.id}>
                <span className="xw-revision__no">#{revision.revision_no}</span>
                <div className="xw-revision__body">
                  <p className="xw-revision__title">{revision.title}</p>
                  <p className="xw-revision__meta">
                    {revision.editor ?? '系统'} · {formatDate(revision.created_at)}
                    {revision.note ? ` · ${revision.note}` : ''}
                  </p>
                </div>
                {canEdit && (
                  <button
                    type="button"
                    className="xw-btn xw-btn--ghost xw-btn--sm xw-revision__action"
                    disabled={pending !== null || restoring !== null}
                    onClick={() => onRestore(revision)}
                  >
                    {restoring === revision.id ? '回滚中…' : '回滚'}
                  </button>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
