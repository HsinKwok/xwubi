// 分类写操作：新增、修改与删除分类，含引用同步与缓存失效
import { Hono } from 'hono';
import type { AppEnv } from '../../lib/env';
import { writeAudit } from '../../lib/audit';
import {
  countCategoryUsage,
  isCategoryDomain,
  type CategoryRow,
} from '../../lib/categories';
import { asString, clampInt, fail, readJson } from '../../lib/http';
import { newId, nowIso } from '../../lib/ids';
import { requireRole } from '../../lib/session';
import {
  HINT_MAX,
  LABEL_MAX,
  SLUG_PATTERNS,
  defaultVersionStatement,
  domainNoun,
  findDuplicate,
  findDuplicateRoute,
  invalidateCategoryCaches,
  normalizeKeys,
  readRoute,
  slugError,
  syncCategoryReferences,
} from './category-helpers';

export const categoriesWriteRoutes = new Hono<AppEnv>();

const requireAdmin = requireRole('admin');

interface CountRow {
  total: number;
}

categoriesWriteRoutes.post('/', requireAdmin, async (c) => {
  const body = await readJson<Record<string, unknown>>(c);
  if (!body) return fail(c, 400, 'invalid_request', '请求体必须是 JSON');

  const domain = asString(body.domain).trim();
  const slug = asString(body.slug).trim();
  const label = asString(body.label).trim();
  const hint = asString(body.hint).trim();
  const sortOrder = clampInt(body.sort_order, -99_999, 99_999, 0);

  if (!isCategoryDomain(domain)) return fail(c, 400, 'invalid_domain', '分类类型不合法');
  if (!SLUG_PATTERNS[domain].test(slug)) {
    return fail(c, 400, 'invalid_slug', slugError(domain));
  }
  if (!label || label.length > LABEL_MAX) {
    return fail(c, 400, 'invalid_label', `名称需要 1-${LABEL_MAX} 个字符`);
  }
  if (hint.length > HINT_MAX) {
    return fail(c, 400, 'invalid_hint', `提示最多 ${HINT_MAX} 个字符`);
  }

  const keys = normalizeKeys(domain, asString(body.key_list));
  if (typeof keys !== 'string') return fail(c, 400, 'invalid_keys', keys.error);

  const route = readRoute(domain, body.route);
  if (typeof route !== 'string') return fail(c, 400, 'invalid_route', route.error);

  if (await findDuplicate(c, domain, slug)) {
    return fail(c, 409, 'category_exists', '同一类型下已存在相同标识');
  }
  if (domain === 'content_type' && (await findDuplicateRoute(c, route))) {
    return fail(c, 409, 'route_exists', '该前台路径已被其他内容类型占用');
  }

  const id = newId('cat');
  const now = nowIso();

  await c.env.DB.prepare(
    `INSERT INTO categories
       (id, domain, slug, label, hint, key_list, sort_order, route, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, domain, slug, label, hint, keys, sortOrder, route, now, now)
    .run();

  await writeAudit(c, {
    action: 'category.create',
    targetType: 'category',
    targetId: id,
    summary: `${domain}:${slug}`,
    diff: { label, hint, key_list: keys, route, sort_order: sortOrder },
  });

  await invalidateCategoryCaches(c);

  const item: CategoryRow = {
    id,
    domain,
    slug,
    label,
    hint,
    key_list: keys,
    sort_order: sortOrder,
    route,
    created_at: now,
    updated_at: now,
  };

  return c.json({ item: { ...item, count: 0 } }, 201);
});

categoriesWriteRoutes.patch('/:id', requireAdmin, async (c) => {
  const id = c.req.param('id') ?? '';
  const existing = await c.env.DB.prepare('SELECT * FROM categories WHERE id = ? LIMIT 1')
    .bind(id)
    .first<CategoryRow>();
  if (!existing) return fail(c, 404, 'category_not_found', '分类不存在');

  const body = await readJson<Record<string, unknown>>(c);
  if (!body) return fail(c, 400, 'invalid_request', '请求体必须是 JSON');

  if (body.domain !== undefined && asString(body.domain).trim() !== existing.domain) {
    return fail(c, 400, 'immutable_domain', '分类类型不可修改');
  }

  const fields: string[] = [];
  const params: unknown[] = [];
  const diff: Record<string, unknown> = {};
  let nextSlug: string | null = null;

  if (body.slug !== undefined) {
    const slug = asString(body.slug).trim();
    if (!SLUG_PATTERNS[existing.domain].test(slug)) {
      return fail(c, 400, 'invalid_slug', slugError(existing.domain));
    }
    if (slug !== existing.slug) {
      if (await findDuplicate(c, existing.domain, slug, id)) {
        return fail(c, 409, 'category_exists', '同一类型下已存在相同标识');
      }
      fields.push('slug = ?');
      params.push(slug);
      diff.slug = slug;
      nextSlug = slug;
    }
  }

  if (body.label !== undefined) {
    const label = asString(body.label).trim();
    if (!label || label.length > LABEL_MAX) {
      return fail(c, 400, 'invalid_label', `名称需要 1-${LABEL_MAX} 个字符`);
    }
    if (label !== existing.label) {
      fields.push('label = ?');
      params.push(label);
      diff.label = label;
    }
  }

  if (body.hint !== undefined) {
    const hint = asString(body.hint).trim();
    if (hint.length > HINT_MAX) {
      return fail(c, 400, 'invalid_hint', `提示最多 ${HINT_MAX} 个字符`);
    }
    if (hint !== existing.hint) {
      fields.push('hint = ?');
      params.push(hint);
      diff.hint = hint;
    }
  }

  if (body.key_list !== undefined) {
    const keys = normalizeKeys(existing.domain, asString(body.key_list));
    if (typeof keys !== 'string') return fail(c, 400, 'invalid_keys', keys.error);
    if (keys !== existing.key_list) {
      fields.push('key_list = ?');
      params.push(keys);
      diff.key_list = keys;
    }
  }

  if (body.route !== undefined && existing.domain === 'content_type') {
    const route = readRoute(existing.domain, body.route);
    if (typeof route !== 'string') return fail(c, 400, 'invalid_route', route.error);
    if (route !== existing.route) {
      if (await findDuplicateRoute(c, route, id)) {
        return fail(c, 409, 'route_exists', '该前台路径已被其他内容类型占用');
      }
      fields.push('route = ?');
      params.push(route);
      diff.route = route;
    }
  }

  if (body.sort_order !== undefined) {
    const sortOrder = clampInt(body.sort_order, -99_999, 99_999, existing.sort_order);
    if (sortOrder !== existing.sort_order) {
      fields.push('sort_order = ?');
      params.push(sortOrder);
      diff.sort_order = sortOrder;
    }
  }

  if (fields.length === 0) return fail(c, 400, 'empty_update', '没有可更新的字段');

  fields.push('updated_at = ?');
  params.push(nowIso());

  await c.env.DB.prepare(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...params, id)
    .run();

  // 标识被其他表引用时同步改名，避免内容、码表或篇目变成孤儿
  if (nextSlug) await syncCategoryReferences(c, existing, nextSlug);

  await writeAudit(c, {
    action: 'category.update',
    targetType: 'category',
    targetId: id,
    summary: `${existing.domain}:${nextSlug ?? existing.slug}`,
    diff,
  });

  await invalidateCategoryCaches(c);

  const row = await c.env.DB.prepare('SELECT * FROM categories WHERE id = ? LIMIT 1')
    .bind(id)
    .first<CategoryRow>();

  if (!row) return c.json({ item: existing });

  const count = await countCategoryUsage(c.env, row.domain, row.slug);
  return c.json({ item: { ...row, count } });
});

categoriesWriteRoutes.delete('/:id', requireAdmin, async (c) => {
  const id = c.req.param('id') ?? '';
  const existing = await c.env.DB.prepare('SELECT * FROM categories WHERE id = ? LIMIT 1')
    .bind(id)
    .first<CategoryRow>();
  if (!existing) return fail(c, 404, 'category_not_found', '分类不存在');

  if (existing.domain === 'keymap_version') {
    const totals = await c.env.DB.prepare(
      "SELECT COUNT(*) AS total FROM categories WHERE domain = 'keymap_version'",
    ).first<CountRow>();
    if ((totals?.total ?? 0) <= 1) {
      return fail(c, 409, 'last_version', '至少需要保留一个码表版本');
    }
  }

  const total = await countCategoryUsage(c.env, existing.domain, existing.slug);
  if (total > 0) {
    return fail(
      c,
      409,
      'category_in_use',
      `还有 ${total} 条${domainNoun(existing.domain)}使用该分类，请先调整后再删除`,
    );
  }

  if (existing.domain === 'keymap_version') {
    const next = await c.env.DB.prepare(
      "SELECT slug FROM categories WHERE domain = 'keymap_version' AND id <> ? ORDER BY sort_order, label LIMIT 1",
    )
      .bind(id)
      .first<{ slug: string }>();
    if (next) await defaultVersionStatement(c, next.slug, existing.slug).run();
  }

  await c.env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();

  await invalidateCategoryCaches(c);

  await writeAudit(c, {
    action: 'category.delete',
    targetType: 'category',
    targetId: id,
    summary: `${existing.domain}:${existing.slug}`,
    diff: { label: existing.label },
  });

  return c.json({ ok: true });
});
