import { Hono } from 'hono';
import type { StaticPagePayload } from '../../../shared/site-config';
import type { AppEnv } from '../../lib/env';
import { fail } from '../../lib/http';
import { PUBLIC_CACHE_TTL, publicJson } from './public-cache';

export const pageRoutes = new Hono<AppEnv>();

pageRoutes.get('/page/:key', (c) =>
  publicJson(c, PUBLIC_CACHE_TTL, async ({ config }) => {
    const page = config.pages?.[c.req.param('key')];
    if (!page) return fail(c, 404, 'page_not_found', '页面不存在');

    const payload: StaticPagePayload = { page, labels: config.labels ?? {} };
    return c.json(payload);
  }),
);
