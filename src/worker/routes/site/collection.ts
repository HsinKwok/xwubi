import { Hono } from 'hono';
import type { CollectionPayload } from '../../../shared/site-config';
import type { AppEnv } from '../../lib/env';
import { listPublishedPage } from '../../lib/content';
import { fail } from '../../lib/http';
import { normalizePage, normalizePageSize } from '../../lib/pagination';
import { buildCollections, loadSiteTaxonomy } from '../../lib/site-taxonomy';
import { PUBLIC_CACHE_TTL, publicJson } from './public-cache';

export const collectionRoutes = new Hono<AppEnv>();

/** 合集首页条数；滚动加载时按同一页大小追加 */
const COLLECTION_PAGE_SIZE = 24;

collectionRoutes.get('/collection', (c) =>
  publicJson(c, PUBLIC_CACHE_TTL, async ({ config, version }) => {
    const taxonomy = await loadSiteTaxonomy(c.env);
    const collections = buildCollections(config, taxonomy);
    const type = c.req.query('type') ?? taxonomy.types[0]?.slug ?? '';
    const meta = collections[type];

    if (!meta) return fail(c, 404, 'collection_not_found', '未知的内容类型');

    const stage = c.req.query('stage') || undefined;
    const tag = c.req.query('tag') || undefined;
    const cursor = c.req.query('cursor') || undefined;

    const page = normalizePage(c.req.query('page'));
    const perPage = c.req.query('per_page')
      ? normalizePageSize(c.req.query('per_page'))
      : COLLECTION_PAGE_SIZE;

    const { items, total, nextCursor } = await listPublishedPage(c.env, {
      type,
      version,
      stage,
      tag,
      limit: perPage,
      offset: (page - 1) * perPage,
      cursor,
    });

    const payload: CollectionPayload = {
      page: { ...meta, type, version },
      items,
      total,
      per_page: perPage,
      next_cursor: nextCursor,
    };

    return c.json(payload);
  }),
);
