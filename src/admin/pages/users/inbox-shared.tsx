import type { FeedbackStatus, SubmissionStatus } from '../../lib/inbox-api';

/** 投稿与纠错面板共用的提示、时间格式、分页与状态文案 */

export interface Notice {
  tone: 'ok' | 'error';
  text: string;
}

export const SUBMISSION_KIND_LABELS: Record<string, string> = {
  news: '资讯投稿',
  correction: '页面纠错',
  software: '软件推荐',
};

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  new: '新投稿',
  confirmed: '已确认',
  claimed: '已受理',
  accepted: '已采纳',
  rejected: '已拒绝',
  spam: '垃圾',
};

export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
  open: '待处理',
  assigned: '处理中',
  fixed: '已修复',
  closed: '已关闭',
  spam: '垃圾',
};

export { formatShortDateTime as formatDate } from '../../lib/format';

export function Pager({
  total,
  page,
  perPage,
  onChange,
}: {
  total: number;
  page: number;
  perPage: number;
  onChange: (page: number) => void;
}) {
  if (total <= perPage) return null;
  const pages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="xw-page-foot">
      <span>
        共 {total} 条 · 第 {page} / {pages} 页
      </span>
      <div className="xw-page-foot__actions">
        <button
          type="button"
          className="xw-btn xw-btn--ghost xw-btn--sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          上一页
        </button>
        <button
          type="button"
          className="xw-btn xw-btn--ghost xw-btn--sm"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          下一页
        </button>
      </div>
    </div>
  );
}
