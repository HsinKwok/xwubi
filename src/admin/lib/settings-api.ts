import type { SiteConfig } from '../../shared/site-config';
import { getJson, putJson } from './api';

export interface SettingsResponse {
  config: SiteConfig;
  epoch: number;
  updated_at: string | null;
}

export function getSettings(signal?: AbortSignal) {
  return getJson<SettingsResponse>('/api/admin/settings', signal);
}

export function saveSettings(config: SiteConfig) {
  return putJson<SettingsResponse & { ok: true }>('/api/admin/settings', { config });
}
