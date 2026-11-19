import type { Context } from 'hono';
import type { SiteConfig } from '../../../shared/site-config';
import type { AppEnv } from '../../lib/env';
import { edgeCached } from '../../lib/cache';
import { loadSiteSettings, normalizeVersion } from '../../lib/settings';

/** 首页、合集、详情等随内容更新的公开接口 */
export const PUBLIC_CACHE_TTL = 300;
/** 码表、篇目等低频静态数据 */
export const STATIC_CACHE_TTL = 600;

/**
 * 参与缓存键的业务参数。固定顺序重建，避免 `?a=1&b=2` 与 `?b=2&a=1`
 * 各存一份；其余无关参数（跟踪参数等）不进入缓存键。
 */
const CACHE_PARAMS = ['type', 'stage', 'tag', 'page', 'per_page', 'cursor', 'q'] as const;

export interface PublicContext {
  config: SiteConfig;
  epoch: number;
  /** 已按站点配置归一化的码表版本 */
  version: string;
}

function buildCacheKey(c: Context<AppEnv>, version: string, epoch: number): string {
  const url = new URL(c.req.url);
  const params = new URLSearchParams({ version });
  for (const key of CACHE_PARAMS) {
    const value = c.req.query(key);
    if (value) params.set(key, value);
  }
  params.set('__v', String(epoch));
  url.search = params.toString();
  return url.toString();
}

/**
 * 公开 GET 接口的统一入口：
 *   1. 读取站点配置与缓存 epoch（实例内复用，不会每个请求都查 D1）；
 *   2. 归一化 version 后生成固定顺序的缓存键，交给边缘缓存。
 * 各路由只保留自己的查询与组装逻辑。
 */
export async function publicJson(
  c: Context<AppEnv>,
  ttl: number,
  build: (ctx: PublicContext) => Promise<Response>,
): Promise<Response> {
  const { config, epoch } = await loadSiteSettings(c.env);
  const version = normalizeVersion(c.req.query('version'), config);

  return edgeCached(c, ttl, buildCacheKey(c, version, epoch), () =>
    build({ config, epoch, version }),
  );
}
