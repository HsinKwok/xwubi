import { Hono } from 'hono';
import type { AppEnv } from '../../lib/env';
import { writeAudit } from '../../lib/audit';
import { asString, fail, readJson, readPageParams } from '../../lib/http';
import { nowIso } from '../../lib/ids';
import { requireRole } from '../../lib/session';
import { SUBMISSION_KINDS } from '../../lib/validation';
import { FEEDBACK_STATUSES, INBOX_ROLES, SUBMISSION_STATUSES } from './constants';
import type { FeedbackRow, SubmissionRow } from './rows';
import { mapFeedback, mapSubmission } from './rows';
import { readStatusCounts, statusCountStatement } from './inbox-helpers';

export const inboxRoutes = new Hono<AppEnv>();

const requireInbox = requireRole(...INBOX_ROLES);

inboxRoutes.get('/submissions', requireInbox, async (c) => {
  const url = new URL(c.req.url);
  const conditions: string[] = [];
  const params: unknown[] = [];

  const status = url.searchParams.get('status');
  if (status && SUBMISSION_STATUSES.includes(status)) {
    conditions.push('status = ?');
    params.push(status);
  }

  const kind = url.searchParams.get('kind');
  if (kind && SUBMISSION_KINDS.includes(kind)) {
    conditions.push('kind = ?');
    params.push(kind);
  }

  const keyword = url.searchParams.get('q');
  if (keyword) {
    conditions.push('(title LIKE ? OR email LIKE ? OR note LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const { page, perPage, offset } = readPageParams(url);

  const [totalResult, rowsResult, countsResult] = await c.env.DB.batch<Record<string, unknown>>([
    c.env.DB.prepare(`SELECT COUNT(*) AS total FROM submissions ${where}`).bind(...params),
    c.env.DB.prepare(
      `SELECT * FROM submissions ${where}
       ORDER BY CASE status WHEN 'new' THEN 0 WHEN 'confirmed' THEN 1 WHEN 'claimed' THEN 2 ELSE 3 END,
                created_at DESC
       LIMIT ? OFFSET ?`,
    ).bind(...params, perPage, offset),
    statusCountStatement(c, 'submissions', SUBMISSION_STATUSES),
  ]);

  const total = Number((totalResult.results?.[0] as { total?: number } | undefined)?.total ?? 0);
  const rows = (rowsResult.results ?? []) as unknown as SubmissionRow[];

  return c.json({
    items: rows.map(mapSubmission),
    total,
    page,
    per_page: perPage,
    counts: readStatusCounts(countsResult, SUBMISSION_STATUSES),
  });
});

inboxRoutes.patch('/submissions/:id', requireInbox, async (c) => {
  const id = c.req.param('id') ?? '';
  const row = await c.env.DB.prepare('SELECT * FROM submissions WHERE id = ?')
    .bind(id)
    .first<SubmissionRow>();
  if (!row) return fail(c, 404, 'submission_not_found', '投稿不存在');

  const body = await readJson<Record<string, unknown>>(c);
  if (!body) return fail(c, 400, 'invalid_request', '请求体必须是 JSON');

  const status = asString(body.status);
  if (!SUBMISSION_STATUSES.includes(status)) {
    return fail(c, 400, 'invalid_status', '投稿状态不合法');
  }

  const user = c.get('user')!;
  const reason = asString(body.reject_reason).trim();
  const assignee = status === 'claimed' || status === 'accepted' ? user.id : null;

  await c.env.DB.prepare(
    `UPDATE submissions
     SET status = ?, reject_reason = ?, assignee_id = COALESCE(?, assignee_id), updated_at = ?
     WHERE id = ?`,
  )
    .bind(status, status === 'rejected' ? reason || null : null, assignee, nowIso(), id)
    .run();

  await writeAudit(c, {
    action: 'submission.update',
    targetType: 'submission',
    targetId: id,
    summary: row.title,
    diff: { status, reject_reason: status === 'rejected' ? reason : null },
  });

  return c.json({ ok: true, status });
});

inboxRoutes.get('/feedback', requireInbox, async (c) => {
  const url = new URL(c.req.url);
  const conditions: string[] = [];
  const params: unknown[] = [];

  const status = url.searchParams.get('status');
  if (status && FEEDBACK_STATUSES.includes(status)) {
    conditions.push('status = ?');
    params.push(status);
  }

  const keyword = url.searchParams.get('q');
  if (keyword) {
    conditions.push('(body LIKE ? OR page_url LIKE ? OR email LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const { page, perPage, offset } = readPageParams(url);

  const [totalResult, rowsResult, countsResult] = await c.env.DB.batch<Record<string, unknown>>([
    c.env.DB.prepare(`SELECT COUNT(*) AS total FROM feedback ${where}`).bind(...params),
    c.env.DB.prepare(
      `SELECT * FROM feedback ${where}
       ORDER BY CASE status WHEN 'open' THEN 0 WHEN 'assigned' THEN 1 ELSE 2 END,
                created_at DESC
       LIMIT ? OFFSET ?`,
    ).bind(...params, perPage, offset),
    statusCountStatement(c, 'feedback', FEEDBACK_STATUSES),
  ]);

  const total = Number((totalResult.results?.[0] as { total?: number } | undefined)?.total ?? 0);
  const rows = (rowsResult.results ?? []) as unknown as FeedbackRow[];

  return c.json({
    items: rows.map(mapFeedback),
    total,
    page,
    per_page: perPage,
    counts: readStatusCounts(countsResult, FEEDBACK_STATUSES),
  });
});

inboxRoutes.patch('/feedback/:id', requireInbox, async (c) => {
  const id = c.req.param('id') ?? '';
  const row = await c.env.DB.prepare('SELECT * FROM feedback WHERE id = ?')
    .bind(id)
    .first<FeedbackRow>();
  if (!row) return fail(c, 404, 'feedback_not_found', '纠错记录不存在');

  const body = await readJson<Record<string, unknown>>(c);
  if (!body) return fail(c, 400, 'invalid_request', '请求体必须是 JSON');

  const status = asString(body.status);
  if (!FEEDBACK_STATUSES.includes(status)) {
    return fail(c, 400, 'invalid_status', '纠错状态不合法');
  }

  const user = c.get('user')!;
  const assignee = status === 'assigned' ? user.id : null;

  await c.env.DB.prepare(
    `UPDATE feedback
     SET status = ?, assignee_id = COALESCE(?, assignee_id), updated_at = ?
     WHERE id = ?`,
  )
    .bind(status, assignee, nowIso(), id)
    .run();

  await writeAudit(c, {
    action: 'feedback.update',
    targetType: 'feedback',
    targetId: id,
    summary: row.page_url,
    diff: { status },
  });

  return c.json({ ok: true, status });
});
