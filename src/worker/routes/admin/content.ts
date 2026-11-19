import { Hono } from 'hono';
import type { AppEnv } from '../../lib/env';
import { writeAudit } from '../../lib/audit';
import { asString, fail, readJson } from '../../lib/http';
import { requireRole } from '../../lib/session';
import { bumpEpoch } from '../../lib/settings';
import { REVIEWERS, WRITERS } from './constants';
import { loadContent, loadContentWithTags } from './content-helpers';
import {
  archiveContent,
  createContent,
  deleteContentRows,
  publishContent,
  rejectContent,
  restoreContentRevision,
  submitContent,
  unpublishContent,
  updateContent,
} from './content-mutations';
import { listAdminContents, listContentRevisions } from './content-queries';
import { mapAdminContent } from './rows';

export const contentRoutes = new Hono<AppEnv>();

contentRoutes.get('/', async (c) => {
  return c.json(await listAdminContents(c, new URL(c.req.url)));
});

contentRoutes.post('/', requireRole(...WRITERS), async (c) => {
  const body = await readJson<Record<string, unknown>>(c);
  if (!body) return fail(c, 400, 'invalid_request', '请求体必须是 JSON');

  const user = c.get('user')!;
  const result = await createContent(c, body, user);
  if ('error' in result) {
    return fail(c, result.error.status, result.error.code, result.error.message);
  }

  await writeAudit(c, {
    action: 'content.create',
    targetType: 'content',
    targetId: result.id,
    summary: result.title,
  });

  return c.json(
    {
      item: result.row ? { ...mapAdminContent(result.row), tags: result.tags } : null,
    },
    201,
  );
});

contentRoutes.post('/batch-delete', requireRole(...WRITERS), async (c) => {
  const body = await readJson<Record<string, unknown>>(c);
  if (!body) return fail(c, 400, 'invalid_request', '请求体必须是 JSON');

  const ids = Array.isArray(body.ids)
    ? [
        ...new Set(
          body.ids.filter(
            (item): item is string => typeof item === 'string' && item.trim().length > 0,
          ),
        ),
      ]
    : [];
  if (ids.length === 0) return fail(c, 400, 'invalid_request', '请选择要删除的内容');
  if (ids.length > 100) return fail(c, 400, 'invalid_request', '一次最多删除 100 条内容');

  const placeholders = ids.map(() => '?').join(', ');
  const found = await c.env.DB.prepare(
    `SELECT id, title, type, status FROM content WHERE id IN (${placeholders})`,
  )
    .bind(...ids)
    .all<{ id: string; title: string; type: string; status: string }>();
  const rows = found.results ?? [];
  if (rows.length === 0) return fail(c, 404, 'content_not_found', '内容不存在');

  const user = c.get('user')!;
  if (user.role === 'ops' && rows.some((row) => row.type !== 'news')) {
    return fail(c, 403, 'forbidden', '运营角色只能删除资讯');
  }

  await deleteContentRows(
    c,
    rows.map((row) => row.id),
  );
  if (rows.some((row) => row.status === 'published')) await bumpEpoch(c.env);

  for (const row of rows) {
    await writeAudit(c, {
      action: 'content.delete',
      targetType: 'content',
      targetId: row.id,
      summary: row.title,
    });
  }

  return c.json({ ok: true, deleted: rows.length });
});

contentRoutes.get('/:id', async (c) => {
  const { row, tags } = await loadContentWithTags(c, c.req.param('id') ?? '');
  if (!row) return fail(c, 404, 'content_not_found', '内容不存在');
  return c.json({ item: { ...mapAdminContent(row), tags } });
});

contentRoutes.delete('/:id', requireRole(...WRITERS), async (c) => {
  const id = c.req.param('id') ?? '';
  const row = await loadContent(c, id);
  if (!row) return fail(c, 404, 'content_not_found', '内容不存在');

  const user = c.get('user')!;
  if (user.role === 'ops' && row.type !== 'news') {
    return fail(c, 403, 'forbidden', '运营角色只能删除资讯');
  }

  await deleteContentRows(c, [id]);
  if (row.status === 'published') await bumpEpoch(c.env);

  await writeAudit(c, {
    action: 'content.delete',
    targetType: 'content',
    targetId: id,
    summary: row.title,
  });

  return c.json({ ok: true });
});

contentRoutes.patch('/:id', requireRole(...WRITERS), async (c) => {
  const id = c.req.param('id') ?? '';
  const existing = await loadContent(c, id);
  if (!existing) return fail(c, 404, 'content_not_found', '内容不存在');

  const user = c.get('user')!;
  if (user.role === 'ops' && existing.type !== 'news') {
    return fail(c, 403, 'forbidden', '运营角色只能编辑资讯');
  }

  const body = await readJson<Record<string, unknown>>(c);
  if (!body) return fail(c, 400, 'invalid_request', '请求体必须是 JSON');

  const result = await updateContent(c, existing, body);
  if ('error' in result) {
    return fail(c, result.error.status, result.error.code, result.error.message);
  }

  await writeAudit(c, {
    action: 'content.update',
    targetType: 'content',
    targetId: id,
    summary: result.row?.title ?? existing.title,
    diff: result.diff,
  });

  // 已发布内容的编辑会改变前台详情与列表，立即切换公开缓存键
  if (existing.status === 'published') await bumpEpoch(c.env);

  return c.json({
    item: result.row ? { ...mapAdminContent(result.row), tags: result.tags } : null,
  });
});

