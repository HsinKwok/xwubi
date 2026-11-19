import { Icon } from '../../components/icons';
import { NoticeBar } from '../../components/NoticeBar';
import { Pager } from '../../components/Pager';
import type { AdminUser } from '../../types';
import { contentVersionOptions } from '../../lib/versions';
import { MediaEditModal } from './MediaEditModal';
import { MediaGrid } from './MediaGrid';
import { MediaUploadDrop } from './MediaUploadDrop';
import { useMediaLibrary } from './use-media-library';
import '../../styles/media.css';

export interface MediaPageProps {
  user: AdminUser;
  onUnauthorized: () => void;
}

export function MediaPage({ user, onUnauthorized }: MediaPageProps) {
  const canWrite = user.role !== 'reviewer';
  const canDelete = user.role === 'admin';

  const {
    keyword,
    setKeyword,
    query,
    version,
    changeVersion,
    page,
    setPage,
    totalPages,
    uploading,
    deletingId,
    notice,
    setNotice,
    editing,
    closeEdit,
    editAlt,
    setEditAlt,
    editVersion,
    setEditVersion,
    editError,
    saving,
    items,
    total,
    loading,
    error,
    reload,
    handleFiles,
    copyUrl,
    openEdit,
    saveEdit,
    remove,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    batchDeleting,
    deleteSelected,
  } = useMediaLibrary({ canWrite, onUnauthorized });

  const allSelected =
    items.length > 0 && items.every((item) => selectedIds.includes(item.id));

  return (
    <div className="xw-content">
      <header className="xw-content__head">
        <div>
          <p className="xw-content__eyebrow">MEDIA</p>
          <h1 className="xw-content__title">媒体库</h1>
          <p className="xw-content__desc">
            上传内容配图，复制公开地址后在正文中引用。支持 PNG、JPEG、WebP、GIF、AVIF，单张不超过 8MB。
          </p>
        </div>
      </header>

      <NoticeBar notice={notice} onClose={() => setNotice(null)} />

      <MediaUploadDrop canWrite={canWrite} uploading={uploading} onFiles={handleFiles} />

      <div className="xw-toolbar">
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

        <select
          className="xw-select"
          aria-label="按码表版本筛选"
          value={version}
          onChange={(event) => changeVersion(event.target.value)}
        >
          <option value="">全部版本</option>
          {contentVersionOptions().map((item) => (
            <option value={item.value} key={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <span className="xw-toolbar__spacer" />
        {canDelete && (
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
        )}
        {canDelete && selectedIds.length > 0 && (
          <button
            type="button"
            className="xw-btn xw-btn--danger xw-btn--sm"
            disabled={batchDeleting}
            onClick={() => void deleteSelected()}
          >
            {batchDeleting ? '删除中…' : `批量删除（${selectedIds.length}）`}
          </button>
        )}
        <span className="xw-toolbar__count">{loading ? '加载中…' : `共 ${total} 张`}</span>
      </div>

      {error ? (
        <div className="xw-panel">
          <div className="xw-empty">
            <Icon name="shield" size={22} />
            <p>{error}</p>
            <button
              type="button"
              className="xw-btn xw-btn--ghost xw-btn--sm"
              onClick={() => reload()}
            >
              重新加载
            </button>
          </div>
        </div>
      ) : !loading && items.length === 0 ? (
        <div className="xw-panel">
          <div className="xw-empty">
            <Icon name="image" size={22} />
            <p>{query || version ? '没有符合筛选条件的图片' : '媒体库还是空的，先上传一张图片'}</p>
          </div>
        </div>
      ) : (
        <MediaGrid
          items={items}
          loading={loading}
          canWrite={canWrite}
          canDelete={canDelete}
          deletingId={deletingId}
          selectable={canDelete}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onCopy={(item) => void copyUrl(item)}
          onEdit={openEdit}
          onDelete={(item) => void remove(item)}
        />
      )}

      <Pager page={page} totalPages={totalPages} loading={loading} onChange={setPage} />

      {editing && (
        <MediaEditModal
          item={editing}
          alt={editAlt}
          version={editVersion}
          error={editError}
          saving={saving}
          onAltChange={setEditAlt}
          onVersionChange={setEditVersion}
          onCancel={closeEdit}
          onSave={() => void saveEdit()}
        />
      )}
    </div>
  );
}
