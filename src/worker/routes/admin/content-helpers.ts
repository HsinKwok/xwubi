import type { Context } from 'hono';
import type { AppEnv } from '../../lib/env';
import type { ContentRow } from '../../lib/content';
import { parseMeta } from '../../lib/content';
import { loadCategorySlugSet } from '../../lib/categories';
import { asString } from '../../lib/http';
import { nowIso } from '../../lib/ids';
import { loadSiteSettings, normalizeVersion } from '../../lib/settings';
import type { TagRow } from './rows';

/** 内容/媒体可用版本：站点配置中的码表版本 + all */
export async function contentVersionScope(c: Context<AppEnv>) {
  const { config } = await loadSiteSettings(c.env);
  return {
    values: [...config.versions.map((item) => item.value), 'all'],
    defaultVersion: normalizeVersion(undefined, config),
  };
}

/** 内容类型来自分类表，新增类型后无需改代码 */
export async function isKnownContentType(
  c: Context<AppEnv>,
  type: string,
): Promise<boolean> {
  if (!type) return false;
  const types = await loadCategorySlugSet(c.env, 'content_type');
  return types.has(type);
}

/** 教学阶段同样来自分类表，发布时只能选已有阶段 */
export async function isKnownStage(c: Context<AppEnv>, stage: string): Promise<boolean> {
  if (!stage) return false;
  const stages = await loadCategorySlugSet(c.env, 'lesson_stage');
  return stages.has(stage);
}

export async function loadContent(c: Context<AppEnv>, id: string): Promise<ContentRow | null> {
  return c.env.DB.prepare(
    `SELECT c.*, u.name AS author_name
     FROM content c LEFT JOIN users u ON u.id = c.author_id
     WHERE c.id = ?`,
  )
    .bind(id)
    .first<ContentRow>();
}

export async function saveRevision(
  c: Context<AppEnv>,
  row: ContentRow,
  note: string,
): Promise<void> {
  const next = await c.env.DB.prepare(
    'SELECT COALESCE(MAX(revision_no), 0) + 1 AS next FROM content_revisions WHERE content_id = ?',
  )
    .bind(row.id)
    .first<{ next: number }>();

  await c.env.DB.prepare(
    `INSERT INTO content_revisions (content_id, revision_no, title, summary, body_md, meta_json, editor_id, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      row.id,
      next?.next ?? 1,
      row.title,
      row.summary,
      row.body_md,
      row.meta_json,
      c.get('user')?.id ?? null,
      note,
      nowIso(),
    )
    .run();
}

export async function loadContentTags(c: Context<AppEnv>, contentId: string): Promise<TagRow[]> {
  const rows = await c.env.DB.prepare(
    `SELECT t.id, t.name
     FROM tags t JOIN content_tags ct ON ct.tag_id = t.id
     WHERE ct.content_id = ?
     ORDER BY t.name`,
  )
    .bind(contentId)
    .all<TagRow>();
  return rows.results ?? [];
}

/** 内容与标签一次查询取回，减少一轮 D1 往返 */
export async function loadContentWithTags(
  c: Context<AppEnv>,
  id: string,
): Promise<{ row: ContentRow | null; tags: TagRow[] }> {
  const [contentResult, tagResult] = await c.env.DB.batch<Record<string, unknown>>([
    c.env.DB.prepare(
      `SELECT c.*, u.name AS author_name
       FROM content c LEFT JOIN users u ON u.id = c.author_id
       WHERE c.id = ?`,
    ).bind(id),
    c.env.DB.prepare(
      `SELECT t.id, t.name
       FROM tags t JOIN content_tags ct ON ct.tag_id = t.id
       WHERE ct.content_id = ?
       ORDER BY t.name`,
    ).bind(id),
  ]);

  return {
    row: ((contentResult.results ?? [])[0] as unknown as ContentRow | undefined) ?? null,
    tags: (tagResult.results ?? []) as unknown as TagRow[],
  };
}

export async function validateTagIds(
  c: Context<AppEnv>,
  value: unknown,
): Promise<{ ids: string[] } | { message: string } | null> {
  if (value === undefined) return null;
  if (!Array.isArray(value)) return { message: '标签格式不正确' };

  const ids = [...new Set(value.filter((item): item is string => typeof item === 'string'))];
  if (ids.length === 0) return { ids };

  const rows = await c.env.DB.prepare(
    `SELECT id FROM tags WHERE id IN (${ids.map(() => '?').join(', ')})`,
  )
    .bind(...ids)
    .all<{ id: string }>();
  const known = new Set((rows.results ?? []).map((row) => row.id));
  if (ids.some((id) => !known.has(id))) return { message: '提交的标签不存在' };

  return { ids };
}

export async function replaceContentTags(
  c: Context<AppEnv>,
  contentId: string,
  tagIds: string[],
): Promise<void> {
  const statements = [
    c.env.DB.prepare('DELETE FROM content_tags WHERE content_id = ?').bind(contentId),
  ];
  for (const tagId of [...new Set(tagIds)]) {
    statements.push(
      c.env.DB.prepare(
        'INSERT OR IGNORE INTO content_tags (content_id, tag_id) VALUES (?, ?)',
      ).bind(contentId, tagId),
    );
  }
  await c.env.DB.batch(statements);
}

export function optionalInt(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

/** 审核队列的 SQL 统计（review.ts 的 READY_EXPR）与此处规则保持一致 */
export function validateForPublish(row: ContentRow): string[] {
  const problems: string[] = [];
  const meta = parseMeta(row.meta_json);

  if (!row.summary.trim()) problems.push('摘要不能为空');
  if (!row.version) problems.push('必须指定码表版本');

  if (row.type === 'software' || row.type === 'lesson') {
    if (!row.verified_at) problems.push('需要先标记人工核对时间');
  }
  if (row.type === 'lesson') {
    const examples = meta.examples;
    if (!Array.isArray(examples) || examples.length < 3) problems.push('课时至少需要 3 条例字');
  }
  if (row.type === 'software') {
    const platforms = meta.platforms;
    if (!Array.isArray(platforms) || platforms.length === 0) problems.push('软件需要至少一个平台');
  }
  if (row.type === 'news') {
    if (!asString(meta.source_url).trim()) problems.push('资讯需要原文链接');
  }

  return problems;
}
