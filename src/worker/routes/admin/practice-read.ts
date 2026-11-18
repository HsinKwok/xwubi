// 文章跟打篇目的列表与详情查询
import { Hono } from 'hono';
import type { AppEnv } from '../../lib/env';
import { listPracticeGenreSlugs } from '../../lib/categories';
import { asString, fail } from '../../lib/http';
import type { CountRow, PracticeTextRow, PracticeTextSummary } from './practice-helpers';

export const practiceReadRoutes = new Hono<AppEnv>();

practiceReadRoutes.get('/', async (c) => {
  const url = new URL(c.req.url);
  const q = asString(url.searchParams.get('q')).trim();
  const genre = asString(url.searchParams.get('genre')).trim();

  const where: string[] = [];
  const params: unknown[] = [];

  if (q) {
    where.push('(title LIKE ? OR author LIKE ? OR dynasty LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  if (genre) {
    const genres = await listPracticeGenreSlugs(c.env);
    if (genres.includes(genre)) {
      where.push('genre = ?');
      params.push(genre);
    }
  }

  const clause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const columns = 'id, title, author, dynasty, genre, char_count, sort_order, created_at, updated_at';

  const [countResult, listResult] = await c.env.DB.batch([
    c.env.DB.prepare(`SELECT COUNT(*) AS total FROM practice_texts ${clause}`).bind(...params),
    c.env.DB.prepare(
      `SELECT ${columns} FROM practice_texts ${clause} ORDER BY sort_order, title`,
    ).bind(...params),
  ]);

  const total = (countResult.results?.[0] as CountRow | undefined)?.total ?? 0;
  const items = (listResult.results ?? []) as PracticeTextSummary[];

  return c.json({ items, total });
});

practiceReadRoutes.get('/:id', async (c) => {
  const row = await c.env.DB.prepare('SELECT * FROM practice_texts WHERE id = ? LIMIT 1')
    .bind(c.req.param('id'))
    .first<PracticeTextRow>();

  if (!row) return fail(c, 404, 'practice_text_not_found', '篇目不存在');
  return c.json({ item: row });
});
