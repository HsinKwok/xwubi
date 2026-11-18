import { Hono } from 'hono';
import type { ContentPayload } from '../../../shared/site-config';
import type { AppEnv } from '../../lib/env';
import type { ContentRow } from '../../lib/content';
import { mapPublicContent, parseMeta } from '../../lib/content';
import { fail } from '../../lib/http';
import { loadSiteTaxonomy } from '../../lib/site-taxonomy';
import { PUBLIC_CACHE_TTL, publicJson } from './public-cache';

export const contentRoutes = new Hono<AppEnv>();

contentRoutes.get('/content/:type/:slug', (c) =>
  publicJson(c, PUBLIC_CACHE_TTL, async ({ config, version }) => {
    const type = c.req.param('type');
    const slug = c.req.param('slug');

    // 内容与分类标签并行；标签直接复用 taxonomy，避免第二次查库
    const [taxonomy, matched] = await Promise.all([
      loadSiteTaxonomy(c.env),
      c.env.DB.prepare(
        `SELECT * FROM content
         WHERE type = ? AND slug = ? AND status = 'published' AND version IN (?, 'all')
         ORDER BY (version = ?) DESC, COALESCE(published_at, updated_at) DESC
         LIMIT 1`,
      )
        .bind(type, slug, version, version)
        .first<ContentRow>(),
    ]);

    // 条目只在部分码表版本下存在（如 98 版独有的词库）：切换版本时回退到原版本，
    // 由前端提示「该条目不适用于当前版本」，避免整页变成加载失败
    const row =
      matched ??
      (await c.env.DB.prepare(
        `SELECT * FROM content
         WHERE type = ? AND slug = ? AND status = 'published'
         ORDER BY (version = 'all') DESC, COALESCE(published_at, updated_at) DESC
         LIMIT 1`,
      )
        .bind(type, slug)
        .first<ContentRow>());

    if (!row) return fail(c, 404, 'content_not_found', '内容不存在或尚未发布');

    const labels = config.labels ?? {};
    const payload: ContentPayload = {
      chrome: {
        backLabel: labels.backToCollection ?? '返回列表',
        versionLabel: labels.versionLabel ?? '适用版本',
        updatedLabel: labels.updatedLabel ?? '更新于',
        sourceLabel: labels.sourceLabel ?? '原文链接',
        typeLabel: taxonomy.types.find((item) => item.slug === type)?.label ?? type,
      },
      item: {
        ...mapPublicContent(row),
        body_md: row.body_md,
        meta: parseMeta(row.meta_json),
      },
    };

    return c.json(payload);
  }),
);
