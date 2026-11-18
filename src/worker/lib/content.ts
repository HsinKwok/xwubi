import type { PublicContentItem } from '../../shared/site-config';
import type { Env } from './env';

export interface ContentRow {
  id: string;
  type: string;
  slug: string;
  version: string;
  title: string;
  summary: string;
  body_md: string;
  meta_json: string;
  stage: string | null;
  lesson_no: number | null;
  sort_order: number;
  status: string;
  author_id: string | null;
  assignee_id: string | null;
  verified_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author_name?: string | null;
}

/** 列表场景不需要正文，避免把大字段从 D1 读到 Worker */
export type ContentListRow = Omit<ContentRow, 'body_md' | 'author_id' | 'assignee_id' | 'verified_at' | 'status' | 'created_at' | 'updated_at'>;

const LIST_COLUMNS =
  'id, type, slug, version, title, summary, stage, lesson_no, sort_order, published_at, meta_json';

export function parseMeta(metaJson: string | null | undefined): Record<string, unknown> {
  if (!metaJson) return {};
  try {
    const parsed = JSON.parse(metaJson);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function mapPublicContent(row: ContentListRow): PublicContentItem {
  return {
    id: row.id,
    type: row.type,
    slug: row.slug,
    version: row.version,
    title: row.title,
    summary: row.summary,
    stage: row.stage,
    lesson_no: row.lesson_no,
    sort_order: row.sort_order,
    published_at: row.published_at,
    meta: parseMeta(row.meta_json),
  };
}

/** 批量结果统一转成公开条目，供列表与首页区块共用 */
export function mapContentRows(rows: ContentListRow[] | undefined): PublicContentItem[] {
  return (rows ?? []).map(mapPublicContent);
}

export interface PublishedQuery {
  type: string;
  version: string;
  stage?: string;
  tag?: string;
  limit?: number;
  /** 分页偏移；用于合集页「加载更多」 */
  offset?: number;
}

export interface LatestQuery {
  types: string[];
  version: string;
  stage?: string;
  tag?: string;
  limit?: number;
}

interface PublicFilter {
  types: string[];
  version?: string;
  stage?: string;
  tag?: string;
}

/**
 * 公开内容的统一过滤条件：只保留已发布条目，并按版本包含通用内容（'all'）。
 * 列表、计数、首页混排流都从这里拼装，避免各处 SQL 漂移。
 */
function buildPublicWhere({ types, version, stage, tag }: PublicFilter): {
  clause: string;
  params: unknown[];
} {
  const conditions = [
    "status = 'published'",
    `type IN (${types.map(() => '?').join(', ')})`,
  ];
  const params: unknown[] = [...types];

  if (version) {
    conditions.push("version IN (?, 'all')");
    params.push(version);
  }
  if (stage) {
    conditions.push('stage = ?');
    params.push(stage);
  }
  if (tag) {
    conditions.push('id IN (SELECT content_id FROM content_tags WHERE tag_id = ?)');
    params.push(tag);
  }

  return { clause: conditions.join(' AND '), params };
}

/** 教程按课次排序，其余类型按发布时间倒序 */
function buildOrderBy(type?: string): string {
  return type === 'lesson'
    ? 'lesson_no IS NULL, lesson_no ASC, sort_order ASC, published_at DESC'
    : 'COALESCE(published_at, updated_at) DESC';
}

function clampLimit(limit: number | undefined): number {
  return Math.min(Math.max(limit ?? 30, 1), 100);
}

function clampOffset(offset: number | undefined): number {
  return Math.max(offset ?? 0, 0);
}

/** 合集列表查询语句；批量取数与单条取数复用同一构造 */
export function buildListStatement(env: Env, query: PublishedQuery): D1PreparedStatement {
  const { clause, params } = buildPublicWhere({
    types: [query.type],
    version: query.version,
    stage: query.stage,
    tag: query.tag,
  });
  return env.DB.prepare(
    `SELECT ${LIST_COLUMNS} FROM content WHERE ${clause} ORDER BY ${buildOrderBy(query.type)} LIMIT ? OFFSET ?`,
  ).bind(...params, clampLimit(query.limit), clampOffset(query.offset));
}

/** 首页混排流查询语句（跨多个内容类型按发布时间取最新） */
export function buildLatestStatement(env: Env, query: LatestQuery): D1PreparedStatement {
  const { clause, params } = buildPublicWhere({
    types: query.types.length > 0 ? query.types : ['lesson'],
    version: query.version,
    stage: query.stage,
    tag: query.tag,
  });
  return env.DB.prepare(
    `SELECT ${LIST_COLUMNS} FROM content WHERE ${clause} ORDER BY ${buildOrderBy()} LIMIT ?`,
  ).bind(...params, clampLimit(query.limit));
}

function buildCountStatement(env: Env, query: PublishedQuery): D1PreparedStatement {
  const { clause, params } = buildPublicWhere({
    types: [query.type],
    version: query.version,
    stage: query.stage,
    tag: query.tag,
  });
  return env.DB.prepare(`SELECT COUNT(*) AS total FROM content WHERE ${clause}`).bind(...params);
}

export async function listPublished(env: Env, query: PublishedQuery): Promise<PublicContentItem[]> {
  const result = await buildListStatement(env, query).all<ContentListRow>();
  return mapContentRows(result.results as ContentListRow[] | undefined);
}

/** 多个集合区块合并为一次 D1 round trip */
export async function listPublishedMany(
  env: Env,
  queries: PublishedQuery[],
): Promise<PublicContentItem[][]> {
  if (queries.length === 0) return [];
  const results = await env.DB.batch<ContentListRow>(queries.map((query) => buildListStatement(env, query)));
  return results.map((result) => mapContentRows(result.results as ContentListRow[] | undefined));
}

/** 首页混排流：跨内容类型按发布时间取最新若干条 */
export async function listLatest(env: Env, query: LatestQuery): Promise<PublicContentItem[]> {
  const result = await buildLatestStatement(env, query).all<ContentListRow>();
  return mapContentRows(result.results as ContentListRow[] | undefined);
}

export async function listPublishedWithTotal(
  env: Env,
  query: PublishedQuery,
): Promise<{ items: PublicContentItem[]; total: number }> {
  const [listResult, countResult] = await env.DB.batch<Record<string, unknown>>([
    buildListStatement(env, query),
    buildCountStatement(env, query),
  ]);

  const items = mapContentRows(listResult.results as unknown as ContentListRow[] | undefined);
  const total = Number((countResult.results?.[0] as { total?: number } | undefined)?.total ?? 0);
  return { items, total };
}

export async function countPublished(env: Env, query: PublishedQuery): Promise<number> {
  const row = await buildCountStatement(env, query).first<{ total: number }>();
  return row?.total ?? 0;
}
