// 内容管理列表与修订记录的查询封装
import type { Context } from 'hono';
import type { AppEnv } from '../../lib/env';
import { readPageParams } from '../../lib/http';
import type { AdminContentSummaryRow } from './rows';
import { mapAdminContentSummary } from './rows';

const LIST_COLUMNS =
  'c.id, c.type, c.slug, c.version, c.title, c.summary, c.meta_json, c.stage, c.lesson_no, ' +
  'c.sort_order, c.status, c.assignee_id, c.verified_at, c.published_at, c.created_at, c.updated_at';

export interface ContentRevisionRow {
  id: number;
  revision_no: number;
  title: string;
  summary: string;
  body_md: string;
  meta_json: string;
  note: string | null;
  created_at: string;
}

export interface ContentRevisionListItem {
  id: number;
  revision_no: number;
  title: string;
  note: string | null;
  created_at: string;
  editor: string | null;
}

/** 列表筛选条件由计数与分页查询共用，保证两者条件一致 */
function readListConditions(url: URL): { where: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];

  const type = url.searchParams.get('type');
  const version = url.searchParams.get('version');
  const status = url.searchParams.get('status');
  const keyword = url.searchParams.get('q');

  if (type) {
    conditions.push('c.type = ?');
    params.push(type);
  }
  if (version) {
    conditions.push('c.version = ?');
    params.push(version);
  }
  if (status) {
    conditions.push('c.status = ?');
    params.push(status);
  }
  if (keyword) {
    conditions.push('(c.title LIKE ? OR c.slug LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  return { where: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '', params };
}

export async function listAdminContents(c: Context<AppEnv>, url: URL) {
  const { where, params } = readListConditions(url);
  const { page, perPage, offset } = readPageParams(url);

  const [totalResult, rowsResult] = await c.env.DB.batch<Record<string, unknown>>([
    c.env.DB.prepare(`SELECT COUNT(*) AS total FROM content c ${where}`).bind(...params),
    c.env.DB.prepare(
      `SELECT ${LIST_COLUMNS}, u.name AS author_name
       FROM content c LEFT JOIN users u ON u.id = c.author_id
       ${where}
       ORDER BY c.updated_at DESC LIMIT ? OFFSET ?`,
    ).bind(...params, perPage, offset),
  ]);

  const total = Number((totalResult.results?.[0] as { total?: number } | undefined)?.total ?? 0);
  const rows = (rowsResult.results ?? []) as unknown as AdminContentSummaryRow[];

  return {
    items: rows.map(mapAdminContentSummary),
    total,
    page,
    per_page: perPage,
  };
}

export async function listContentRevisions(
  c: Context<AppEnv>,
  contentId: string,
): Promise<ContentRevisionListItem[]> {
  const rows = await c.env.DB.prepare(
    `SELECT r.id, r.revision_no, r.title, r.note, r.created_at, u.name AS editor
     FROM content_revisions r LEFT JOIN users u ON u.id = r.editor_id
     WHERE r.content_id = ? ORDER BY r.revision_no DESC LIMIT 50`,
  )
    .bind(contentId)
    .all<ContentRevisionListItem>();

  return rows.results ?? [];
}

export async function loadContentRevision(
  c: Context<AppEnv>,
  contentId: string,
  revisionId: number,
): Promise<ContentRevisionRow | null> {
  return c.env.DB.prepare(
    `SELECT id, revision_no, title, summary, body_md, meta_json, note, created_at
     FROM content_revisions
     WHERE id = ? AND content_id = ?`,
  )
    .bind(revisionId, contentId)
    .first<ContentRevisionRow>();
}
