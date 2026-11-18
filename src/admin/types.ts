export type StaffRole = 'admin' | 'editor' | 'reviewer' | 'ops';

/** 码表版本取值来自站点配置（GET /api/admin/versions） */
export type WubiVersion = string;

export type PublicNavKey = 'learn' | 'news' | 'software' | 'tools';

export type AdminSection =
  | 'dashboard'
  | 'review'
  | 'content'
  | 'users'
  | 'data'
  | 'media'
  | 'practice'
  | 'categories'
  | 'settings';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  must_change_password?: boolean;
}

export interface AdminBadgeCounts {
  review?: number;
  users?: number;
}

export const STAFF_ROLES: StaffRole[] = ['admin', 'editor', 'reviewer', 'ops'];

export const ROLE_LABELS: Record<StaffRole, string> = {
  admin: '管理员',
  editor: '编辑',
  reviewer: '审校',
  ops: '运营',
};
