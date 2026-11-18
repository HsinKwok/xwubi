import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../components/icons';
import { toQueryString } from '../../../shared/query';
import { resolveAdminError } from '../../lib/api';
import { useAsyncData } from '../../lib/use-async-data';
import { listMedia, uploadMedia } from '../../lib/media-api';
import type { MediaItem, MediaListResponse } from '../../lib/media-api';
import '../../styles/media.css';

const PER_PAGE = 24;
const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,image/avif';

export interface MediaPickerProps {
  open: boolean;
  allowUpload: boolean;
  onClose: () => void;
  onSelect: (item: MediaItem) => void;
  onUnauthorized?: () => void;
}

export function MediaPicker({ open, allowUpload, onClose, onSelect, onUnauthorized }: MediaPickerProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [keyword, setKeyword] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(keyword.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [keyword]);

  const filters = { q: query || undefined, page, per_page: PER_PAGE };
  const { data, loading, error, setError, reload } = useAsyncData<MediaListResponse>(
    (signal) => listMedia(filters, signal),
    {
      queryKey: toQueryString(filters),
      enabled: open,
      fallback: '媒体库加载失败',
      onUnauthorized,
    },
  );
  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;

    setUploading(true);
    setError(null);
    try {
      for (const file of list) {
        try {
          await uploadMedia(file);
        } catch (caught) {
          const message = resolveAdminError(caught, '上传失败', onUnauthorized);
          if (!message) return;
          setError(message);
        }
      }
    } finally {
      setUploading(false);
    }
    setPage(1);
    reload();
  }

  return (
    <div className="xw-media-modal" role="presentation" onClick={onClose}>
      <div
        className="xw-media-modal__card xw-media-modal__card--wide"
        role="dialog"
        aria-modal="true"
        aria-label="从媒体库选择图片"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="xw-media-picker__head">
          <div>
            <h2 className="xw-media-modal__title">从媒体库选择图片</h2>
            <p className="xw-field__hint">点击图片即可插入到正文当前光标位置。</p>
          </div>
          <button type="button" className="xw-icon-btn" aria-label="关闭" onClick={onClose}>
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="xw-media-picker__bar">
          <label className="xw-search">
            <Icon name="search" size={16} />
            <input
              type="search"
              value={keyword}
              placeholder="搜索文件名或描述"
              aria-label="搜索媒体"
              onChange={(event) => setKeyword(event.target.value)}
            />
          </label>

          <span className="xw-toolbar__spacer" />
          <span className="xw-toolbar__count">{loading ? '加载中…' : `共 ${total} 张`}</span>

          {allowUpload && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPT}
                multiple
                hidden
                onChange={(event) => {
                  if (event.target.files) void handleFiles(event.target.files);
                  event.target.value = '';
                }}
              />
              <button
                type="button"
                className="xw-btn xw-btn--ghost xw-btn--sm"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? '上传中…' : '上传新图'}
              </button>
            </>
          )}
        </div>

        {error && <p className="xw-media-modal__error">{error}</p>}

        {!loading && items.length === 0 ? (
          <div className="xw-empty">
            <Icon name="image" size={22} />
            <p>{query ? '没有匹配的图片' : '媒体库还是空的'}</p>
          </div>
        ) : (
          <div className={`xw-media-picker__grid${loading ? ' is-refreshing' : ''}`}>
            {items.map((item) => (
              <button
                type="button"
                className="xw-media-picker__item"
                key={item.id}
                title={item.alt || item.filename}
                onClick={() => onSelect(item)}
              >
                <img src={item.url} alt={item.alt || item.filename} loading="lazy" />
                <span>{item.filename}</span>
              </button>
            ))}
          </div>
        )}

        <div className="xw-media-picker__foot">
          <span className="xw-toolbar__count">
            第 {page} / {totalPages} 页
          </span>
          <div className="xw-media-picker__pager">
            <button
              type="button"
              className="xw-btn xw-btn--ghost xw-btn--sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              上一页
            </button>
            <button
              type="button"
              className="xw-btn xw-btn--ghost xw-btn--sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
