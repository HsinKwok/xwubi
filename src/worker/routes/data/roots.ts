import { Hono } from 'hono';
import type { AppEnv } from '../../lib/env';
import { writeAudit } from '../../lib/audit';
import { fail, readJson } from '../../lib/http';
import { newId, nowIso } from '../../lib/ids';
import { requireRole } from '../../lib/session';
import { bumpEpoch } from '../../lib/settings';
import {
  type RootRow,
  normalizeKey,
  normalizeOrder,
  normalizeText,
  normalizeVersion,
  resolveQueryVersion,
} from './shared';

export const rootsRoutes = new Hono<AppEnv>();

const requireAdmin = requireRole('admin');

rootsRoutes.get('/', async (c) => {
  const version = await resolveQueryVersion(c.req.query('version'), c);
  if (!version) return fail(c, 400, 'invalid_version', '码表版本不合法');

  const query = (c.req.query('q') ?? '').trim();
  const { results } = await c.env.DB.prepare(
    `SELECT id, version, key, mnemonic, roots, note, sort_order, created_at, updated_at
     FROM wubi_roots
     WHERE version = ? AND (? = '' OR key LIKE ? OR roots LIKE ? OR mnemonic LIKE ?)
     ORDER BY sort_order, key`,
  )
    .bind(version, query, `%${query}%`, `%${query}%`, `%${query}%`)
    .all<RootRow>();

  return c.json({ version, items: results ?? [] });
});

rootsRoutes.post('/', requireAdmin, async (c) => {
  const body = await readJson<Record<string, unknown>>(c);
  if (!body) return fail(c, 400, 'invalid_request', '请求体必须是 JSON');

  const version = await normalizeVersion(body.version, c);
  const key = normalizeKey(body.key);
  const mnemonic = normalizeText(body.mnemonic ?? '', 120);
  const roots = normalizeText(body.roots ?? '', 300);
  const note = normalizeText(body.note ?? '', 500);

  if (!version) return fail(c, 400, 'invalid_version', '码表版本不合法');
  if (!key) return fail(c, 400, 'invalid_key', '键位必须是 A-Y 的单个字母');
  if (mnemonic === null) return fail(c, 400, 'invalid_mnemonic', '口诀不能超过 120 个字符');
  if (roots === null) return fail(c, 400, 'invalid_roots', '字根不能超过 300 个字符');
  if (note === null) return fail(c, 400, 'invalid_note', '备注不能超过 500 个字符');

  const existing = await c.env.DB.prepare(
    'SELECT id FROM wubi_roots WHERE version = ? AND key = ?',
  )
    .bind(version, key)
    .first<{ id: string }>();

  if (existing) return fail(c, 409, 'duplicate_key', '该版本下这个键位已存在');

  const id = newId('root');
  const now = nowIso();

  await c.env.DB.prepare(
    `INSERT INTO wubi_roots
       (id, version, key, mnemonic, roots, note, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, version, key, mnemonic, roots, note || null, normalizeOrder(body.sort_order), now, now)
    .run();

  const item = await c.env.DB.prepare('SELECT * FROM wubi_roots WHERE id = ?')
    .bind(id)
    .first<RootRow>();

  // 码表内容变化后让公开 keymap 的边缘缓存立即失效
  await bumpEpoch(c.env);

  await writeAudit(c, {
    action: 'data.root_create',
    targetType: 'wubi_root',
    targetId: id,
    summary: `${version} · ${key}`,
  });

  return c.json({ item }, 201);
});

rootsRoutes.patch('/:id', requireAdmin, async (c) => {
  const id = c.req.param('id');
  const body = await readJson<Record<string, unknown>>(c);
  if (!body) return fail(c, 400, 'invalid_request', '请求体必须是 JSON');

  const current = await c.env.DB.prepare('SELECT * FROM wubi_roots WHERE id = ?')
    .bind(id)
    .first<RootRow>();
  if (!current) return fail(c, 404, 'root_not_found', '字根不存在');

  const version =
    body.version === undefined ? current.version : await normalizeVersion(body.version, c);
  const key = body.key === undefined ? current.key : normalizeKey(body.key);
  const mnemonic =
    body.mnemonic === undefined ? current.mnemonic : normalizeText(body.mnemonic, 120);
  const roots = body.roots === undefined ? current.roots : normalizeText(body.roots, 300);
  const note = body.note === undefined ? current.note ?? '' : normalizeText(body.note, 500);

  if (!version) return fail(c, 400, 'invalid_version', '码表版本不合法');
  if (!key) return fail(c, 400, 'invalid_key', '键位必须是 A-Y 的单个字母');
  if (mnemonic === null) return fail(c, 400, 'invalid_mnemonic', '口诀不能超过 120 个字符');
  if (roots === null) return fail(c, 400, 'invalid_roots', '字根不能超过 300 个字符');
  if (note === null) return fail(c, 400, 'invalid_note', '备注不能超过 500 个字符');

  if (version !== current.version || key !== current.key) {
    const duplicate = await c.env.DB.prepare(
      'SELECT id FROM wubi_roots WHERE version = ? AND key = ? AND id != ?',
    )
      .bind(version, key, id)
      .first<{ id: string }>();
    if (duplicate) return fail(c, 409, 'duplicate_key', '该版本下这个键位已存在');
  }

  await c.env.DB.prepare(
    `UPDATE wubi_roots
     SET version = ?, key = ?, mnemonic = ?, roots = ?, note = ?, sort_order = ?, updated_at = ?
     WHERE id = ?`,
  )
    .bind(
      version,
      key,
      mnemonic,
      roots,
      note || null,
      body.sort_order === undefined ? current.sort_order : normalizeOrder(body.sort_order),
      nowIso(),
      id,
    )
    .run();

  const item = await c.env.DB.prepare('SELECT * FROM wubi_roots WHERE id = ?')
    .bind(id)
    .first<RootRow>();

  await bumpEpoch(c.env);

  await writeAudit(c, {
    action: 'data.root_update',
    targetType: 'wubi_root',
    targetId: id,
    summary: `${version} · ${key}`,
  });

  return c.json({ item });
});

rootsRoutes.delete('/:id', requireAdmin, async (c) => {
  const id = c.req.param('id');
  const row = await c.env.DB.prepare('SELECT version, key FROM wubi_roots WHERE id = ?')
    .bind(id)
    .first<{ version: string; key: string }>();
  if (!row) return fail(c, 404, 'root_not_found', '字根不存在');

  await c.env.DB.prepare('DELETE FROM wubi_roots WHERE id = ?').bind(id).run();

  await bumpEpoch(c.env);

  await writeAudit(c, {
    action: 'data.root_delete',
    targetType: 'wubi_root',
    targetId: id,
    summary: `${row.version} · ${row.key}`,
  });

  return c.json({ ok: true });
});
