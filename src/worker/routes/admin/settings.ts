import { Hono } from 'hono';
import type { AppEnv } from '../../lib/env';
import { writeAudit } from '../../lib/audit';
import { listSiteVersions } from '../../lib/categories';
import { fail, readJson } from '../../lib/http';
import { nowIso } from '../../lib/ids';
import { requireRole } from '../../lib/session';
import {
  bumpEpoch,
  loadSiteSettings,
  normalizeVersion,
  primeSiteSettings,
} from '../../lib/settings';
import { parseSiteConfig, validateSiteConfig } from '../../lib/site-config-validate';

export const settingsAdminRoutes = new Hono<AppEnv>();

const requireAdmin = requireRole('admin');

settingsAdminRoutes.get('/settings', async (c) => {
  const { config, epoch, updatedAt } = await loadSiteSettings(c.env);
  return c.json({ config, epoch, updated_at: updatedAt });
});

// 管理台各页面的码表版本清单统一取自站点配置，避免前端硬编码
settingsAdminRoutes.get('/versions', async (c) => {
  const { config } = await loadSiteSettings(c.env);
  const versions = config.versions.map(({ value, label }) => ({ value, label }));
  return c.json({
    versions,
    contentVersions: [...versions, { value: 'all', label: config.labels.generalVersion ?? '通用' }],
    defaultVersion: normalizeVersion(undefined, config),
  });
});

settingsAdminRoutes.put('/settings', requireAdmin, async (c) => {
  const body = await readJson<Record<string, unknown>>(c);
  if (!body) return fail(c, 400, 'invalid_request', '请求体必须是 JSON');

  const config = body.config ?? body;
  const value = parseSiteConfig(config);
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return fail(c, 422, 'invalid_config', '配置必须是一个 JSON 对象');
  }

  // 码表版本以分类表为准，保存设置时不能覆盖；默认版本需指向一个真实版本
  const versions = await listSiteVersions(c.env);
  value.versions = versions;
  if (!versions.some((item) => item.value === value.defaultVersion)) {
    value.defaultVersion = versions[0]?.value ?? value.defaultVersion;
  }

  const errors = validateSiteConfig(value);
  if (errors.length > 0) return fail(c, 422, 'invalid_config', errors.join('；'));

  const updatedAt = nowIso();

  await c.env.DB.prepare(
    `INSERT INTO settings (key, value, updated_at) VALUES ('site_config', ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
  )
    .bind(JSON.stringify(value), updatedAt)
    .run();

  const epoch = await bumpEpoch(c.env);
  primeSiteSettings(value, epoch, updatedAt);

  await writeAudit(c, {
    action: 'settings.update',
    targetType: 'settings',
    targetId: 'site_config',
    summary: '站点配置',
  });

  return c.json({ config: value, epoch, updated_at: updatedAt });
});
