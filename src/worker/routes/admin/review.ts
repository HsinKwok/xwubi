import { Hono } from 'hono';
import type { AppEnv } from '../../lib/env';
import type { ContentRow } from '../../lib/content';
import { writeAudit } from '../../lib/audit';
import { fail, readJson, readPageParams } from '../../lib/http';
import { nowIso } from '../../lib/ids';
import { requireRole } from '../../lib/session';
import { REVIEWERS } from './constants';
import { deleteContentRows } from './content-delete';
import { validateForPublish } from './content-helpers';

export const reviewRoutes = new Hono<AppEnv>();

const requireReviewer = requireRole(...REVIEWERS);
const REVIEW_STATUSES = ['pending', 'needs_review'];

/**
 * 「可直接发布」判定，必须与 content-helpers.ts 的 validateForPublish 保持一致。
 * 用 SQL 聚合代替把整队列拉回 JS 逐条校验，统计成本不再随内容量线性增长。
 */
const READY_EXPR = `CASE WHEN
    trim(c.summary) <> '' AND c.version <> ''
    AND (c.type NOT IN ('software', 'lesson') OR c.verified_at IS NOT NULL)
    AND (c.type <> 'lesson' OR (
      json_valid(c.meta_json)
      AND json_type(c.meta_json, '$.examples') = 'array'
      AND json_array_length(c.meta_json, '$.examples') >= 3
    ))
    AND (c.type <> 'software' OR (
      json_valid(c.meta_json)
      AND json_type(c.meta_json, '$.platforms') = 'array'
      AND json_array_length(c.meta_json, '$.platforms') >= 1
    ))
    AND (c.type <> 'news' OR (
      json_valid(c.meta_json)
      AND trim(coalesce(json_extract(c.meta_json, '$.source_url'), '')) <> ''
    ))
  THEN 1 ELSE 0 END`;

function readIds(body: Record<string, unknown> | null): string[] {
  if (!body || !Array.isArray(body.ids)) return [];
  return [
    ...new Set(
      body.ids.filter((item): item is string => typeof item === 'string' && item.trim().length > 0),
    ),
  ];
}

reviewRoutes.get('/review', async (c) => {
  const url = new URL(c.req.url);
  const conditions = ["c.status IN ('pending', 'needs_review')"];
  const params: unknown[] = [];

  const type = url.searchParams.get('type');
  if (type) {
    conditions.push('c.type = ?');
    params.push(type);
  }

  const version = url.searchParams.get('version');
  if (version) {
    conditions.push('c.version = ?');
    params.push(version);
  }

  const where = conditions.join(' AND ');
  const { page, perPage, offset } = readPageParams(url, 20);

  // 统计与列表一次 batch 取回。统计全部交给 SQL 聚合完成，
  // 不再把整个队列（含 meta_json）拉回 JS 逐条校验，避免随内容量线性变慢。
  // READY_EXPR 必须与 validateForPublish 的规则保持一致。
  const [statsResult, rowsResult] = await c.env.DB.batch<Record<string, unknown>>([
    c.env.DB.prepare(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN c.status = 'pending' THEN 1 ELSE 0 END) AS pending,
              SUM(CASE WHEN c.status = 'needs_review' THEN 1 ELSE 0 END) AS needs_review,
              SUM(${READY_EXPR}) AS ready
       FROM content c
       WHERE ${where}`,
    ).bind(...params),
    c.env.DB.prepare(
      `SELECT c.*, u.name AS author_name
       FROM content c LEFT JOIN users u ON u.id = c.author_id
       WHERE ${where}
       ORDER BY c.updated_at DESC
       LIMIT ? OFFSET ?`,
    ).bind(...params, perPage, offset),
  ]);

  const stats = (statsResult.results?.[0] ?? {}) as {
    total?: number;
    pending?: number;
    needs_review?: number;
    ready?: number;
  };
  const rows = (rowsResult.results ?? []) as unknown as ContentRow[];

  const items = rows.map((row) => {
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

  const total = Number(stats.total ?? 0);
  const ready = Number(stats.ready ?? 0);

  return c.json({
    items,
    total,
    page,
    per_page: perPage,
    counts: {
      pending: Number(stats.pending ?? 0),
      needs_review: Number(stats.needs_review ?? 0),
      ready,
      blocked: total - ready,
    },
    generated_at: nowIso(),
  });
});

reviewRoutes.delete('/review/:id', requireReviewer, async (c) => {
  const id = c.req.param('id') ?? '';
  const row = await c.env.DB.prepare('SELECT id, title, status FROM content WHERE id = ?')
    .bind(id)
    .first<{ id: string; title: string; status: string }>();
  if (!row) return fail(c, 404, 'content_not_found', '内容不存在');
  if (!REVIEW_STATUSES.includes(row.status)) {
    return fail(c, 400, 'not_in_review', '只能删除审核队列中的内容');
  }

  await deleteContentRows(c, [id]);

  await writeAudit(c, {
    action: 'content.delete',
    targetType: 'content',
    targetId: id,
    summary: row.title,
  });

  return c.json({ ok: true });
});

reviewRoutes.post('/review/batch-delete', requireReviewer, async (c) => {
  const body = await readJson<Record<string, unknown>>(c);
  if (!body) return fail(c, 400, 'invalid_request', '请求体必须是 JSON');

  const ids = readIds(body);
  if (ids.length === 0) return fail(c, 400, 'invalid_request', '请选择要删除的内容');
  if (ids.length > 100) return fail(c, 400, 'invalid_request', '一次最多删除 100 条内容');

  const placeholders = ids.map(() => '?').join(', ');
  const found = await c.env.DB.prepare(
    `SELECT id, title FROM content
     WHERE id IN (${placeholders}) AND status IN ('pending', 'needs_review')`,
  )
    .bind(...ids)
    .all<{ id: string; title: string }>();
  const rows = found.results ?? [];
  if (rows.length === 0) return fail(c, 404, 'content_not_found', '审核队列中没有这些内容');

  await deleteContentRows(
    c,
    rows.map((row) => row.id),
  );

  for (const row of rows) {
    await writeAudit(c, {
      action: 'content.delete',
      targetType: 'content',
      targetId: row.id,
      summary: row.title,
    });
  }

  return c.json({ ok: true, deleted: rows.length });
});
