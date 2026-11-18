import { Hono } from 'hono';
import type { AppEnv } from '../../lib/env';
import { nowIso } from '../../lib/ids';
import { ACTION_LABELS } from './constants';
import type { ActivityRow, DistributionRow, QueueRow, SummaryRow } from './rows';

export const dashboardRoutes = new Hono<AppEnv>();

dashboardRoutes.get('/dashboard', async (c) => {
  // 4 个查询合并为一次 D1 round trip
  const [summaryResult, queueResult, distributionResult, activityResult, typeResult] =
    await c.env.DB.batch<Record<string, unknown>>([
    c.env.DB.prepare(
      `SELECT
         (SELECT COUNT(*) FROM content WHERE status = 'published') AS published,
         (SELECT COUNT(*) FROM content WHERE status IN ('pending', 'needs_review')) AS pending,
         (SELECT COUNT(*) FROM submissions WHERE status IN ('new', 'confirmed', 'claimed')) AS submissions,
         (SELECT COUNT(*) FROM feedback WHERE status IN ('open', 'assigned')) AS feedback`,
    ),
    c.env.DB.prepare(
      `SELECT c.id, c.title, c.type, c.version, c.updated_at, u.name AS author_name
       FROM content c LEFT JOIN users u ON u.id = c.author_id
       WHERE c.status IN ('pending', 'needs_review')
       ORDER BY c.updated_at DESC LIMIT 6`,
    ),
    c.env.DB.prepare(
      `SELECT type, COUNT(*) AS count FROM content WHERE status = 'published' GROUP BY type`,
    ),
    c.env.DB.prepare(
      `SELECT a.id, a.action, a.summary, a.created_at, u.name AS actor
       FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_id
       ORDER BY a.created_at DESC LIMIT 6`,
    ),
    c.env.DB.prepare(
      "SELECT slug, label FROM categories WHERE domain = 'content_type'",
    ),
  ]);

  const summary = summaryResult.results?.[0] as unknown as SummaryRow | undefined;
  const queueRows = (queueResult.results ?? []) as unknown as QueueRow[];
  const distributionRows = (distributionResult.results ?? []) as unknown as DistributionRow[];
  const activityRows = (activityResult.results ?? []) as unknown as ActivityRow[];
  const typeRows = (typeResult.results ?? []) as unknown as Array<{
    slug: string;
    label: string;
  }>;
  const typeLabels = new Map(typeRows.map((row) => [row.slug, row.label]));

  const pending = summary?.pending ?? 0;
  const submissions = summary?.submissions ?? 0;

  return c.json({
    counts: { review: pending, users: submissions },
    stats: [
      {
        key: 'published',
        label: '已发布内容',
        value: summary?.published ?? 0,
        hint: '全部类型与码表版本',
        icon: 'file',
      },
      {
        key: 'review',
        label: '待审核',
        value: pending,
        hint: '含内容修订与待归档',
        icon: 'checkSquare',
      },
      {
        key: 'submissions',
        label: '待处理投稿',
        value: submissions,
        hint: '来自投稿入口',
        icon: 'users',
      },
      {
        key: 'feedback',
        label: '未处理纠错',
        value: summary?.feedback ?? 0,
        hint: '来自页面反馈',
        icon: 'shield',
      },
    ],
    queue: queueRows.map((row) => ({
      id: row.id,
      title: row.title,
      type: row.type,
      version: row.version,
      submitter: row.author_name ?? '站内编辑',
      updatedAt: row.updated_at,
      href: `/admin/content/${row.id}`,
    })),
    distribution: distributionRows.map((row) => ({
      label: typeLabels.get(row.type) ?? row.type,
      count: row.count,
    })),
    activities: activityRows.map((row) => ({
      id: row.id,
      actor: row.actor ?? '系统',
      action: ACTION_LABELS[row.action] ?? row.action,
      target: row.summary,
      createdAt: row.created_at,
    })),
    generated_at: nowIso(),
  });
});
