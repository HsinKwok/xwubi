import { Icon } from '../../components/icons';
import { NoticeBar } from '../../components/NoticeBar';
import { SUBMISSION_STATUSES } from '../../lib/inbox-api';
import { SUBMISSION_STATUS_LABELS } from './inbox-shared';
import { Pager } from '../../components/Pager';
import { SubmissionCard } from './SubmissionCard';
import { useSubmissions } from './use-submissions';

export function SubmissionsPanel({ onUnauthorized }: { onUnauthorized: () => void }) {
  const {
    data,
    loading,
    error,
    reload,
    status,
    changeStatusFilter,
    setPage,
    pending,
    notice,
    rejectingId,
    rejectNote,
    setRejectNote,
    changeStatus,
    toggleReject,
    cancelReject,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    deletingId,
    deletingBatch,
    deleteOne,
    deleteSelected,
  } = useSubmissions({ onUnauthorized });

  const items = data?.items ?? [];
  const counts = data?.counts ?? {};
  const allSelected =
    items.length > 0 && items.every((item) => selectedIds.includes(item.id));

  return (
    <>
      <div className="xw-toolbar">
        <select
          className="xw-select"
          aria-label="按状态筛选投稿"
          value={status}
          onChange={(event) => changeStatusFilter(event.target.value)}
        >
          <option value="">全部状态</option>
          {SUBMISSION_STATUSES.map((item) => (
            <option value={item} key={item}>
              {SUBMISSION_STATUS_LABELS[item]}（{counts[item] ?? 0}）
            </option>
          ))}
        </select>

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

        <span className="xw-toolbar__spacer" />
        {selectedIds.length > 0 && (
          <button
            type="button"
            className="xw-btn xw-btn--danger xw-btn--sm"
            disabled={deletingBatch}
            onClick={() => void deleteSelected()}
          >
            {deletingBatch ? '删除中…' : `批量删除（${selectedIds.length}）`}
          </button>
        )}
        <span className="xw-toolbar__count">
          {loading ? '加载中…' : `投稿 ${data?.total ?? 0} 条`}
        </span>
        <button
          type="button"
          className="xw-btn xw-btn--ghost xw-btn--sm"
          disabled={loading}
          onClick={reload}
        >
          <Icon name="checkSquare" size={15} />
          刷新
        </button>
      </div>

      <NoticeBar notice={notice} />

      {error ? (
        <div className="xw-panel">
          <div className="xw-empty">
            <Icon name="users" size={22} />
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
      ) : !loading && items.length === 0 ? (
        <div className="xw-panel">
          <div className="xw-empty">
            <Icon name="users" size={22} />
            <p>没有符合条件的投稿。</p>
          </div>
        </div>
      ) : (
        <div className="xw-review">
          {items.map((item) => (
            <SubmissionCard
              key={item.id}
              item={item}
              pending={pending}
              rejecting={rejectingId === item.id}
              rejectNote={rejectNote}
              selected={selectedIds.includes(item.id)}
              deleting={deletingId === item.id}
              onToggleSelect={() => toggleSelect(item.id)}
              onDelete={() => void deleteOne(item)}
              onChangeRejectNote={setRejectNote}
              onStatus={(next) => void changeStatus(item, next)}
              onReject={() => void changeStatus(item, 'rejected', rejectNote.trim())}
              onToggleReject={() => toggleReject(item.id)}
              onCancelReject={cancelReject}
            />
          ))}
        </div>
      )}

      {data && (
        <Pager
          page={data.page}
          totalPages={Math.max(1, Math.ceil(data.total / data.per_page))}
          total={data.total}
          hideOnSinglePage
          onChange={setPage}
        />
      )}
    </>
  );
}
