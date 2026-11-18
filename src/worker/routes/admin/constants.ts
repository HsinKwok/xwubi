import type { StaffRole } from '../../lib/env';

export const WRITERS: StaffRole[] = ['admin', 'editor', 'ops'];
export const REVIEWERS: StaffRole[] = ['admin', 'reviewer'];
export const INBOX_ROLES: StaffRole[] = ['admin', 'ops'];
export const SUBMISSION_STATUSES = ['new', 'confirmed', 'claimed', 'accepted', 'rejected', 'spam'];
export const FEEDBACK_STATUSES = ['open', 'assigned', 'fixed', 'closed', 'spam'];
export const STAFF_ROLES: StaffRole[] = ['admin', 'editor', 'reviewer', 'ops'];
export const STAFF_STATUSES = ['active', 'disabled'];
export const STAFF_STATUS_FILTERS = ['active', 'invited', 'disabled'];
export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  admin: '管理员',
  editor: '编辑',
  reviewer: '审校',
  ops: '运营',
};

export const ACTION_LABELS: Record<string, string> = {
  'auth.login': '登录了',
  'auth.logout': '退出了',
  'content.create': '新建了',
  'content.update': '更新了',
  'content.submit': '提交了',
  'content.publish': '发布了',
  'content.unpublish': '下架了',
  'content.reject': '驳回了',
  'content.archive': '归档了',
  'content.restore': '回滚了内容版本',
  'settings.update': '更新了站点配置',
  'submission.update': '处理了投稿',
  'feedback.update': '处理了纠错',
  'user.create': '新建了账号',
  'user.invite': '邀请了账号',
  'user.invite_resend': '重发了邀请',
  'user.update': '更新了账号',
  'user.reset_password': '重置了账号密码',
  'tag.create': '新建了标签',
  'tag.update': '更新了标签',
  'tag.delete': '删除了标签',
  'media.upload': '上传了图片',
  'media.update': '更新了图片',
  'media.delete': '删除了图片',
  'data.root_create': '新建了字根',
  'data.root_update': '更新了字根',
  'data.root_delete': '删除了字根',
  'data.example_create': '新建了例字',
  'data.example_update': '更新了例字',
  'data.example_delete': '删除了例字',
  'data.import': '导入了码表数据',
};
