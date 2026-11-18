import { Hono } from 'hono';
import type { AppEnv } from '../../lib/env';
import type { ContentRow } from '../../lib/content';
import { nowIso } from '../../lib/ids';
import { validateForPublish } from './content-helpers';

export const reviewRoutes = new Hono<AppEnv>();

reviewRoutes.get('/review', async (c) => {
  const conditions = ["c.status IN ('pending', 'needs_review')"];
  const params: unknown[] = [];

  const type = c.req.query('type');
  if (type) {
    conditions.push('c.type = ?');
    params.push(type);
  }

  const version = c.req.query('version');
  if (version) {
    conditions.push('c.version = ?');
    params.push(version);
  }

  const { results } = await c.env.DB.prepare(
    `SELECT c.*, u.name AS author_name
     FROM content c LEFT JOIN users u ON u.id = c.author_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY c.updated_at DESC
     LIMIT 100`,
  )
    .bind(...params)
    .all<ContentRow>();

  const items = (results ?? []).map((row) => {
    const problems = validateForPublish(row);
    return {
      id: row.id,
      title: row.title,
      type: row.type,
      version: row.version,
      stage: row.stage,
      status: row.status,
      author: row.author_name ?? null,
      updated_at: row.updated_at,
      problems,
      ready: problems.length === 0,
    };
  });

  return c.json({
    items,
    counts: {
      pending: items.filter((item) => item.status === 'pending').length,
      needs_review: items.filter((item) => item.status === 'needs_review').length,
      ready: items.filter((item) => item.ready).length,
      blocked: items.filter((item) => !item.ready).length,
    },
    generated_at: nowIso(),
  });
});
