import { Hono } from 'hono';
import type { AppEnv } from '../../lib/env';
import type { CategoryRow } from '../../lib/categories';
import { toSiteCategory } from '../../lib/categories';
import { normalizePage, normalizePageSize } from '../../lib/pagination';
import { STATIC_CACHE_TTL, publicJson } from './public-cache';

export const keymapRoutes = new Hono<AppEnv>();

interface KeymapRootRow {
  key: string;
  mnemonic: string;
  roots: string;
  note: string | null;
  sort_order: number;
}

interface KeymapExampleRow {
  char: string;
  code: string;
  roots: string;
  note: string | null;
  sort_order: number;
}

/** 每个键位下发的代表例字数量，避免首屏携带整张例字表 */
const RELATED_PER_KEY = 6;

const ROOTS_SQL = `SELECT key, mnemonic, roots, note, sort_order
   FROM wubi_roots WHERE version = ? ORDER BY sort_order, key`;

keymapRoutes.get('/keymap', (c) =>
  publicJson(c, STATIC_CACHE_TTL, async ({ version }) => {
    // 字根、分区、例字总数、每键代表例字一次 batch 取回，不再下发整张例字表
    const [roots, related, zones, total] = await c.env.DB.batch<Record<string, unknown>>([
      c.env.DB.prepare(ROOTS_SQL).bind(version),
      c.env.DB.prepare(
        `SELECT char, code, roots, note, sort_order FROM (
           SELECT char, code, roots, note, sort_order,
                  ROW_NUMBER() OVER (
                    PARTITION BY substr(code, 1, 1) ORDER BY sort_order, code
                  ) AS rn
           FROM wubi_examples WHERE version = ?
         ) WHERE rn <= ?
         ORDER BY code, sort_order`,
      ).bind(version, RELATED_PER_KEY),
      c.env.DB.prepare(
        "SELECT * FROM categories WHERE domain = 'keymap_zone' ORDER BY sort_order, label",
      ),
      c.env.DB.prepare('SELECT COUNT(*) AS total FROM wubi_examples WHERE version = ?').bind(
        version,
      ),
    ]);

    const rootItems = (roots.results ?? []) as unknown as KeymapRootRow[];
    const relatedRows = (related.results ?? []) as unknown as KeymapExampleRow[];
    const totalRow = total.results?.[0] as { total?: number } | undefined;

    // 按编码首字母分组，键位详情面板直接读取
    const relatedMap: Record<string, KeymapExampleRow[]> = {};
    for (const row of relatedRows) {
      const key = row.code.slice(0, 1);
      (relatedMap[key] ??= []).push(row);
    }

    const zoneItems = ((zones.results ?? []) as unknown as CategoryRow[]).map(toSiteCategory);

    return c.json({
      version,
      roots: rootItems,
      zones: zoneItems,
      related: relatedMap,
      counts: { roots: rootItems.length, examples: Number(totalRow?.total ?? 0) },
    });
  }),
);

/** 练习页需要完整例字表来生成题目与编码提示，单独走一个缓存接口 */
keymapRoutes.get('/keymap/practice', (c) =>
  publicJson(c, STATIC_CACHE_TTL, async ({ version }) => {
    const [roots, examples] = await c.env.DB.batch<Record<string, unknown>>([
      c.env.DB.prepare(ROOTS_SQL).bind(version),
      c.env.DB.prepare(
        `SELECT char, code, roots, note, sort_order
         FROM wubi_examples WHERE version = ? ORDER BY sort_order, code`,
      ).bind(version),
    ]);

    const rootItems = (roots.results ?? []) as unknown as KeymapRootRow[];
    const exampleItems = (examples.results ?? []) as unknown as KeymapExampleRow[];

    return c.json({
      version,
      roots: rootItems,
      examples: exampleItems,
      counts: { roots: rootItems.length, examples: exampleItems.length },
    });
  }),
);

/** 例字速查：服务端分页 + 搜索，避免首屏加载整张例字表 */
keymapRoutes.get('/keymap/examples', (c) => {
  const query = (c.req.query('q') ?? '').trim();
  const page = normalizePage(c.req.query('page'));
  const perPage = normalizePageSize(c.req.query('per_page'));
  const like = `%${query}%`;

  return publicJson(c, STATIC_CACHE_TTL, async ({ version }) => {
    // 计数与分页数据一次 batch 取回，避免两次 D1 往返
    const [countResult, listResult] = await c.env.DB.batch<Record<string, unknown>>([
      c.env.DB.prepare(
        `SELECT COUNT(*) AS total
         FROM wubi_examples
         WHERE version = ? AND (? = '' OR char LIKE ? OR code LIKE ? OR roots LIKE ?)`,
      ).bind(version, query, like, like, like),
      c.env.DB.prepare(
        `SELECT char, code, roots, note, sort_order
         FROM wubi_examples
         WHERE version = ? AND (? = '' OR char LIKE ? OR code LIKE ? OR roots LIKE ?)
         ORDER BY sort_order, code
         LIMIT ? OFFSET ?`,
      ).bind(version, query, like, like, like, perPage, (page - 1) * perPage),
    ]);

    const totalRow = countResult.results?.[0] as { total?: number } | undefined;

    return c.json({
      version,
      items: (listResult.results ?? []) as unknown as KeymapExampleRow[],
      total: Number(totalRow?.total ?? 0),
      page,
      per_page: perPage,
    });
  });
});
