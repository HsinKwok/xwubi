import type { Context } from 'hono';
import type { AppEnv } from '../../lib/env';
import {
  invalidateCategorySlugCache,
  normalizeRoute,
  splitKeys,
  type CategoryDomain,
  type CategoryRow,
} from '../../lib/categories';
import { asString } from '../../lib/http';
import { nowIso } from '../../lib/ids';
import { bumpEpoch, invalidateSiteSettings } from '../../lib/settings';
import { invalidateSiteTaxonomy } from '../../lib/site-taxonomy';

/** 码表版本允许数字开头（86 / 98 / xsj），其余分类沿用字母开头 */
export const SLUG_PATTERNS: Record<CategoryDomain, RegExp> = {
  content_type: /^[a-z][a-z0-9_]{0,31}$/,
  lesson_stage: /^[a-z][a-z0-9_]{0,31}$/,
  practice_genre: /^[a-z][a-z0-9_]{0,31}$/,
  keymap_zone: /^[a-z][a-z0-9_]{0,31}$/,
  keymap_version: /^[a-z0-9][a-z0-9_-]{0,31}$/,
};

export const KEY_PATTERN = /^[A-Z]$/;
export const LABEL_MAX = 20;
export const HINT_MAX = 40;
export const KEYS_MAX = 12;

/** 站点固定页面占用的单段路径，内容类型不能复用 */
const RESERVED_ROUTES = new Set([
  '/about',
  '/login',
  '/submit',
  '/feedback',
  '/profile',
  '/practice',
  '/admin',
  '/api',
]);

/** 各分类被占用时的提示文案 */
const DOMAIN_NOUNS: Record<CategoryDomain, string> = {
  content_type: '内容',
  lesson_stage: '课时',
  practice_genre: '篇目',
  keymap_zone: '字根',
  keymap_version: '记录',
};

export function slugError(domain: CategoryDomain): string {
  return domain === 'keymap_version'
    ? '版本标识需以字母或数字开头，仅含小写字母、数字、下划线或连字符'
    : '标识需以小写字母开头，仅含小写字母、数字或下划线';
}

export function domainNoun(domain: CategoryDomain): string {
  return DOMAIN_NOUNS[domain];
}

/** 把默认版本从 fromSlug 切到 toSlug；仅在当前默认值就是 fromSlug 时生效 */
export function defaultVersionStatement(
  c: Context<AppEnv>,
  toSlug: string,
  fromSlug?: string,
) {
  const sql = fromSlug
    ? `UPDATE settings SET value = json_set(value, '$.defaultVersion', ?), updated_at = ?
       WHERE key = 'site_config' AND json_extract(value, '$.defaultVersion') = ?`
    : `UPDATE settings SET value = json_set(value, '$.defaultVersion', ?), updated_at = ?
       WHERE key = 'site_config'`;
  const statement = c.env.DB.prepare(sql);
  return fromSlug
    ? statement.bind(toSlug, nowIso(), fromSlug)
    : statement.bind(toSlug, nowIso());
}

/** 分类变更后统一失效实例缓存与边缘缓存键 */
export async function invalidateCategoryCaches(c: Context<AppEnv>): Promise<void> {
  invalidateSiteSettings();
  invalidateSiteTaxonomy();
  invalidateCategorySlugCache();
  await bumpEpoch(c.env);
}

/** 规范化键位：仅码表分区使用，单字母、去重、保持录入顺序 */
export function normalizeKeys(
  domain: CategoryDomain,
  raw: string,
): string | { error: string } {
  if (domain !== 'keymap_zone') return '';

  const keys = [...new Set(splitKeys(raw))];
  if (keys.length === 0) return { error: '码表分区至少需要一个键位' };
  if (keys.length > KEYS_MAX) return { error: `每个分区最多 ${KEYS_MAX} 个键位` };
  if (keys.some((key) => !KEY_PATTERN.test(key))) {
    return { error: '键位只能是单个大写字母，用逗号分隔' };
  }
  return keys.join(',');
}

export async function findDuplicate(
  c: Context<AppEnv>,
  domain: string,
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  const row = await c.env.DB.prepare(
    'SELECT id FROM categories WHERE domain = ? AND slug = ? AND id <> ? LIMIT 1',
  )
    .bind(domain, slug, excludeId ?? '')
    .first<{ id: string }>();
  return Boolean(row);
}

/** 内容类型的路径前缀不能与其他类型重复，否则前台路由会冲突 */
export async function findDuplicateRoute(
  c: Context<AppEnv>,
  route: string,
  excludeId?: string,
): Promise<boolean> {
  const row = await c.env.DB.prepare(
    "SELECT id FROM categories WHERE domain = 'content_type' AND route = ? AND id <> ? LIMIT 1",
  )
    .bind(route, excludeId ?? '')
    .first<{ id: string }>();
  return Boolean(row);
}

export function readRoute(
  domain: CategoryDomain,
  value: unknown,
): string | { error: string } {
  if (domain !== 'content_type') return '';
  const route = normalizeRoute(asString(value));
  if (!route) return { error: '前台路径需形如 /learn，只含小写字母、数字或连字符' };
  if (RESERVED_ROUTES.has(route)) return { error: '该路径已被站点固定页面占用' };
  return route;
}

/** 分类标识被其他表引用时，改名后同步更新，避免出现孤儿数据 */
export async function syncCategoryReferences(
  c: Context<AppEnv>,
  existing: CategoryRow,
  nextSlug: string,
): Promise<void> {
  if (existing.domain === 'content_type') {
    await c.env.DB.prepare('UPDATE content SET type = ? WHERE type = ?')
      .bind(nextSlug, existing.slug)
      .run();
    return;
  }

  if (existing.domain === 'lesson_stage') {
    await c.env.DB.prepare("UPDATE content SET stage = ? WHERE type = 'lesson' AND stage = ?")
      .bind(nextSlug, existing.slug)
      .run();
    return;
  }

  if (existing.domain === 'practice_genre') {
    await c.env.DB.prepare('UPDATE practice_texts SET genre = ? WHERE genre = ?')
      .bind(nextSlug, existing.slug)
      .run();
    return;
  }

  if (existing.domain === 'keymap_version') {
    await c.env.DB.batch([
      c.env.DB.prepare('UPDATE content SET version = ? WHERE version = ?').bind(
        nextSlug,
        existing.slug,
      ),
      c.env.DB.prepare('UPDATE wubi_roots SET version = ? WHERE version = ?').bind(
        nextSlug,
        existing.slug,
      ),
      c.env.DB.prepare('UPDATE wubi_examples SET version = ? WHERE version = ?').bind(
        nextSlug,
        existing.slug,
      ),
      c.env.DB.prepare('UPDATE media SET version = ? WHERE version = ?').bind(
        nextSlug,
        existing.slug,
      ),
      c.env.DB.prepare('UPDATE submissions SET version = ? WHERE version = ?').bind(
        nextSlug,
        existing.slug,
      ),
      c.env.DB.prepare('UPDATE feedback SET version = ? WHERE version = ?').bind(
        nextSlug,
        existing.slug,
      ),
      defaultVersionStatement(c, nextSlug, existing.slug),
    ]);
  }
}
