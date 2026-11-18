import { Hono } from 'hono';
import type { AppEnv } from '../../lib/env';
import { writeAudit } from '../../lib/audit';
import { asString, fail, readJson } from '../../lib/http';
import { newId, nowIso } from '../../lib/ids';
import { requireRole } from '../../lib/session';
import { invalidateSiteTaxonomy } from '../../lib/site-taxonomy';
import { bumpEpoch } from '../../lib/settings';
import type { TagRow } from './rows';

/** 标签是扁平的一层：只维护名称，可多选、可增长；被引用时禁止删除 */
export const tagsRoutes = new Hono<AppEnv>();

const requireAdmin = requireRole('admin');

interface TagWithCount extends TagRow {
  count: number;
}

tagsRoutes.get('/', async (c) => {
  const rows = await c.env.DB.prepare(
    `SELECT t.id, t.name, COUNT(ct.content_id) AS count
     FROM tags t LEFT JOIN content_tags ct ON ct.tag_id = t.id
     GROUP BY t.id
     ORDER BY t.name`,
  ).all<TagWithCount>();

  return c.json({ items: rows.results ?? [] });
});

tagsRoutes.post('/', requireAdmin, async (c) => {
  const body = await readJson<Record<string, unknown>>(c);
  if (!body) return fail(c, 400, 'invalid_request', '请求体必须是 JSON');

  const name = asString(body.name).trim();
  if (name.length < 1 || name.length > 20) {
    return fail(c, 400, 'invalid_name', '标签名需要 1-20 个字符');
  }

  const existing = await c.env.DB.prepare('SELECT id, name FROM tags WHERE name = ?')
    .bind(name)
    .first<TagRow>();
  if (existing) return fail(c, 409, 'tag_exists', '已存在同名标签');

  const id = newId('tag');
  await c.env.DB.prepare('INSERT INTO tags (id, name, created_at) VALUES (?, ?, ?)')
    .bind(id, name, nowIso())
    .run();

  await writeAudit(c, {
    action: 'tag.create',
    targetType: 'tag',
    targetId: id,
    summary: name,
  });

  invalidateSiteTaxonomy();
  await bumpEpoch(c.env);

  return c.json({ item: { id, name, count: 0 } }, 201);
});

tagsRoutes.patch('/:id', requireAdmin, async (c) => {
  const id = c.req.param('id') ?? '';
  const existing = await c.env.DB.prepare('SELECT id, name FROM tags WHERE id = ?')
    .bind(id)
    .first<TagRow>();
  if (!existing) return fail(c, 404, 'tag_not_found', '标签不存在');

  const body = await readJson<Record<string, unknown>>(c);
  if (!body) return fail(c, 400, 'invalid_request', '请求体必须是 JSON');

  const name = asString(body.name).trim();
  if (name.length < 1 || name.length > 20) {
    return fail(c, 400, 'invalid_name', '标签名需要 1-20 个字符');
  }
  if (name === existing.name) return fail(c, 400, 'empty_update', '没有可更新的字段');

  const duplicate = await c.env.DB.prepare('SELECT id FROM tags WHERE name = ? AND id <> ?')
    .bind(name, id)
    .first<{ id: string }>();
  if (duplicate) return fail(c, 409, 'tag_exists', '已存在同名标签');

  await c.env.DB.prepare('UPDATE tags SET name = ? WHERE id = ?').bind(name, id).run();

  invalidateSiteTaxonomy();
  await bumpEpoch(c.env);

  await writeAudit(c, {
    action: 'tag.update',
    targetType: 'tag',
    targetId: id,
    summary: name,
    diff: { name },
  });

  const row = await c.env.DB.prepare(
    `SELECT t.id, t.name, COUNT(ct.content_id) AS count
     FROM tags t LEFT JOIN content_tags ct ON ct.tag_id = t.id
     WHERE t.id = ?
     GROUP BY t.id`,
  )
    .bind(id)
    .first<TagWithCount>();

  return c.json({ item: row ?? { ...existing, count: 0 } });
});

tagsRoutes.delete('/:id', requireAdmin, async (c) => {
  const id = c.req.param('id') ?? '';
  const existing = await c.env.DB.prepare(
    `SELECT t.id, t.name, COUNT(ct.content_id) AS count
     FROM tags t LEFT JOIN content_tags ct ON ct.tag_id = t.id
     WHERE t.id = ?
     GROUP BY t.id`,
  )
    .bind(id)
    .first<TagWithCount>();
  if (!existing) return fail(c, 404, 'tag_not_found', '标签不存在');

  if (existing.count > 0) {
    return fail(
      c,
      409,
      'tag_in_use',
      `标签「${existing.name}」仍被 ${existing.count} 条内容使用，请先取消关联`,
    );
  }

  await c.env.DB.prepare('DELETE FROM tags WHERE id = ?').bind(id).run();

  invalidateSiteTaxonomy();
  await bumpEpoch(c.env);

  await writeAudit(c, {
    action: 'tag.delete',
    targetType: 'tag',
    targetId: id,
    summary: existing.name,
    diff: { usage: existing.count },
  });

  return c.json({ ok: true });
});
