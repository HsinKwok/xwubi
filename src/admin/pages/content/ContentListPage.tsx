import { Icon } from '../../components/icons';
import { NoticeBar } from '../../components/NoticeBar';
import { Pager } from '../../components/Pager';
import '../../styles/content.css';
import { contentVersionOptions } from '../../lib/versions';
import { createNavigateHandler } from '../../lib/navigate';
import type { AdminUser } from '../../types';
import { CONTENT_STATUSES, CONTENT_STATUS_LABELS } from './content-meta';
import { ContentTable } from './ContentTable';
import { useContentList } from './use-content-list';

export interface ContentListPageProps {
  user: AdminUser;
  initialQuery?: string;
  onNavigate: (href: string) => void;
  onUnauthorized: () => void;
}

export function ContentListPage({
  user,
  initialQuery = '',
  onNavigate,
  onUnauthorized,
}: ContentListPageProps) {
  const canWrite = user.role !== 'reviewer';
  const {
    keyword,
    setKeyword,
    query,
    type,
    changeType,
    version,
    changeVersion,
    status,
    changeStatus,
    page,
    setPage,
    totalPages,
    contentTypes,
    loading,
    error,
    reload,
    items,
    total,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    deletingId,
    deletingBatch,
    notice,
    deleteOne,
    deleteSelected,
  } = useContentList({ initialQuery, onUnauthorized });

  const go = createNavigateHandler(onNavigate);

  return (
    <div className="xw-content">
      <header className="xw-content__head">
        <div>
          <p className="xw-content__eyebrow">CONTENT</p>
          <h1 className="xw-content__title">内容管理</h1>
          <p className="xw-content__desc">按类型、码表版本与状态筛选，进入编辑器维护正文与发布状态。</p>
        </div>
        {canWrite && (
          <a
            className="xw-btn xw-btn--primary"
            href="/admin/content/new"
            onClick={(event) => go(event, '/admin/content/new')}
          >
            <Icon name="file" size={16} />
            新建内容
          </a>
        )}
      </header>

      <div className="xw-toolbar">
        <label className="xw-search">
          <Icon name="search" size={16} />
          <input
            type="search"
            value={keyword}
            placeholder="搜索标题或 slug"
            aria-label="搜索内容"
            onChange={(event) => setKeyword(event.target.value)}
          />
        </label>

        <select
          className="xw-select"
          aria-label="按类型筛选"
          value={type}
          onChange={(event) => changeType(event.target.value)}
        >
          <option value="">全部类型</option>
          {contentTypes.map((item) => (
            <option value={item.slug} key={item.slug}>
              {item.label}
            </option>
          ))}
        </select>

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

        <select
          className="xw-select"
          aria-label="按状态筛选"
          value={status}
          onChange={(event) => changeStatus(event.target.value)}
        >
          <option value="">全部状态</option>
          {CONTENT_STATUSES.map((item) => (
            <option value={item} key={item}>
              {CONTENT_STATUS_LABELS[item]}
            </option>
          ))}
        </select>

        <span className="xw-toolbar__spacer" />

        {canWrite && selectedIds.length > 0 && (
          <button
            type="button"
            className="xw-btn xw-btn--danger xw-btn--sm"
            disabled={deletingBatch || deletingId !== null || loading}
            onClick={deleteSelected}
          >
            {deletingBatch ? '删除中…' : `批量删除（${selectedIds.length}）`}
          </button>
        )}

        <span className="xw-toolbar__count">
          {loading ? '加载中…' : `共 ${total} 条`}
        </span>
      </div>

      <NoticeBar notice={notice} />

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
      ) : (
        <div className="xw-panel">
          <ContentTable
            items={items}
            loading={loading}
            contentTypes={contentTypes}
            emptyText={
              query || type || version || status ? '没有符合筛选条件的内容' : '还没有内容，先新建一条'
            }
            canWrite={canWrite}
            selectedIds={selectedIds}
            deletingId={deletingId}
            go={go}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onDelete={deleteOne}
          />
        </div>
      )}

      <Pager page={page} totalPages={totalPages} loading={loading} onChange={setPage} />
    </div>
  );
}
