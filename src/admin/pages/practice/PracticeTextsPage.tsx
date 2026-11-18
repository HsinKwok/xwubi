import { Icon } from '../../components/icons';
import type { AdminUser } from '../../types';
import { PracticeTextEditor } from './PracticeTextEditor';
import { PracticeTextsTable } from './PracticeTextsTable';
import { usePracticeTexts } from './use-practice-texts';

export interface PracticeTextsPageProps {
  user: AdminUser;
  onUnauthorized: () => void;
}

export function PracticeTextsPage({ user, onUnauthorized }: PracticeTextsPageProps) {
  const canWrite = user.role === 'admin' || user.role === 'editor';

  const {
    genres,
    notice,
    setNotice,
    query,
    changeQuery,
    genreFilter,
    changeGenreFilter,
    setPage,
    editor,
    setEditor,
    saving,
    deletingId,
    loading,
    error,
    reload,
    items,
    filtered,
    totalPages,
    currentPage,
    pageStart,
    pageItems,
    genreLabel,
    bodyChars,
    updateForm,
    startCreate,
    startEdit,
    handleSave,
    handleDelete,
  } = usePracticeTexts({ canWrite, onUnauthorized });

  return (
    <div className="xw-content">
      <header className="xw-content__head">
        <div>
          <p className="xw-content__eyebrow">PRACTICE</p>
          <h1 className="xw-content__title">文章跟打</h1>
          <p className="xw-content__desc">
            管理前台「在线打字 · 文章跟打」使用的篇目。字数为汉字数量，标点与空格不计入。
          </p>
        </div>
      </header>

      {notice && (
        <div className={`xw-notice xw-notice--${notice.kind}`} role="status">
          <span>{notice.text}</span>
          <button
            type="button"
            className="xw-btn xw-btn--ghost xw-btn--sm"
            onClick={() => setNotice(null)}
          >
            关闭
          </button>
        </div>
      )}

      {editor && (
        <PracticeTextEditor
          editor={editor}
          genres={genres}
          saving={saving}
          bodyChars={bodyChars}
          onChange={updateForm}
          onCancel={() => setEditor(null)}
          onSave={() => void handleSave()}
        />
      )}

      <div className="xw-toolbar">
        <label className="xw-search">
          <Icon name="search" size={16} />
          <input
            value={query}
            placeholder="搜索标题、作者或朝代"
            aria-label="搜索篇目"
            onChange={(event) => changeQuery(event.target.value)}
          />
        </label>
        <select
          className="xw-select"
          aria-label="篇目分类"
          value={genreFilter}
          onChange={(event) => changeGenreFilter(event.target.value)}
        >
          <option value="all">全部分类</option>
          {genres.map((option) => (
            <option value={option.slug} key={option.id}>
              {option.label}
            </option>
          ))}
        </select>

        <span className="xw-toolbar__spacer" />
        <span className="xw-toolbar__count">
          {loading ? '加载中…' : `共 ${filtered.length} 篇`}
          {!loading && filtered.length !== items.length ? ` / 全部 ${items.length} 篇` : ''}
        </span>
        {canWrite && (
          <button
            type="button"
            className="xw-btn xw-btn--primary xw-btn--sm"
            disabled={saving}
            onClick={startCreate}
          >
            新建篇目
          </button>
        )}
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
      ) : !loading && filtered.length === 0 ? (
        <div className="xw-panel">
          <div className="xw-empty">
            <Icon name="type" size={22} />
            <p>
              {items.length === 0
                ? `还没有篇目${canWrite ? '，点击右上角新建' : ''}`
                : '没有匹配的篇目，试试换个关键词'}
            </p>
          </div>
        </div>
      ) : (
        <PracticeTextsTable
          items={pageItems}
          loading={loading}
          canWrite={canWrite}
          saving={saving}
          deletingId={deletingId}
          pageStart={pageStart}
          currentPage={currentPage}
          totalPages={totalPages}
          total={filtered.length}
          genreLabel={genreLabel}
          onEdit={(item) => void startEdit(item)}
          onDelete={(item) => void handleDelete(item)}
          onPrev={() => setPage(currentPage - 1)}
          onNext={() => setPage(currentPage + 1)}
        />
      )}
    </div>
  );
}
