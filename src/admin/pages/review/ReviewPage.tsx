import { Icon } from '../../components/icons';
import type { AdminUser } from '../../types';
import { contentVersionOptions } from '../../lib/versions';
import { ReviewCard } from './ReviewCard';
import { useReviewQueue } from './use-review-queue';
import '../../styles/review.css';

export interface ReviewPageProps {
  user: AdminUser;
  onNavigate: (href: string) => void;
  onUnauthorized: () => void;
}

export function ReviewPage({ user, onNavigate, onUnauthorized }: ReviewPageProps) {
  const canReview = user.role === 'admin' || user.role === 'reviewer';

  const {
    type,
    setType,
    version,
    setVersion,
    pending,
    notice,
    rejectingId,
    rejectNote,
    setRejectNote,
    contentTypes,
    items,
    counts,
    loading,
    error,
    reload,
    handlePublish,
    handleReject,
    toggleReject,
  } = useReviewQueue({ canReview, onUnauthorized });

  return (
    <div className="xw-content">
      <header className="xw-content__head">
        <div>
          <p className="xw-content__eyebrow">REVIEW</p>
          <h1 className="xw-content__title">审核中心</h1>
          <p className="xw-content__desc">待审核与待复核内容按提交时间排序，条件不满足时无法发布。</p>
        </div>
        <button
          type="button"
          className="xw-btn xw-btn--ghost"
          onClick={() => reload()}
          disabled={loading}
        >
          <Icon name="checkSquare" size={16} />
          刷新队列
        </button>
      </header>

      <section className="xw-review__counts" aria-label="队列概览">
        <div className="xw-review-count">
          <span className="xw-review-count__label">待审核</span>
          <span className="xw-review-count__value">{counts?.pending ?? 0}</span>
        </div>
        <div className="xw-review-count">
          <span className="xw-review-count__label">待复核</span>
          <span className="xw-review-count__value">{counts?.needs_review ?? 0}</span>
        </div>
        <div className="xw-review-count xw-review-count--ready">
          <span className="xw-review-count__label">可直接发布</span>
          <span className="xw-review-count__value">{counts?.ready ?? 0}</span>
        </div>
        <div className="xw-review-count xw-review-count--blocked">
          <span className="xw-review-count__label">缺少条件</span>
          <span className="xw-review-count__value">{counts?.blocked ?? 0}</span>
        </div>
      </section>

      <div className="xw-toolbar">
        <select
          className="xw-select"
          aria-label="按类型筛选"
          value={type}
          onChange={(event) => setType(event.target.value)}
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
          onChange={(event) => setVersion(event.target.value)}
        >
          <option value="">全部版本</option>
          {contentVersionOptions().map((item) => (
            <option value={item.value} key={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <span className="xw-toolbar__spacer" />
        <span className="xw-toolbar__count">{loading ? '加载中…' : `队列 ${items.length} 条`}</span>
      </div>

      {!canReview && (
        <div className="xw-notice xw-notice--muted" role="status">
          当前角色可以查看队列，发布与驳回需要审核权限。
        </div>
      )}

      {notice && (
        <div className={`xw-notice xw-notice--${notice.tone}`} role="status">
          {notice.text}
        </div>
      )}

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
            <Icon name="checkSquare" size={22} />
            <p>队列已清空，没有待审核内容。</p>
          </div>
        </div>
      ) : (
        <div className="xw-review">
          {items.map((item) => (
            <ReviewCard
              key={item.id}
              item={item}
              contentTypes={contentTypes}
              canReview={canReview}
              pending={pending}
              rejecting={rejectingId === item.id}
              rejectNote={rejectNote}
              onRejectNoteChange={setRejectNote}
              onOpen={onNavigate}
              onPublish={() => void handlePublish(item)}
              onToggleReject={() => toggleReject(item.id)}
              onCancelReject={() => toggleReject(item.id)}
              onReject={() => void handleReject(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
