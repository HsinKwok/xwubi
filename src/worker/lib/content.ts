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
export type ContentListRow = Omit<ContentRow, 'body_md' | 'author_id' | 'assignee_id' | 'verified_at' | 'status' | 'created_at'>;

const LIST_COLUMNS =
  'id, type, slug, version, title, summary, stage, lesson_no, sort_order, published_at, updated_at, meta_json';

export function parseMeta(metaJson: string | null | undefined): Record<string, unknown> {
  if (!metaJson) return {};
  try {
    const parsed = JSON.parse(metaJson);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/**
 * 读取已发布内容：优先当前版本，找不到再回退任意版本
 * （详情接口与内容页预渲染共用，避免两处 SQL 出现差异）
 */
export async function loadPublishedContent(
  env: Env,
  type: string,
  slug: string,
  version: string,
): Promise<ContentRow | null> {
  const matched = await env.DB.prepare(
    `SELECT * FROM content
     WHERE type = ? AND slug = ? AND status = 'published' AND version IN (?, 'all')
     ORDER BY (version = ?) DESC, COALESCE(published_at, updated_at) DESC
     LIMIT 1`,
  )
    .bind(type, slug, version, version)
    .first<ContentRow>();

  if (matched) return matched;

  // 条目只在部分码表版本下存在（如 98 版独有的词库）：切换版本时回退到原版本，
  // 由前端提示「该条目不适用于当前版本」，避免整页变成加载失败
  return env.DB.prepare(
    `SELECT * FROM content
     WHERE type = ? AND slug = ? AND status = 'published'
     ORDER BY (version = 'all') DESC, COALESCE(published_at, updated_at) DESC
     LIMIT 1`,
  )
    .bind(type, slug)
    .first<ContentRow>();
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
  /** 分页偏移；仅教学等固定长度的列表继续使用 */
  offset?: number;
  /** 游标：上一页最后一条的位置，用于新闻/软件等持续增长的列表 */
  cursor?: string;
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

/** 教程按课次排序，其余类型按发布时间倒序；末尾用 id 保证分页顺序稳定 */
function buildOrderBy(type?: string): string {
  return type === 'lesson'
    ? 'lesson_no IS NULL, lesson_no ASC, sort_order ASC, published_at DESC, id ASC'
    : 'COALESCE(published_at, updated_at) DESC, id DESC';
}

function clampLimit(limit: number | undefined): number {
  return Math.min(Math.max(limit ?? 30, 1), 100);
}

function clampOffset(offset: number | undefined): number {
  return Math.max(offset ?? 0, 0);
}

interface ContentCursor {
  at: string;
  id: string;
}

/** 游标只记录上一页最后一条的排序位置，避免深页 OFFSET 扫描 */
export function encodeListCursor(row: ContentListRow): string {
  return btoa(JSON.stringify([row.published_at ?? row.updated_at ?? '', row.id]));
}

function decodeListCursor(value: string | undefined): ContentCursor | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(atob(value)) as unknown;
    if (!Array.isArray(parsed) || parsed.length !== 2) return null;
    const [at, id] = parsed;
    if (typeof at !== 'string' || typeof id !== 'string' || !id) return null;
    return { at, id };
  } catch {
    // 非法游标按第一页处理，避免直接报错
    return null;
  }
}

/** 合集列表查询语句；批量取数与单条取数复用同一构造 */
export function buildListStatement(env: Env, query: PublishedQuery): D1PreparedStatement {
  const { clause, params } = buildPublicWhere({
    types: [query.type],
    version: query.version,
    stage: query.stage,
    tag: query.tag,
  });
  // 教学按课次排序且条数有限，继续用 offset；其余类型用游标翻页
  const cursor = query.type === 'lesson' ? null : decodeListCursor(query.cursor);
  const cursorClause = cursor
    ? ' AND (COALESCE(published_at, updated_at) < ? OR (COALESCE(published_at, updated_at) = ? AND id < ?))'
    : '';
  const cursorParams: unknown[] = cursor ? [cursor.at, cursor.at, cursor.id] : [];

  return env.DB.prepare(
    `SELECT ${LIST_COLUMNS} FROM content WHERE ${clause}${cursorClause} ORDER BY ${buildOrderBy(
      query.type,
    )} LIMIT ? OFFSET ?`,
  ).bind(
    ...params,
    ...cursorParams,
    clampLimit(query.limit),
    cursor ? 0 : clampOffset(query.offset),
  );
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

export interface ContentPage {
  items: PublicContentItem[];
  total: number;
  /** 非教学列表的下一页游标；没有更多时为 null */
  nextCursor: string | null;
}

export async function listPublishedPage(env: Env, query: PublishedQuery): Promise<ContentPage> {
  const [listResult, countResult] = await env.DB.batch<Record<string, unknown>>([
    buildListStatement(env, query),
    buildCountStatement(env, query),
  ]);

  const rows = (listResult.results ?? []) as unknown as ContentListRow[];
  const total = Number((countResult.results?.[0] as { total?: number } | undefined)?.total ?? 0);
  const last = rows[rows.length - 1];
  const nextCursor =
    query.type !== 'lesson' && last && rows.length >= clampLimit(query.limit)
      ? encodeListCursor(last)
      : null;

  return { items: mapContentRows(rows), total, nextCursor };
}

export async function countPublished(env: Env, query: PublishedQuery): Promise<number> {
  const row = await buildCountStatement(env, query).first<{ total: number }>();
  return row?.total ?? 0;
}
