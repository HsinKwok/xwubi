import type { FeedbackStatus, SubmissionStatus } from '../../lib/inbox-api';

/** 投稿与纠错面板共用的提示、时间格式与状态文案 */

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
