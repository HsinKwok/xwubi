// 内容状态流转：提审、发布、下架、归档与驳回
import type { Context } from 'hono';
import type { ContentRow } from '../../lib/content';
import type { AppEnv } from '../../lib/env';
import { nowIso } from '../../lib/ids';
import { saveRevision, validateForPublish } from './content-helpers';
import type { ContentActionError } from './content-write';

export async function submitContent(
  c: Context<AppEnv>,
  row: ContentRow,
): Promise<ContentActionError | null> {
  if (!['draft', 'needs_review'].includes(row.status)) {
    return { status: 409, code: 'invalid_transition', message: '当前状态不能提交审核' };
  }

  await c.env.DB.prepare("UPDATE content SET status = 'pending', updated_at = ? WHERE id = ?")
    .bind(nowIso(), row.id)
    .run();

  return null;
}

export async function publishContent(
  c: Context<AppEnv>,
  row: ContentRow,
): Promise<{ error: ContentActionError } | { publishedAt: string }> {
  const problems = validateForPublish(row);
  if (problems.length > 0) {
    return {
      error: { status: 422, code: 'validation_failed', message: problems.join('；') },
    };
  }

  const now = nowIso();
  await c.env.DB.prepare(
    "UPDATE content SET status = 'published', published_at = COALESCE(published_at, ?), updated_at = ? WHERE id = ?",
  )
    .bind(now, now, row.id)
    .run();

  return { publishedAt: row.published_at ?? now };
}

export async function unpublishContent(
  c: Context<AppEnv>,
  row: ContentRow,
): Promise<ContentActionError | null> {
  if (row.status !== 'published') {
    return { status: 409, code: 'invalid_transition', message: '只有已发布内容可以下架' };
  }

  await c.env.DB.prepare(
    'UPDATE content SET status = \'draft\', published_at = NULL, updated_at = ? WHERE id = ?',
  )
    .bind(nowIso(), row.id)
    .run();

  return null;
}

export async function archiveContent(
  c: Context<AppEnv>,
  row: ContentRow,
): Promise<ContentActionError | null> {
  if (row.status === 'archived') {
    return { status: 409, code: 'invalid_transition', message: '内容已归档' };
  }

  await c.env.DB.prepare("UPDATE content SET status = 'archived', updated_at = ? WHERE id = ?")
    .bind(nowIso(), row.id)
    .run();

  return null;
}

export async function rejectContent(
  c: Context<AppEnv>,
  row: ContentRow,
  note: string,
): Promise<ContentActionError | null> {
  if (row.status !== 'pending' && row.status !== 'needs_review') {
    return { status: 409, code: 'invalid_transition', message: '只有待审核内容可以驳回' };
  }

  await c.env.DB.prepare("UPDATE content SET status = 'draft', updated_at = ? WHERE id = ?")
    .bind(nowIso(), row.id)
    .run();
  await saveRevision(c, row, note ? `驳回：${note}` : '驳回');

  return null;
}