contentRoutes.post('/:id/submit', requireRole(...WRITERS), async (c) => {
  const id = c.req.param('id') ?? '';
  const row = await loadContent(c, id);
  if (!row) return fail(c, 404, 'content_not_found', '内容不存在');

  const error = await submitContent(c, row);
  if (error) return fail(c, error.status, error.code, error.message);

  await writeAudit(c, {
    action: 'content.submit',
    targetType: 'content',
    targetId: id,
    summary: row.title,
  });

  return c.json({ ok: true, status: 'pending' });
});

contentRoutes.post('/:id/publish', requireRole(...REVIEWERS), async (c) => {
  const id = c.req.param('id') ?? '';
  const row = await loadContent(c, id);
  if (!row) return fail(c, 404, 'content_not_found', '内容不存在');

  const result = await publishContent(c, row);
  if ('error' in result) {
    return fail(c, result.error.status, result.error.code, result.error.message);
  }

  await bumpEpoch(c.env);
  await writeAudit(c, {
    action: 'content.publish',
    targetType: 'content',
    targetId: id,
    summary: row.title,
  });

  return c.json({ ok: true, status: 'published', published_at: result.publishedAt });
});

contentRoutes.post('/:id/unpublish', requireRole(...REVIEWERS), async (c) => {
  const id = c.req.param('id') ?? '';
  const row = await loadContent(c, id);
  if (!row) return fail(c, 404, 'content_not_found', '内容不存在');

  const error = await unpublishContent(c, row);
  if (error) return fail(c, error.status, error.code, error.message);

  await bumpEpoch(c.env);
  await writeAudit(c, {
    action: 'content.unpublish',
    targetType: 'content',
    targetId: id,
    summary: row.title,
  });

  return c.json({ ok: true, status: 'draft' });
});

contentRoutes.post('/:id/archive', requireRole(...REVIEWERS), async (c) => {
  const id = c.req.param('id') ?? '';
  const row = await loadContent(c, id);
  if (!row) return fail(c, 404, 'content_not_found', '内容不存在');

  const error = await archiveContent(c, row);
  if (error) return fail(c, error.status, error.code, error.message);

  await bumpEpoch(c.env);
  await writeAudit(c, {
    action: 'content.archive',
    targetType: 'content',
    targetId: id,
    summary: row.title,
  });

  return c.json({ ok: true, status: 'archived' });
});

contentRoutes.post('/:id/reject', requireRole(...REVIEWERS), async (c) => {
  const id = c.req.param('id') ?? '';
  const row = await loadContent(c, id);
  if (!row) return fail(c, 404, 'content_not_found', '内容不存在');

  const body = await readJson<Record<string, unknown>>(c);
  const note = asString(body?.note).trim();

  const error = await rejectContent(c, row, note);
  if (error) return fail(c, error.status, error.code, error.message);

  await writeAudit(c, {
    action: 'content.reject',
    targetType: 'content',
    targetId: id,
    summary: row.title,
    diff: note ? { note } : undefined,
  });

  return c.json({ ok: true, status: 'draft' });
});

contentRoutes.get('/:id/revisions', async (c) => {
  return c.json({ items: await listContentRevisions(c, c.req.param('id') ?? '') });
});

contentRoutes.post('/:id/revisions/:revisionId/restore', requireRole(...WRITERS), async (c) => {
  const id = c.req.param('id') ?? '';
  const existing = await loadContent(c, id);
  if (!existing) return fail(c, 404, 'content_not_found', '内容不存在');

  const user = c.get('user')!;
  if (user.role === 'ops' && existing.type !== 'news') {
    return fail(c, 403, 'forbidden', '运营角色只能编辑资讯');
  }

  const revisionId = Number(c.req.param('revisionId'));
  if (!Number.isInteger(revisionId) || revisionId <= 0) {
    return fail(c, 400, 'invalid_revision', '修订版本不合法');
  }

  const body = (await readJson<Record<string, unknown>>(c)) ?? {};
  const expected = asString(body.expected_updated_at);

  const result = await restoreContentRevision(c, existing, revisionId, expected);
  if ('error' in result) {
    return fail(c, result.error.status, result.error.code, result.error.message);
  }

  await writeAudit(c, {
    action: 'content.restore',
    targetType: 'content',
    targetId: id,
    summary: `${result.row?.title ?? existing.title}（第 ${result.revisionNo} 版）`,
    diff: { revision_no: result.revisionNo, title: result.revisionTitle },
  });

  return c.json({
    item: result.row ? { ...mapAdminContent(result.row), tags: result.tags } : null,
    revision_no: result.revisionNo,
  });
});
