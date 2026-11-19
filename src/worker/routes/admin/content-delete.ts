// 内容删除：先清理关联表再删除主记录，避免外键约束导致失败
import type { Context } from 'hono';
import type { AppEnv } from '../../lib/env';

export async function deleteContentRows(c: Context<AppEnv>, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const placeholders = ids.map(() => '?').join(', ');
  await c.env.DB.batch([
    // 投稿保留，只解除与内容的关联
    c.env.DB.prepare(
      `UPDATE submissions SET content_id = NULL WHERE content_id IN (${placeholders})`,
    ).bind(...ids),
    c.env.DB.prepare(
      `DELETE FROM content_tags WHERE content_id IN (${placeholders})`,
    ).bind(...ids),
    c.env.DB.prepare(
      `DELETE FROM content_revisions WHERE content_id IN (${placeholders})`,
    ).bind(...ids),
    c.env.DB.prepare(`DELETE FROM content WHERE id IN (${placeholders})`).bind(...ids),
  ]);
}
