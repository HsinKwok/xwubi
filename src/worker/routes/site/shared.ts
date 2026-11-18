import type { Context } from 'hono';
import type { AppEnv } from '../../lib/env';
import { loadSiteSettings } from '../../lib/settings';

export const MAX_URL_LENGTH = 500;
export const MAX_NOTE_LENGTH = 4000;
export const SUBMISSION_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function clientIp(c: Context<AppEnv>): string {
  const forwarded = c.req.header('x-forwarded-for') ?? '';
  const first = forwarded.split(',')[0] ?? '';
  return (c.req.header('cf-connecting-ip') || first).trim() || 'unknown';
}

/** 允许 http(s) 链接；allowPath 为 true 时也接受站内相对路径 */
export function normalizeUrl(value: string, allowPath: boolean): string | null {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.length > MAX_URL_LENGTH) return null;
  if (allowPath && trimmed.startsWith('/')) return trimmed;

  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

/** 校验投稿版本：仅接受站点配置中启用的码表版本，其余视为通用（null） */
export async function normalizeVersionChoice(
  value: string,
  c: Context<AppEnv>,
): Promise<string | null> {
  if (!value) return null;
  const { config } = await loadSiteSettings(c.env);
  return config.versions.some((item) => item.value === value) ? value : null;
}

/** 把非关键副作用（如发邮件）放到响应之后执行，缩短接口耗时 */
export function defer(c: Context<AppEnv>, task: Promise<unknown>): void {
  try {
    c.executionCtx.waitUntil(task);
  } catch {
    void task;
  }
}
