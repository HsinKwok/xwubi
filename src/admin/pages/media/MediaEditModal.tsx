import { contentVersionOptions } from '../../lib/versions';
import type { MediaItem } from '../../lib/media-api';

interface MediaEditModalProps {
  item: MediaItem;
  alt: string;
  version: string;
  error: string | null;
  saving: boolean;
  onAltChange: (value: string) => void;
  onVersionChange: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
}

/** 图片信息编辑弹窗 */
export function MediaEditModal({
  item,
  alt,
  version,
  error,
  saving,
  onAltChange,
  onVersionChange,
  onCancel,
  onSave,
}: MediaEditModalProps) {
  const versions = contentVersionOptions();

  return (
    <div className="xw-media-modal" role="presentation" onClick={onCancel}>
      <div
        className="xw-media-modal__card"
        role="dialog"
        aria-modal="true"
        aria-label="编辑图片信息"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="xw-media-modal__title">编辑图片信息</h2>
        <div className="xw-media-modal__preview">
          <img src={item.url} alt={item.alt || item.filename} />
        </div>

        <label className="xw-field">
          <span className="xw-field__label">图片描述（alt）</span>
          <input
            className="xw-input"
            value={alt}
            maxLength={200}
            placeholder="用于无障碍阅读与搜索，建议简要描述画面"
            onChange={(event) => onAltChange(event.target.value)}
          />
        </label>

        <label className="xw-field">
          <span className="xw-field__label">适用码表版本</span>
          <select
            className="xw-select xw-select--block"
            value={version}
            onChange={(event) => onVersionChange(event.target.value)}
          >
            <option value="">未指定</option>
            {version && !versions.some((option) => option.value === version) ? (
              <option value={version}>{`${version.toUpperCase()}（已下线）`}</option>
            ) : null}
            {versions.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {error && <p className="xw-media-modal__error">{error}</p>}

        <div className="xw-media-modal__actions">
          <button
            type="button"
            className="xw-btn xw-btn--ghost xw-btn--sm"
            disabled={saving}
            onClick={onCancel}
          >
            取消
          </button>
          <button
            type="button"
            className="xw-btn xw-btn--primary xw-btn--sm"
            disabled={saving}
            onClick={onSave}
          >
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
