// 内容的创建与编辑保存
import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { ContentRow } from '../../lib/content';
import type { AppEnv, StaffUser } from '../../lib/env';
import { asString, clampInt } from '../../lib/http';
import { newId, nowIso } from '../../lib/ids';
import {
  contentVersionScope,
  isKnownContentType,
  isKnownStage,
  loadContentWithTags,
  optionalInt,
  replaceContentTags,
  saveRevision,
  validateTagIds,
} from './content-helpers';
import type { TagRow } from './rows';

export interface ContentActionError {
  status: ContentfulStatusCode;
  code: string;
  message: string;
}

export const DUPLICATE_SLUG_MESSAGE = '同一类型与版本下已存在这个 slug';

export function isUniqueViolation(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /UNIQUE/i.test(message);
}

export async function createContent(
  c: Context<AppEnv>,
  body: Record<string, unknown>,
  user: StaffUser,
): Promise<
  | { error: ContentActionError }
  | { id: string; title: string; row: ContentRow | null; tags: TagRow[] }
> {
  const type = asString(body.type);
  if (!(await isKnownContentType(c, type))) {
    return { error: { status: 400, code: 'invalid_type', message: '内容类型不合法' } };
  }
  if (user.role === 'ops' && type !== 'news') {
    return { error: { status: 403, code: 'forbidden', message: '运营角色只能创建资讯' } };
  }

  const stage = asString(body.stage);
  if (stage && !(await isKnownStage(c, stage))) {
    return { error: { status: 400, code: 'invalid_stage', message: '教学阶段不合法' } };
  }

  const title = asString(body.title).trim();
  if (!title) return { error: { status: 400, code: 'invalid_title', message: '标题不能为空' } };

  const versionScope = await contentVersionScope(c);
  const version = asString(body.version) || versionScope.defaultVersion;
  if (!versionScope.values.includes(version)) {
    return { error: { status: 400, code: 'invalid_version', message: '码表版本不合法' } };
  }

  const now = nowIso();
  const id = newId('cnt');
  const slug = asString(body.slug).trim() || `${type}-${Date.now().toString(36)}`;
  const meta = body.meta && typeof body.meta === 'object' ? body.meta : {};

  const tagResult = await validateTagIds(c, body.tag_ids);
  if (tagResult && 'message' in tagResult) {
    return { error: { status: 400, code: 'invalid_tag', message: tagResult.message } };
  }

  try {
    await c.env.DB.prepare(
      `INSERT INTO content (id, type, slug, version, title, summary, body_md, meta_json, stage, lesson_no, sort_order, status, author_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?)`,
    )
      .bind(
        id,
        type,
        slug,
        version,
        title,
        asString(body.summary),
        asString(body.body_md),
        JSON.stringify(meta),
        stage || null,
        optionalInt(body.lesson_no),
        clampInt(body.sort_order, -9999, 9999, 0),
        user.id,
        now,
        now,
      )
      .run();
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        error: { status: 409, code: 'duplicate_slug', message: DUPLICATE_SLUG_MESSAGE },
      };
    }
    throw error;
  }

  await replaceContentTags(c, id, tagResult && 'ids' in tagResult ? tagResult.ids : []);
  const { row, tags } = await loadContentWithTags(c, id);
  if (row) await saveRevision(c, row, '创建草稿');

  return { id, title, row, tags };
}

export async function updateContent(
  c: Context<AppEnv>,
  existing: ContentRow,
  body: Record<string, unknown>,
): Promise<
  | { error: ContentActionError }
  | { row: ContentRow | null; tags: TagRow[]; diff: Record<string, unknown> }
> {
  const expected = asString(body.expected_updated_at);
  if (expected && expected !== existing.updated_at) {
    return { error: { status: 409, code: 'edit_conflict', message: '内容已被他人修改，请刷新后重试' } };
  }

  const tagResult = await validateTagIds(c, body.tag_ids);
  if (tagResult && 'message' in tagResult) {
    return { error: { status: 400, code: 'invalid_tag', message: tagResult.message } };
  }

  const assignments: Array<[string, unknown]> = [];
  if (typeof body.title === 'string') assignments.push(['title', body.title.trim()]);
  if (typeof body.summary === 'string') assignments.push(['summary', body.summary]);
  if (typeof body.body_md === 'string') assignments.push(['body_md', body.body_md]);
  if (typeof body.slug === 'string' && body.slug.trim()) assignments.push(['slug', body.slug.trim()]);
  if (typeof body.version === 'string') {
    const { values } = await contentVersionScope(c);
    if (values.includes(body.version)) assignments.push(['version', body.version]);
  }
  if (typeof body.stage === 'string') {
    if (body.stage && !(await isKnownStage(c, body.stage))) {
      return { error: { status: 400, code: 'invalid_stage', message: '教学阶段不合法' } };
    }
    assignments.push(['stage', body.stage || null]);
  }
  if (body.lesson_no !== undefined) {
    assignments.push(['lesson_no', optionalInt(body.lesson_no)]);
  }
  if (body.sort_order !== undefined) {
    assignments.push(['sort_order', clampInt(body.sort_order, -9999, 9999, 0)]);
  }
  if (body.meta && typeof body.meta === 'object') {
    assignments.push(['meta_json', JSON.stringify(body.meta)]);
  }
  if (typeof body.verified_at === 'string' && body.verified_at) {
    assignments.push(['verified_at', body.verified_at]);
  }

  if (assignments.length === 0 && !(tagResult && 'ids' in tagResult)) {
    return { error: { status: 400, code: 'empty_update', message: '没有可更新的字段' } };
  }

  const fields: string[] = [];
  const params: unknown[] = [];
  const diff: Record<string, unknown> = {};

  for (const [column, value] of assignments) {
    fields.push(`${column} = ?`);
    params.push(value);
    diff[column] = value;
  }

  const now = nowIso();
  fields.push('updated_at = ?');
  params.push(now);

  try {
    await c.env.DB.prepare(`UPDATE content SET ${fields.join(', ')} WHERE id = ?`)
      .bind(...params, existing.id)
      .run();
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        error: { status: 409, code: 'duplicate_slug', message: DUPLICATE_SLUG_MESSAGE },
      };
    }
    throw error;
  }

  if (tagResult && 'ids' in tagResult) {
    await replaceContentTags(c, existing.id, tagResult.ids);
    diff.tag_ids = tagResult.ids;
  }
  const { row, tags } = await loadContentWithTags(c, existing.id);
  if (row) await saveRevision(c, row, '保存草稿');

  return { row, tags, diff };
}
