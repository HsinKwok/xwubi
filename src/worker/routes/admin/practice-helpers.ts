// 文章跟打篇目的共享类型、校验常量与缓存清理
import type { Context } from 'hono';
import type { AppEnv } from '../../lib/env';

export const TITLE_MAX = 60;
export const AUTHOR_MAX = 30;
export const DYNASTY_MAX = 20;
export const BODY_MAX = 50_000;

export interface PracticeTextRow {
  id: string;
  title: string;
  author: string;
  dynasty: string;
  genre: string;
  body: string;
  char_count: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type PracticeTextSummary = Omit<PracticeTextRow, 'body'>;

export interface CountRow {
  total: number;
}

/** 只统计汉字，标点与空白不计，与前台「N 字」口径一致 */
export function countChars(body: string): number {
  return (body.match(/\p{Script=Han}/gu) ?? []).length;
}

/** 写入后清理公开接口的边缘缓存，避免前台最多 5 分钟才看到改动 */
export async function purgePublicCache(c: Context<AppEnv>, id?: string): Promise<void> {
  const origin = new URL(c.req.url).origin;
  const paths = ['/api/site/texts'];
  if (id) paths.push(`/api/site/texts/${encodeURIComponent(id)}`);

  await Promise.all(
    paths.map((path) => caches.default.delete(`${origin}${path}`).catch(() => false)),
  );
}
