// 后台账号列表查询
import { Hono } from 'hono';
import type { AppEnv, StaffRole } from '../../lib/env';
import { readPageParams } from '../../lib/http';
import { requireRole } from '../../lib/session';
import { STAFF_ROLES, STAFF_STATUS_FILTERS } from './constants';
import type { StaffRow } from './rows';
import { mapStaff } from './rows';

export const usersListRoutes = new Hono<AppEnv>();

const requireAdmin = requireRole('admin');

usersListRoutes.get('/', requireAdmin, async (c) => {
  const url = new URL(c.req.url);
  const conditions: string[] = [];
  const params: unknown[] = [];

  const keyword = url.searchParams.get('q');
  if (keyword) {
    conditions.push('(name LIKE ? OR email LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const role = url.searchParams.get('role');
  if (role && STAFF_ROLES.includes(role as StaffRole)) {
    conditions.push('role = ?');
    params.push(role);
  }

  const status = url.searchParams.get('status');
  if (status && STAFF_STATUS_FILTERS.includes(status)) {
    conditions.push('status = ?');
    params.push(status);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const { page, perPage, offset } = readPageParams(url);

  const [totalResult, rowsResult, countResult] = await c.env.DB.batch<Record<string, unknown>>([
    c.env.DB.prepare(`SELECT COUNT(*) AS total FROM users ${where}`).bind(...params),
    c.env.DB.prepare(
      `SELECT id, name, email, role, status, must_change_password, last_login_at, created_at, updated_at
       FROM users ${where}
       ORDER BY CASE role WHEN 'admin' THEN 0 WHEN 'editor' THEN 1 WHEN 'reviewer' THEN 2 ELSE 3 END,
                created_at DESC
       LIMIT ? OFFSET ?`,
    ).bind(...params, perPage, offset),
    c.env.DB.prepare('SELECT role, status, COUNT(*) AS total FROM users GROUP BY role, status'),
  ]);

  const total = Number((totalResult.results?.[0] as { total?: number } | undefined)?.total ?? 0);
  const rows = (rowsResult.results ?? []) as unknown as StaffRow[];
  const groups = (countResult.results ?? []) as unknown as Array<{
    role: string;
    status: string;
    total: number;
  }>;

  const counts: Record<string, number> = {};
  for (const item of STAFF_ROLES) counts[item] = 0;
  for (const item of STAFF_STATUS_FILTERS) counts[item] = 0;
  for (const row of groups) {
    if (row.role in counts) counts[row.role] += row.total;
    if (row.status in counts) counts[row.status] += row.total;
  }

  return c.json({
    items: rows.map(mapStaff),
    total,
    page,
    per_page: perPage,
    counts,
  });
});
