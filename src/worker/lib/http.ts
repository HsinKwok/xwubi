import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { AppEnv } from './env';

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    request_id: string;
  };
}

export function fail(
  c: Context<AppEnv>,
  status: ContentfulStatusCode,
  code: string,
  message: string,
): Response {
  const body: ApiErrorBody = {
    error: { code, message, request_id: c.get('requestId') ?? '' },
  };
  return c.json(body, status);
}

export async function readJson<T>(c: Context<AppEnv>): Promise<T | null> {
  try {
    return (await c.req.json()) as T;
  } catch {
    return null;
  }
}

export function isSameOrigin(requestUrl: string, origin: string): boolean {
  try {
    return new URL(origin).origin === new URL(requestUrl).origin;
  } catch {
    return false;
  }
}

export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}

export function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export interface PageParams {
  page: number;
  perPage: number;
  offset: number;
}

/** 统一解析分页参数，避免各接口重复实现 */
export function readPageParams(url: URL, defaultPerPage = 20): PageParams {
  const page = clampInt(url.searchParams.get('page'), 1, 999, 1);
  const perPage = clampInt(url.searchParams.get('per_page'), 1, 100, defaultPerPage);
  return { page, perPage, offset: (page - 1) * perPage };
}
