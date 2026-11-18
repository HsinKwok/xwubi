// 内容修订回滚
import type { Context } from 'hono';
import type { ContentRow } from '../../lib/content';
import type { AppEnv } from '../../lib/env';
import { nowIso } from '../../lib/ids';
import { loadContentWithTags, saveRevision } from './content-helpers';
import { loadContentRevision } from './content-queries';
import type { ContentActionError } from './content-write';
import type { TagRow } from './rows';

export async function restoreContentRevision(
  c: Context<AppEnv>,
  existing: ContentRow,
  revisionId: number,
  expected: string,
): Promise<
  | { error: ContentActionError }
  | {
      row: ContentRow | null;
      tags: TagRow[];
      revisionNo: number;
      revisionTitle: string;
    }
> {
  if (expected && expected !== existing.updated_at) {
    return { error: { status: 409, code: 'edit_conflict', message: '内容已被他人修改，请刷新后重试' } };
  }

  const revision = await loadContentRevision(c, existing.id, revisionId);
  if (!revision) {
    return { error: { status: 404, code: 'revision_not_found', message: '修订记录不存在' } };
  }

  const now = nowIso();
  await c.env.DB.prepare(
    `UPDATE content
     SET title = ?, summary = ?, body_md = ?, meta_json = ?, updated_at = ?
     WHERE id = ?`,
  )
    .bind(revision.title, revision.summary, revision.body_md, revision.meta_json, now, existing.id)
    .run();

  const { row, tags } = await loadContentWithTags(c, existing.id);
  if (row) await saveRevision(c, row, `回滚到第 ${revision.revision_no} 版`);

  return { row, tags, revisionNo: revision.revision_no, revisionTitle: revision.title };
}
