import type { SmtpSecurity, SmtpConfigView } from '../../shared/mail-config';
import { getJson, postJson, putJson } from './api';

export interface MailSettingsResponse {
  config: SmtpConfigView;
  updated_at: string | null;
}

export interface MailSettingsInput {
  enabled: boolean;
  host: string;
  port: number;
  security: SmtpSecurity;
  username: string;
  from: string;
  fromName: string;
  /** 留空表示沿用已保存的密码 */
  password: string;
}

export function getMailSettings(signal?: AbortSignal) {
  return getJson<MailSettingsResponse>('/api/admin/mail-settings', signal);
}

export function saveMailSettings(input: MailSettingsInput) {
  return putJson<MailSettingsResponse>('/api/admin/mail-settings', input);
}

export function sendTestMail(to: string) {
  return postJson<{ sent: boolean; provider: string }>('/api/admin/mail-settings/test', { to });
}
