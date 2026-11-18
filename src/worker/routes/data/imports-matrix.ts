// 码表数据概览：按版本汇总字根与例字数量、缺失键位
import { Hono } from 'hono';
import type { AppEnv } from '../../lib/env';
import { LETTERS, codeVersions } from './shared';

export const importMatrixRoutes = new Hono<AppEnv>();

importMatrixRoutes.get('/matrix', async (c) => {
  // 3 个统计查询合并为一次 D1 round trip
  const [rootStats, exampleStats, rootKeys] = await c.env.DB.batch<Record<string, unknown>>([
    c.env.DB.prepare(
      `SELECT version, COUNT(*) AS count, MAX(updated_at) AS updated_at
       FROM wubi_roots GROUP BY version`,
    ),
    c.env.DB.prepare(
      `SELECT version, COUNT(*) AS count, MAX(updated_at) AS updated_at
       FROM wubi_examples GROUP BY version`,
    ),
    c.env.DB.prepare('SELECT version, key FROM wubi_roots'),
  ]);

  const rootRows = (rootStats.results ?? []) as unknown as Array<{
    version: string;
    count: number;
    updated_at: string | null;
  }>;
  const exampleRows = (exampleStats.results ?? []) as unknown as Array<{
    version: string;
    count: number;
    updated_at: string | null;
  }>;
  const keyRows = (rootKeys.results ?? []) as unknown as Array<{ version: string; key: string }>;

  const keyMap = new Map<string, Set<string>>();
  for (const row of keyRows) {
    const keys = keyMap.get(row.version) ?? new Set<string>();
    keys.add(row.key);
    keyMap.set(row.version, keys);
  }

  const rootMap = new Map(rootRows.map((row) => [row.version, row]));
  const exampleMap = new Map(exampleRows.map((row) => [row.version, row]));

  const versions = await codeVersions(c);

  return c.json({
    versions: versions.map((version) => {
      const keys = keyMap.get(version) ?? new Set<string>();
      const roots = rootMap.get(version);
      const examples = exampleMap.get(version);
      return {
        version,
        roots: {
          count: roots?.count ?? 0,
          updated_at: roots?.updated_at ?? null,
          missing_keys: LETTERS.filter((key) => !keys.has(key)),
        },
        examples: {
          count: examples?.count ?? 0,
          updated_at: examples?.updated_at ?? null,
        },
      };
    }),
  });
});
