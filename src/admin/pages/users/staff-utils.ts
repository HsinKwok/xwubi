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

export interface StaffCreateForm extends StaffForm {
  password: string;
}

export const EMPTY_CREATE_FORM: StaffCreateForm = {
  name: '',
  email: '',
  role: 'editor',
  password: '',
};

/** 随机初始密码：13 位，保证同时包含字母与数字 */
export function randomStaffPassword(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  let password = '';
  for (const byte of bytes) password += letters[byte % letters.length];
  return `${password}${digits[bytes[0] % digits.length]}`;
}

export function statusClass(status: string): string {
  if (status === 'active') return 'xw-status--published';
  if (status === 'disabled') return 'xw-status--archived';
  return 'xw-status--pending';
}
