import type { SiteConfig } from '../../shared/site-config';
import { getJson } from './api';

export interface VersionOption {
  value: string;
  label: string;
}

export interface VersionsPayload {
  versions: VersionOption[];
  contentVersions: VersionOption[];
  defaultVersion: string;
}

let snapshot: VersionsPayload | null = null;
const listeners = new Set<(payload: VersionsPayload) => void>();

/** 版本清单在管理台启动时加载一次，各页面同步读取 */
export async function loadVersions(signal?: AbortSignal): Promise<VersionsPayload> {
  if (snapshot) return snapshot;
  const payload = await getJson<VersionsPayload>('/api/admin/versions', signal);
  snapshot = payload;
  return payload;
}

/** 站点设置保存后强制刷新版本清单，并通知订阅方 */
export async function refreshVersions(): Promise<VersionsPayload> {
  snapshot = null;
  const payload = await loadVersions();
  listeners.forEach((listener) => listener(payload));
  return payload;
}

/**
 * 设置页保存接口已返回最新配置，直接用它同步版本清单，
 * 省掉一次 /api/admin/versions 往返。
 */
export function applyVersionsFromConfig(config: SiteConfig): VersionsPayload {
  const versions = config.versions.map(({ value, label }) => ({ value, label }));
  const allowed = versions.map((item) => item.value);
  const payload: VersionsPayload = {
    versions,
    contentVersions: [
      ...versions,
      { value: 'all', label: config.labels.generalVersion ?? '通用' },
    ],
    defaultVersion: allowed.includes(config.defaultVersion)
      ? config.defaultVersion
      : (allowed[0] ?? ''),
  };
  snapshot = payload;
  listeners.forEach((listener) => listener(payload));
  return payload;
}

export function subscribeVersions(
  listener: (payload: VersionsPayload) => void,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function versionSnapshot(): VersionsPayload {
  return snapshot ?? { versions: [], contentVersions: [], defaultVersion: '' };
}

/** 码表版本（不含「全部/通用」） */
export function versionOptions(): VersionOption[] {
  return versionSnapshot().versions;
}

/** 内容与媒体可用的版本（含 all） */
export function contentVersionOptions(): VersionOption[] {
  return versionSnapshot().contentVersions;
}

export function defaultVersion(): string {
  const { versions, defaultVersion: preferred } = versionSnapshot();
  if (versions.some((item) => item.value === preferred)) return preferred;
  return versions[0]?.value ?? '';
}

export function versionLabel(value: string): string {
  const { contentVersions, versions } = versionSnapshot();
  const found =
    contentVersions.find((item) => item.value === value) ??
    versions.find((item) => item.value === value);
  return found?.label ?? value.toUpperCase();
}
