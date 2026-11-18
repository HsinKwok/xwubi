import { Hono } from 'hono';
import type { AppEnv } from '../../lib/env';
import { writeAudit } from '../../lib/audit';
import { asString, fail, readJson } from '../../lib/http';
import { newId, nowIso } from '../../lib/ids';
import { requireRole } from '../../lib/session';
import { bumpEpoch } from '../../lib/settings';
import { normalizePage, normalizePageSize } from '../../lib/pagination';
import {
  type ExampleRow,
  normalizeOrder,
  normalizeText,
  normalizeVersion,
  resolveQueryVersion,
} from './shared';

export const examplesRoutes = new Hono<AppEnv>();

const requireAdmin = requireRole('admin');

examplesRoutes.get('/', async (c) => {
  const version = await resolveQueryVersion(c.req.query('version'), c);
  if (!version) return fail(c, 400, 'invalid_version', '码表版本不合法');

  const query = (c.req.query('q') ?? '').trim();
  const page = normalizePage(c.req.query('page'));
  const perPage = normalizePageSize(c.req.query('per_page'));
  const like = `%${query}%`;

  // 计数与分页数据一次 batch 取回，避免两次 D1 往返
  const [countResult, listResult] = await c.env.DB.batch<Record<string, unknown>>([
    c.env.DB.prepare(
      `SELECT COUNT(*) AS total
       FROM wubi_examples
       WHERE version = ? AND (? = '' OR char LIKE ? OR code LIKE ? OR roots LIKE ?)`,
    ).bind(version, query, like, like, like),
    c.env.DB.prepare(
      `SELECT id, version, char, code, roots, note, sort_order, created_at, updated_at
       FROM wubi_examples
       WHERE version = ? AND (? = '' OR char LIKE ? OR code LIKE ? OR roots LIKE ?)
       ORDER BY sort_order, code
       LIMIT ? OFFSET ?`,
    ).bind(version, query, like, like, like, perPage, (page - 1) * perPage),
  ]);

  const totalRow = countResult.results?.[0] as { total?: number } | undefined;

  return c.json({
    version,
    items: (listResult.results ?? []) as unknown as ExampleRow[],
    total: Number(totalRow?.total ?? 0),
    page,
    per_page: perPage,
  });
});

examplesRoutes.post('/', requireAdmin, async (c) => {
  const body = await readJson<Record<string, unknown>>(c);
  if (!body) return fail(c, 400, 'invalid_request', '请求体必须是 JSON');

  const version = await normalizeVersion(body.version, c);
  const char = asString(body.char).trim();
  const code = asString(body.code).trim().toUpperCase();
  const roots = normalizeText(body.roots ?? '', 300);
  const note = normalizeText(body.note ?? '', 500);

  if (!version) return fail(c, 400, 'invalid_version', '码表版本不合法');
  if (char.length !== 1) return fail(c, 400, 'invalid_char', '例字必须是单个汉字');
  if (!/^[A-Z]{1,8}$/.test(code)) {
    return fail(c, 400, 'invalid_code', '编码需为 1-8 位大写字母');
  }
  if (roots === null) return fail(c, 400, 'invalid_roots', '拆解不能超过 300 个字符');
  if (note === null) return fail(c, 400, 'invalid_note', '备注不能超过 500 个字符');

  const existing = await c.env.DB.prepare(
    'SELECT id FROM wubi_examples WHERE version = ? AND char = ?',
  )
    .bind(version, char)
    .first<{ id: string }>();
  if (existing) return fail(c, 409, 'duplicate_char', '该版本下这个例字已存在');

  const id = newId('ex');
  const now = nowIso();

  await c.env.DB.prepare(
    `INSERT INTO wubi_examples
       (id, version, char, code, roots, note, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, version, char, code, roots, note || null, normalizeOrder(body.sort_order), now, now)
    .run();

  const item = await c.env.DB.prepare('SELECT * FROM wubi_examples WHERE id = ?')
    .bind(id)
    .first<ExampleRow>();

  // 码表内容变化后让公开 keymap 的边缘缓存立即失效
  await bumpEpoch(c.env);

  await writeAudit(c, {
    action: 'data.example_create',
    targetType: 'wubi_example',
    targetId: id,
    summary: `${version} · ${char}`,
  });

  return c.json({ item }, 201);
});

examplesRoutes.patch('/:id', requireAdmin, async (c) => {
  const id = c.req.param('id');
  const body = await readJson<Record<string, unknown>>(c);
  if (!body) return fail(c, 400, 'invalid_request', '请求体必须是 JSON');

  const current = await c.env.DB.prepare('SELECT * FROM wubi_examples WHERE id = ?')
    .bind(id)
    .first<ExampleRow>();
  if (!current) return fail(c, 404, 'example_not_found', '例字不存在');

  const version =
    body.version === undefined ? current.version : await normalizeVersion(body.version, c);
  const char = body.char === undefined ? current.char : asString(body.char).trim();
  const code =
    body.code === undefined ? current.code : asString(body.code).trim().toUpperCase();
  const roots = body.roots === undefined ? current.roots : normalizeText(body.roots, 300);
  const note = body.note === undefined ? current.note ?? '' : normalizeText(body.note, 500);

  if (!version) return fail(c, 400, 'invalid_version', '码表版本不合法');
  if (char.length !== 1) return fail(c, 400, 'invalid_char', '例字必须是单个汉字');
  if (!/^[A-Z]{1,8}$/.test(code)) {
    return fail(c, 400, 'invalid_code', '编码需为 1-8 位大写字母');
  }
  if (roots === null) return fail(c, 400, 'invalid_roots', '拆解不能超过 300 个字符');
  if (note === null) return fail(c, 400, 'invalid_note', '备注不能超过 500 个字符');

  if (version !== current.version || char !== current.char) {
    const duplicate = await c.env.DB.prepare(
      'SELECT id FROM wubi_examples WHERE version = ? AND char = ? AND id != ?',
    )
      .bind(version, char, id)
      .first<{ id: string }>();
    if (duplicate) return fail(c, 409, 'duplicate_char', '该版本下这个例字已存在');
  }

  await c.env.DB.prepare(
    `UPDATE wubi_examples
     SET version = ?, char = ?, code = ?, roots = ?, note = ?, sort_order = ?, updated_at = ?
     WHERE id = ?`,
  )
    .bind(
      version,
      char,
      code,
      roots,
      note || null,
      body.sort_order === undefined ? current.sort_order : normalizeOrder(body.sort_order),
      nowIso(),
      id,
    )
    .run();

  const item = await c.env.DB.prepare('SELECT * FROM wubi_examples WHERE id = ?')
    .bind(id)
    .first<ExampleRow>();

  await bumpEpoch(c.env);

  await writeAudit(c, {
    action: 'data.example_update',
    targetType: 'wubi_example',
    targetId: id,
    summary: `${version} · ${char}`,
  });

  return c.json({ item });
});

examplesRoutes.delete('/:id', requireAdmin, async (c) => {
  const id = c.req.param('id');
  const row = await c.env.DB.prepare('SELECT version, char FROM wubi_examples WHERE id = ?')
    .bind(id)
    .first<{ version: string; char: string }>();
  if (!row) return fail(c, 404, 'example_not_found', '例字不存在');

  await c.env.DB.prepare('DELETE FROM wubi_examples WHERE id = ?').bind(id).run();

  await bumpEpoch(c.env);

  await writeAudit(c, {
    action: 'data.example_delete',
    targetType: 'wubi_example',
    targetId: id,
    summary: `${row.version} · ${row.char}`,
  });

  return c.json({ ok: true });
});
