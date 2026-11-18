import type { StaffRole } from '../../types';

export interface StaffNotice {
  tone: 'ok' | 'error';
  text: string;
}

export interface StaffForm {
  name: string;
  email: string;
  role: StaffRole;
}

export const EMPTY_STAFF_FORM: StaffForm = { name: '', email: '', role: 'editor' };

export function statusClass(status: string): string {
  if (status === 'active') return 'xw-status--published';
  if (status === 'disabled') return 'xw-status--archived';
  return 'xw-status--pending';
}
