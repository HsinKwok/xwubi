import { formatDateTime, formatSize } from '../../lib/format';
import { versionLabel } from '../../lib/versions';
import type { MediaItem } from '../../lib/media-api';

interface MediaGridProps {
  items: MediaItem[];
  loading: boolean;
  canWrite: boolean;
  canDelete: boolean;
  deletingId: string | null;
  onCopy: (item: MediaItem) => void;
  onEdit: (item: MediaItem) => void;
  onDelete: (item: MediaItem) => void;
}

function optionalVersionLabel(version: string | null): string | null {
  return version ? versionLabel(version) : null;
}

/** 媒体卡片网格 */
export function MediaGrid({
  items,
  loading,
  canWrite,
  canDelete,
  deletingId,
  onCopy,
  onEdit,
  onDelete,
}: MediaGridProps) {
  return (
    <div className={`xw-media-grid${loading ? ' is-refreshing' : ''}`}>
      {items.map((item) => {
        const versionText = optionalVersionLabel(item.version);
        return (
          <figure className="xw-media-card" key={item.id}>
            <div className="xw-media-card__thumb">
              <img src={item.url} alt={item.alt || item.filename} loading="lazy" />
            </div>
            <figcaption className="xw-media-card__body">
              <p className="xw-media-card__name" title={item.filename}>
                {item.filename}
              </p>
              <p className="xw-media-card__meta">
                {formatSize(item.size)}
                {versionText ? ` · ${versionText}` : ''}
                {` · ${formatDateTime(item.created_at)}`}
              </p>
              <p
                className={`xw-media-card__alt${item.alt ? '' : ' is-empty'}`}
                title={item.alt || undefined}
              >
                {item.alt || '未填写描述'}
              </p>
              <div className="xw-media-card__actions">
                <button
                  type="button"
                  className="xw-btn xw-btn--ghost xw-btn--sm"
                  onClick={() => onCopy(item)}
                >
                  复制地址
                </button>
                {canWrite && (
                  <button
                    type="button"
                    className="xw-btn xw-btn--ghost xw-btn--sm"
                    onClick={() => onEdit(item)}
                  >
                    编辑
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    className="xw-btn xw-btn--ghost xw-btn--sm xw-media-card__danger"
                    disabled={deletingId === item.id}
                    onClick={() => onDelete(item)}
                  >
                    {deletingId === item.id ? '删除中…' : '删除'}
                  </button>
                )}
              </div>
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
