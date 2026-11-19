// 文章跟打篇目的新建、更新与删除
import { Hono } from 'hono';
import type { AppEnv } from '../../lib/env';
import { writeAudit } from '../../lib/audit';
import { listPracticeGenreSlugs } from '../../lib/categories';
import { asString, clampInt, fail, readJson } from '../../lib/http';
import { newId, nowIso } from '../../lib/ids';
import { requireRole } from '../../lib/session';
import {
  AUTHOR_MAX,
  BODY_MAX,
  DYNASTY_MAX,
  TITLE_MAX,
  countChars,
  purgePublicCache,
  type PracticeTextRow,
} from './practice-helpers';

export const practiceWriteRoutes = new Hono<AppEnv>();

const requireEditor = requireRole('admin', 'editor');

practiceWriteRoutes.post('/', requireEditor, async (c) => {
  const body = await readJson<Record<string, unknown>>(c);
  if (!body) return fail(c, 400, 'invalid_request', '请求体必须是 JSON');

  const title = asString(body.title).trim();
  const author = asString(body.author).trim();
  const dynasty = asString(body.dynasty).trim();
  const requestedGenre = asString(body.genre).trim();
  const content = asString(body.body).trim();
  const sortOrder = clampInt(body.sort_order, -99_999, 99_999, 0);

  if (!title || title.length > TITLE_MAX) {
    return fail(c, 400, 'invalid_title', `标题需要 1-${TITLE_MAX} 个字符`);
  }
  if (author.length > AUTHOR_MAX) {
    return fail(c, 400, 'invalid_author', `作者最多 ${AUTHOR_MAX} 个字符`);
  }
  if (dynasty.length > DYNASTY_MAX) {
    return fail(c, 400, 'invalid_dynasty', `朝代最多 ${DYNASTY_MAX} 个字符`);
  }
  const genres = await listPracticeGenreSlugs(c.env);
  if (genres.length === 0) {
    return fail(c, 400, 'no_practice_genre', '请先在「分类管理」中创建文章分类');
  }
  const genre = requestedGenre || genres[0];
  if (!genres.includes(genre)) {
    return fail(c, 400, 'invalid_genre', '篇目分类不合法');
  }
  if (!content) return fail(c, 400, 'empty_body', '正文不能为空');
  if (content.length > BODY_MAX) {
    return fail(c, 400, 'body_too_long', `正文最多 ${BODY_MAX} 个字符`);
  }

  const id = newId('ptx');
  const now = nowIso();
  const charCount = countChars(content);

  await c.env.DB.prepare(
    `INSERT INTO practice_texts
       (id, title, author, dynasty, genre, body, char_count, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, title, author, dynasty, genre, content, charCount, sortOrder, now, now)
    .run();

  await writeAudit(c, {
    action: 'practice.create',
    targetType: 'practice_text',
    targetId: id,
    summary: title,
    diff: { author, dynasty, genre, sort_order: sortOrder },
  });

  await purgePublicCache(c, id);

  const item: PracticeTextRow = {
    id,
    title,
    author,
    dynasty,
    genre,
    body: content,
    char_count: charCount,
    sort_order: sortOrder,
    created_at: now,
    updated_at: now,
  };

  return c.json({ item }, 201);
});

practiceWriteRoutes.patch('/:id', requireEditor, async (c) => {
  const id = c.req.param('id') ?? '';
  const existing = await c.env.DB.prepare('SELECT * FROM practice_texts WHERE id = ? LIMIT 1')
    .bind(id)
    .first<PracticeTextRow>();
  if (!existing) return fail(c, 404, 'practice_text_not_found', '篇目不存在');

  const body = await readJson<Record<string, unknown>>(c);
  if (!body) return fail(c, 400, 'invalid_request', '请求体必须是 JSON');

  const fields: string[] = [];
  const params: unknown[] = [];
  const diff: Record<string, unknown> = {};

  if (body.title !== undefined) {
    const title = asString(body.title).trim();
    if (!title || title.length > TITLE_MAX) {
      return fail(c, 400, 'invalid_title', `标题需要 1-${TITLE_MAX} 个字符`);
    }
    if (title !== existing.title) {
      fields.push('title = ?');
      params.push(title);
      diff.title = title;
    }
  }

  if (body.author !== undefined) {
    const author = asString(body.author).trim();
    if (author.length > AUTHOR_MAX) {
      return fail(c, 400, 'invalid_author', `作者最多 ${AUTHOR_MAX} 个字符`);
    }
    if (author !== existing.author) {
      fields.push('author = ?');
      params.push(author);
      diff.author = author;
    }
  }

  if (body.dynasty !== undefined) {
    const dynasty = asString(body.dynasty).trim();
    if (dynasty.length > DYNASTY_MAX) {
      return fail(c, 400, 'invalid_dynasty', `朝代最多 ${DYNASTY_MAX} 个字符`);
    }
    if (dynasty !== existing.dynasty) {
      fields.push('dynasty = ?');
      params.push(dynasty);
      diff.dynasty = dynasty;
    }
  }

  if (body.genre !== undefined) {
    const genre = asString(body.genre).trim();
    const genres = await listPracticeGenreSlugs(c.env);
    if (!genres.includes(genre)) return fail(c, 400, 'invalid_genre', '篇目分类不合法');
    if (genre !== existing.genre) {
      fields.push('genre = ?');
      params.push(genre);
      diff.genre = genre;
    }
  }

  if (body.body !== undefined) {
    const content = asString(body.body).trim();
    if (!content) return fail(c, 400, 'empty_body', '正文不能为空');
    if (content.length > BODY_MAX) {
      return fail(c, 400, 'body_too_long', `正文最多 ${BODY_MAX} 个字符`);
    }
    if (content !== existing.body) {
      const charCount = countChars(content);
      fields.push('body = ?', 'char_count = ?');
      params.push(content, charCount);
      diff.char_count = charCount;
    }
  }

  if (body.sort_order !== undefined) {
    const sortOrder = clampInt(body.sort_order, -99_999, 99_999, existing.sort_order);
    if (sortOrder !== existing.sort_order) {
      fields.push('sort_order = ?');
      params.push(sortOrder);
      diff.sort_order = sortOrder;
    }
  }

  if (fields.length === 0) return fail(c, 400, 'empty_update', '没有可更新的字段');

  fields.push('updated_at = ?');
  params.push(nowIso());

  await c.env.DB.prepare(`UPDATE practice_texts SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...params, id)
    .run();

  await writeAudit(c, {
    action: 'practice.update',
    targetType: 'practice_text',
    targetId: id,
    summary: typeof diff.title === 'string' ? diff.title : existing.title,
    diff,
  });

  await purgePublicCache(c, id);

  const row = await c.env.DB.prepare('SELECT * FROM practice_texts WHERE id = ? LIMIT 1')
    .bind(id)
    .first<PracticeTextRow>();

  return c.json({ item: row ?? existing });
});

