import { Hono } from 'hono';
import type { AppEnv } from '../../lib/env';
import { writeAudit } from '../../lib/audit';
import { asString, fail, readJson, readPageParams } from '../../lib/http';
import { newId, nowIso } from '../../lib/ids';
import { requireRole } from '../../lib/session';
import { WRITERS } from './constants';
import type { MediaRow } from './rows';
import { mapMedia } from './rows';
import { contentVersionScope } from './content-helpers';
import { loadMedia, sanitizeFilename } from './media-helpers';

export const mediaRoutes = new Hono<AppEnv>();

const MEDIA_MIME_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};
const MEDIA_MAX_BYTES = 8 * 1024 * 1024;
const MEDIA_ALT_MAX = 200;

mediaRoutes.get('/', async (c) => {
  const url = new URL(c.req.url);
  const conditions: string[] = [];
  const params: unknown[] = [];

  const keyword = url.searchParams.get('q');
  if (keyword) {
    conditions.push('(m.filename LIKE ? OR m.alt LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const version = url.searchParams.get('version');
  if (version && (await contentVersionScope(c)).values.includes(version)) {
    conditions.push('m.version = ?');
    params.push(version);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const { page, perPage, offset } = readPageParams(url, 24);

  const [totalResult, rowsResult] = await c.env.DB.batch<Record<string, unknown>>([
    c.env.DB.prepare(`SELECT COUNT(*) AS total FROM media m ${where}`).bind(...params),
    c.env.DB.prepare(
      `SELECT m.*, u.name AS uploader_name
       FROM media m LEFT JOIN users u ON u.id = m.uploaded_by
       ${where}
       ORDER BY m.created_at DESC
       LIMIT ? OFFSET ?`,
    ).bind(...params, perPage, offset),
  ]);

  const total = Number((totalResult.results?.[0] as { total?: number } | undefined)?.total ?? 0);
  const rows = (rowsResult.results ?? []) as unknown as MediaRow[];

  return c.json({
    items: rows.map(mapMedia),
    total,
    page,
    per_page: perPage,
  });
});

mediaRoutes.post('/', requireRole(...WRITERS), async (c) => {
  let body: Record<string, string | File>;
  try {
    body = await c.req.parseBody();
  } catch {
    return fail(c, 400, 'invalid_request', '上传请求格式不正确');
  }

  const file = body.file;
  if (!(file instanceof File)) {
    return fail(c, 400, 'missing_file', '请选择要上传的图片');
  }

  const mime = file.type.toLowerCase();
  const ext = MEDIA_MIME_EXT[mime];
  if (!ext) {
    return fail(c, 415, 'unsupported_type', '仅支持 PNG、JPEG、WebP、GIF、AVIF 格式的图片');
  }
  if (file.size <= 0) return fail(c, 400, 'empty_file', '文件内容为空');
  if (file.size > MEDIA_MAX_BYTES) return fail(c, 413, 'file_too_large', '图片不能超过 8MB');

  const versionRaw = asString(body.version).trim();
  const version = (await contentVersionScope(c)).values.includes(versionRaw) ? versionRaw : null;
  const alt = asString(body.alt).trim().slice(0, MEDIA_ALT_MAX);
  const filename = sanitizeFilename(file.name, ext);
  const user = c.get('user')!;
  const id = newId('med');
  const now = nowIso();
  const r2Key = `media/${now.slice(0, 4)}/${id}.${ext}`;

  await c.env.BUCKET.put(r2Key, file, {
    httpMetadata: {
      contentType: mime,
      cacheControl: 'public, max-age=31536000, immutable',
    },
  });

  try {
    await c.env.DB.prepare(
      `INSERT INTO media (id, r2_key, filename, mime, size, version, alt, uploaded_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(id, r2Key, filename, mime, file.size, version, alt, user.id, now)
      .run();
  } catch (error) {
    await c.env.BUCKET.delete(r2Key).catch(() => undefined);
    throw error;
  }

  await writeAudit(c, {
    action: 'media.upload',
    targetType: 'media',
    targetId: id,
    summary: filename,
    diff: { mime, size: file.size, version },
  });

  return c.json(
    {
      item: mapMedia({
        id,
        r2_key: r2Key,
        filename,
        mime,
        size: file.size,
        version,
        alt,
        uploaded_by: user.id,
        created_at: now,
        uploader_name: user.name,
      }),
    },
    201,
  );
});

mediaRoutes.patch('/:id', requireRole(...WRITERS), async (c) => {
  const id = c.req.param('id') ?? '';
  const existing = await loadMedia(c, id);
  if (!existing) return fail(c, 404, 'media_not_found', '图片不存在');

  const body = await readJson<Record<string, unknown>>(c);
  if (!body) return fail(c, 400, 'invalid_request', '请求体必须是 JSON');

  const fields: string[] = [];
  const params: unknown[] = [];
  const diff: Record<string, unknown> = {};

  if (body.alt !== undefined) {
    const alt = asString(body.alt).trim();
    if (alt.length > MEDIA_ALT_MAX) {
      return fail(c, 400, 'invalid_alt', `图片描述不能超过 ${MEDIA_ALT_MAX} 个字符`);
    }
    fields.push('alt = ?');
    params.push(alt);
    diff.alt = alt;
  }

  if (body.version !== undefined) {
    const version = asString(body.version).trim();
    if (version && !(await contentVersionScope(c)).values.includes(version)) {
      return fail(c, 400, 'invalid_version', '码表版本不合法');
    }
    fields.push('version = ?');
    params.push(version || null);
    diff.version = version || null;
  }

  if (fields.length === 0) return fail(c, 400, 'empty_update', '没有可更新的字段');

  await c.env.DB.prepare(`UPDATE media SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...params, id)
    .run();

  await writeAudit(c, {
    action: 'media.update',
    targetType: 'media',
    targetId: id,
    summary: existing.filename,
    diff,
  });

  const updated = await loadMedia(c, id);
  return c.json({ item: updated ? mapMedia(updated) : null });
});

mediaRoutes.post('/batch-delete', requireRole('admin'), async (c) => {
  const body = await readJson<Record<string, unknown>>(c);
  if (!body) return fail(c, 400, 'invalid_request', '请求体必须是 JSON');

  const ids = Array.isArray(body.ids)
    ? [
        ...new Set(
          body.ids.filter(
            (item): item is string => typeof item === 'string' && item.trim().length > 0,
          ),
        ),
      ]
    : [];
  if (ids.length === 0) return fail(c, 400, 'invalid_request', '请选择要删除的图片');
  if (ids.length > 100) return fail(c, 400, 'invalid_request', '一次最多删除 100 张图片');

  const placeholders = ids.map(() => '?').join(', ');
  const found = await c.env.DB.prepare(
    `SELECT id, r2_key, filename FROM media WHERE id IN (${placeholders})`,
  )
    .bind(...ids)
    .all<{ id: string; r2_key: string; filename: string }>();
  const rows = found.results ?? [];
  if (rows.length === 0) return fail(c, 404, 'media_not_found', '图片不存在');

  await Promise.all(rows.map((row) => c.env.BUCKET.delete(row.r2_key).catch(() => undefined)));

  const rowIds = rows.map((row) => row.id);
  await c.env.DB.batch(
    rowIds.map((id) => c.env.DB.prepare('DELETE FROM media WHERE id = ?').bind(id)),
  );

  for (const row of rows) {
    await writeAudit(c, {
      action: 'media.delete',
      targetType: 'media',
      targetId: row.id,
      summary: row.filename,
    });
  }

  return c.json({ ok: true, deleted: rows.length });
});

mediaRoutes.delete('/:id', requireRole('admin'), async (c) => {
  const id = c.req.param('id') ?? '';
  const row = await loadMedia(c, id);
  if (!row) return fail(c, 404, 'media_not_found', '图片不存在');

  await c.env.BUCKET.delete(row.r2_key);
  await c.env.DB.prepare('DELETE FROM media WHERE id = ?').bind(id).run();

  await writeAudit(c, {
    action: 'media.delete',
    targetType: 'media',
    targetId: id,
    summary: row.filename,
  });

  return c.json({ ok: true });
});
