import type { Context } from 'hono';
import type { AppEnv } from '../../lib/env';

/** 构造状态统计语句，供批量查询复用 */
export function statusCountStatement(
  c: Context<AppEnv>,
  table: 'submissions' | 'feedback',
  statuses: string[],
): D1PreparedStatement {
  const selects = statuses
    .map((status) => `SUM(CASE WHEN status = '${status}' THEN 1 ELSE 0 END) AS c_${status}`)
    .join(', ');
  return c.env.DB.prepare(`SELECT ${selects} FROM ${table}`);
}

export function readStatusCounts(
  result: { results?: unknown[] } | undefined,
  statuses: string[],
): Record<string, number> {
  const row = result?.results?.[0] as Record<string, number | null> | undefined;
  const counts: Record<string, number> = {};
  for (const status of statuses) counts[status] = Number(row?.[`c_${status}`] ?? 0);
  return counts;
}