practiceWriteRoutes.post('/batch-delete', requireEditor, async (c) => {
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
  if (ids.length === 0) return fail(c, 400, 'invalid_request', '请选择要删除的篇目');
  if (ids.length > 100) return fail(c, 400, 'invalid_request', '一次最多删除 100 篇');

  const placeholders = ids.map(() => '?').join(', ');
  const found = await c.env.DB.prepare(
    `SELECT id, title FROM practice_texts WHERE id IN (${placeholders})`,
  )
    .bind(...ids)
    .all<{ id: string; title: string }>();
  const rows = found.results ?? [];
  if (rows.length === 0) return fail(c, 404, 'practice_text_not_found', '篇目不存在');

  const rowIds = rows.map((row) => row.id);
  await c.env.DB.prepare(
    `DELETE FROM practice_texts WHERE id IN (${rowIds.map(() => '?').join(', ')})`,
  )
    .bind(...rowIds)
    .run();

  for (const row of rows) {
    await writeAudit(c, {
      action: 'practice.delete',
      targetType: 'practice_text',
      targetId: row.id,
      summary: row.title,
    });
    await purgePublicCache(c, row.id);
  }

  return c.json({ ok: true, deleted: rows.length });
});

practiceWriteRoutes.delete('/:id', requireEditor, async (c) => {
  const id = c.req.param('id') ?? '';
  const existing = await c.env.DB.prepare('SELECT id, title FROM practice_texts WHERE id = ? LIMIT 1')
    .bind(id)
    .first<Pick<PracticeTextRow, 'id' | 'title'>>();
  if (!existing) return fail(c, 404, 'practice_text_not_found', '篇目不存在');

  await c.env.DB.prepare('DELETE FROM practice_texts WHERE id = ?').bind(id).run();

  await writeAudit(c, {
    action: 'practice.delete',
    targetType: 'practice_text',
    targetId: id,
    summary: existing.title,
  });

  await purgePublicCache(c, id);

  return c.json({ ok: true });
});
