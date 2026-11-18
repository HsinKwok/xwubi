import { Hono } from 'hono';
import type { BootstrapPayload } from '../../../shared/site-config';
import type { AppEnv } from '../../lib/env';
import { buildCollections, loadSiteTaxonomy } from '../../lib/site-taxonomy';
import { resolveSections } from './sections';
import { PUBLIC_CACHE_TTL, publicJson } from './public-cache';

export const bootstrapRoutes = new Hono<AppEnv>();

bootstrapRoutes.get('/bootstrap', (c) =>
  publicJson(c, PUBLIC_CACHE_TTL, async ({ config, epoch, version }) => {
    const [sections, taxonomy] = await Promise.all([
      resolveSections(c.env, config.home.sections ?? [], version),
      loadSiteTaxonomy(c.env),
    ]);

    const payload: BootstrapPayload = {
      brand: config.brand,
      theme: config.theme,
      versions: config.versions,
      defaultVersion: config.defaultVersion,
      types: taxonomy.types,
      nav: config.nav,
      header: config.header,
      home: { sections },
      collections: buildCollections(config, taxonomy),
      pages: config.pages,
      footer: config.footer,
      labels: config.labels,
      meta: { epoch, generatedAt: new Date().toISOString(), version },
    };

    return c.json(payload);
  }),
);
