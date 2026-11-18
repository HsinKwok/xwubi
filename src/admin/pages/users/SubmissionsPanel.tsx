import { Icon } from '../../components/icons';
import { SUBMISSION_STATUSES } from '../../lib/inbox-api';
import { SUBMISSION_STATUS_LABELS, Pager } from './inbox-shared';
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
  } = useSubmissions({ onUnauthorized });

  const items = data?.items ?? [];
  const counts = data?.counts ?? {};

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
        <span className="xw-toolbar__spacer" />
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

      {notice && (
        <div className={`xw-notice xw-notice--${notice.tone}`} role="status">
          {notice.text}
        </div>
      )}

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
        <Pager total={data.total} page={data.page} perPage={data.per_page} onChange={setPage} />
      )}
    </>
  );
}
