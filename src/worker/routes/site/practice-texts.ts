import { Hono } from 'hono';
import type {
  PracticeTextListPayload,
  PracticeTextPayload,
} from '../../../shared/site-config';
import type { AppEnv } from '../../lib/env';
import type { CategoryRow } from '../../lib/categories';
import { toSiteCategory } from '../../lib/categories';
import { fail } from '../../lib/http';
import { STATIC_CACHE_TTL, publicJson } from './public-cache';

export const practiceTextRoutes = new Hono<AppEnv>();

interface PracticeTextRow {
  id: string;
  title: string;
  author: string;
  dynasty: string;
  genre: string;
  body: string;
  char_count: number;
  sort_order: number;
}

practiceTextRoutes.get('/texts', (c) =>
  publicJson(c, STATIC_CACHE_TTL, async () => {
    // 篇目列表与练习体裁一次 batch 取回
    const [texts, genres] = await c.env.DB.batch<Record<string, unknown>>([
      c.env.DB.prepare(
        `SELECT id, title, author, dynasty, genre, char_count, sort_order
         FROM practice_texts ORDER BY sort_order, title`,
      ),
      c.env.DB.prepare(
        "SELECT * FROM categories WHERE domain = 'practice_genre' ORDER BY sort_order, label",
      ),
    ]);

    const items = (texts.results ?? []) as unknown as Array<Omit<PracticeTextRow, 'body'>>;
    const genreItems = ((genres.results ?? []) as unknown as CategoryRow[]).map(toSiteCategory);
    const payload: PracticeTextListPayload = {
      items,
      total: items.length,
      genres: genreItems,
    };
    return c.json(payload);
  }),
);

practiceTextRoutes.get('/texts/:id', (c) =>
  publicJson(c, STATIC_CACHE_TTL, async () => {
    const row = await c.env.DB.prepare(
      `SELECT id, title, author, dynasty, genre, body, char_count, sort_order
       FROM practice_texts WHERE id = ? LIMIT 1`,
    )
      .bind(c.req.param('id'))
      .first<PracticeTextRow>();

    if (!row) return fail(c, 404, 'text_not_found', '篇目不存在');
    return c.json({ item: row } satisfies PracticeTextPayload);
  }),
);
