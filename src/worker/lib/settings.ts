import type { SiteConfig, VersionOption } from '../../shared/site-config';
import type { Env } from './env';
import { nowIso } from './ids';

const CONFIG_KEY = 'site_config';
const EPOCH_KEY = 'site_epoch';

/** 站点配置在单个 Worker 实例内的缓存时长；与响应头的 max-age 保持一致 */
const CONFIG_TTL_MS = 30_000;

interface SettingsSnapshot {
  config: SiteConfig;
  epoch: number;
  updatedAt: string | null;
  at: number;
}

let snapshot: SettingsSnapshot | null = null;

/**
 * 一次查询同时取出站点配置、内容版本号与码表版本。
 * 码表版本以 categories 表为准，覆盖 site_config 里的历史快照。
 * 结果在实例内复用 30 秒，避免每个请求都读 D1 并重复 JSON.parse。
 */
export async function loadSiteSettings(env: Env): Promise<SettingsSnapshot> {
  if (snapshot && Date.now() - snapshot.at < CONFIG_TTL_MS) return snapshot;

  const [settingResult, versionResult] = await env.DB.batch<Record<string, unknown>>([
    env.DB.prepare('SELECT key, value, updated_at FROM settings WHERE key IN (?, ?)').bind(
      CONFIG_KEY,
      EPOCH_KEY,
    ),
    env.DB.prepare(
      "SELECT slug, label, hint FROM categories WHERE domain = 'keymap_version' ORDER BY sort_order, label",
    ),
  ]);

  const rows = (settingResult.results ?? []) as unknown as Array<{
    key: string;
    value: string;
    updated_at: string | null;
  }>;
  let rawConfig: string | null = null;
  let rawEpoch: string | null = null;
  let updatedAt: string | null = null;

  for (const row of rows) {
    if (row.key === CONFIG_KEY) {
      rawConfig = row.value;
      updatedAt = row.updated_at;
    }
    if (row.key === EPOCH_KEY) rawEpoch = row.value;
  }

  if (!rawConfig) throw new Error('site_config 未初始化，请先执行种子数据');

  const config = JSON.parse(rawConfig) as SiteConfig;
  const versions = (versionResult.results ?? []) as unknown as Array<{
    slug: string;
    label: string;
    hint: string;
  }>;

  if (versions.length > 0) {
    config.versions = versions.map((row) => ({
      value: row.slug,
      label: row.label,
      note: row.hint || undefined,
    }));
    if (!config.versions.some((item: VersionOption) => item.value === config.defaultVersion)) {
      config.defaultVersion = config.versions[0]?.value ?? config.defaultVersion;
    }
  }

  const epoch = Number(rawEpoch ?? 1);
  snapshot = {
    config,
    epoch: Number.isFinite(epoch) ? epoch : 1,
    updatedAt,
    at: Date.now(),
  };

  return snapshot;
}

export async function loadSiteConfig(env: Env): Promise<SiteConfig> {
  return (await loadSiteSettings(env)).config;
}

export async function getEpoch(env: Env): Promise<number> {
  return (await loadSiteSettings(env)).epoch;
}

/** 配置写入后直接用最新值回填实例缓存，避免同一实例读到旧配置 */
export function primeSiteSettings(
  config: SiteConfig,
  epoch: number,
  updatedAt: string | null = nowIso(),
): void {
  snapshot = { config, epoch, updatedAt, at: Date.now() };
}

export function invalidateSiteSettings(): void {
  snapshot = null;
}

/** 内容发布/下架后自增，作为公共缓存的版本号 */
export async function bumpEpoch(env: Env): Promise<number> {
  await env.DB.prepare(
    `UPDATE settings SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT), updated_at = ?
     WHERE key = ?`,
  )
    .bind(nowIso(), EPOCH_KEY)
    .run();

  if (snapshot) {
    snapshot = { ...snapshot, epoch: snapshot.epoch + 1, at: Date.now() };
    return snapshot.epoch;
  }
  const row = await env.DB.prepare('SELECT value FROM settings WHERE key = ?')
    .bind(EPOCH_KEY)
    .first<{ value: string }>();
  const epoch = Number(row?.value ?? 1);
  return Number.isFinite(epoch) ? epoch : 1;
}

export function normalizeVersion(
  requested: string | undefined,
  config: SiteConfig,
): string {
  const allowed = config.versions.map((item: VersionOption) => item.value);
  if (requested && allowed.includes(requested)) return requested;
  if (allowed.includes(config.defaultVersion)) return config.defaultVersion;
  return allowed[0] ?? '86';
}
