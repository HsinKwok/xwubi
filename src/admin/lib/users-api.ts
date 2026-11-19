import { toQueryString } from '../../shared/query';
import type { StaffRole } from '../types';
import { deleteJson, getJson, patchJson, postJson } from './api';

export const STAFF_STATUSES = ['active', 'invited', 'disabled'] as const;
export type StaffStatus = 'active' | 'disabled';

export const STAFF_STATUS_LABELS: Record<string, string> = {
  active: '已启用',
  disabled: '已停用',
  invited: '待激活',
};

export interface StaffAccount {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  status: string;
  must_change_password: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StaffListResponse {
  items: StaffAccount[];
  total: number;
  page: number;
  per_page: number;
  counts: Record<string, number>;
}

export interface StaffQuery {
  q?: string;
  role?: string;
  status?: string;
  page?: number;
  per_page?: number;
}

export function listStaff(params: StaffQuery, signal?: AbortSignal) {
  const query = toQueryString({
    q: params.q,
    role: params.role,
    status: params.status,
    page: params.page && params.page > 1 ? params.page : undefined,
    per_page: params.per_page,
  });
  return getJson<StaffListResponse>(`/api/admin/users${query}`, signal);
}

export interface StaffInviteResponse {
  item: StaffAccount | null;
  invite_url: string;
  mail: { sent: boolean; provider: string };
}

export function inviteStaff(input: { name: string; email: string; role: StaffRole }) {
  return postJson<StaffInviteResponse>('/api/admin/users/invite', input);
}

export function resendStaffInvite(id: string) {
  return postJson<StaffInviteResponse>(`/api/admin/users/${encodeURIComponent(id)}/invite`, {});
}

export function updateStaff(
  id: string,
  input: { role?: StaffRole; status?: StaffStatus },
) {
  return patchJson<{ item: StaffAccount | null }>(
    `/api/admin/users/${encodeURIComponent(id)}`,
    input,
  );
}

export function deleteStaff(id: string) {
  return deleteJson<{ ok: true }>(`/api/admin/users/${encodeURIComponent(id)}`);
}

export function deleteStaffBatch(ids: string[]) {
  return postJson<{ ok: true; deleted: number }>('/api/admin/users/batch-delete', { ids });
}

export function resetStaffPassword(id: string, password: string) {
  return postJson<{ ok: true }>(`/api/admin/users/${encodeURIComponent(id)}/password`, {
    password,
  });
}
