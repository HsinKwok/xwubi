import type { ContentTypeOption, SiteCategory, VersionOption } from '../../shared/site-config';
import type { Env } from './env';

export type CategoryDomain =
  | 'content_type'
  | 'lesson_stage'
  | 'practice_genre'
  | 'keymap_zone'
  | 'keymap_version';

export const CATEGORY_DOMAINS: CategoryDomain[] = [
  'content_type',
  'lesson_stage',
  'practice_genre',
  'keymap_zone',
  'keymap_version',
];

export interface CategoryRow {
  id: string;
  domain: CategoryDomain;
  slug: string;
  label: string;
  hint: string;
  key_list: string;
  sort_order: number;
  /** 仅 content_type 使用：前台路径前缀，如 /learn */
  route: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryWithUsage extends CategoryRow {
  count: number;
}

export function isCategoryDomain(value: unknown): value is CategoryDomain {
  return typeof value === 'string' && (CATEGORY_DOMAINS as string[]).includes(value);
}

/** 规范前台路径前缀：/learn、/news 这类单段小写路径 */
export function normalizeRoute(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const route = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return /^\/[a-z0-9][a-z0-9-]{0,31}$/.test(route) ? route : null;
}

/** 键位列表按中英文逗号、顿号或空白拆分并统一大写 */
export function splitKeys(value: string): string[] {
  return value
    .split(/[,，、\s]+/)
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
}

export function toSiteCategory(row: CategoryRow): SiteCategory {
  return {
    slug: row.slug,
    label: row.label,
    hint: row.hint,
    keys: row.domain === 'keymap_zone' ? splitKeys(row.key_list) : [],
    sort_order: row.sort_order,
  };
}

export function toContentTypeOption(row: CategoryRow): ContentTypeOption {
  return {
    slug: row.slug,
    label: row.label,
    route: row.route,
    sort_order: row.sort_order,
  };
}

export async function listCategories(
  env: Env,
  domain?: CategoryDomain,
): Promise<CategoryRow[]> {
  const statement = domain
    ? env.DB.prepare(
        'SELECT * FROM categories WHERE domain = ? ORDER BY sort_order, label',
      ).bind(domain)
    : env.DB.prepare('SELECT * FROM categories ORDER BY domain, sort_order, label');

  const result = await statement.all<CategoryRow>();
  return result.results ?? [];
}

export async function listSiteCategories(
  env: Env,
  domain: CategoryDomain,
): Promise<SiteCategory[]> {
  return (await listCategories(env, domain)).map(toSiteCategory);
}

export async function listContentTypes(env: Env): Promise<ContentTypeOption[]> {
  return (await listCategories(env, 'content_type')).map(toContentTypeOption);
}

export async function listLessonStages(env: Env): Promise<SiteCategory[]> {
  return listSiteCategories(env, 'lesson_stage');
}

export async function listPracticeGenreSlugs(env: Env): Promise<string[]> {
  const rows = await listCategories(env, 'practice_genre');
  return rows.map((row) => row.slug);
}

/** 码表版本清单：分类表即唯一数据源，顺序按 sort_order */
export async function listSiteVersions(env: Env): Promise<VersionOption[]> {
  const rows = await listCategories(env, 'keymap_version');
  return rows.map((row) => ({
    value: row.slug,
    label: row.label,
    note: row.hint || undefined,
  }));
}

export async function listVersionSlugs(env: Env): Promise<string[]> {
  const rows = await listCategories(env, 'keymap_version');
  return rows.map((row) => row.slug);
}

interface CountRow {
  slug: string;
  total: number;
}

const SLUG_CACHE_TTL_MS = 30_000;
const slugCache = new Map<CategoryDomain, { values: Set<string>; at: number }>();

/** 分类标识集合：内容类型/阶段校验使用，避免每次请求都查 D1 */
export async function loadCategorySlugSet(
  env: Env,
  domain: CategoryDomain,
): Promise<Set<string>> {
  const cached = slugCache.get(domain);
  if (cached && Date.now() - cached.at < SLUG_CACHE_TTL_MS) return cached.values;

  const result = await env.DB.prepare('SELECT slug FROM categories WHERE domain = ?')
    .bind(domain)
    .all<{ slug: string }>();
  const values = new Set((result.results ?? []).map((row) => row.slug));
  slugCache.set(domain, { values, at: Date.now() });
  return values;
}

export function invalidateCategorySlugCache(): void {
  slugCache.clear();
}

type PreparedStatement = ReturnType<Env['DB']['prepare']>;

interface UsageQuery {
  domain: CategoryDomain;
  kind: 'flat' | 'version' | 'zone';
  statement: PreparedStatement;
}

interface UsageMaps {
  maps: Map<CategoryDomain, Map<string, number>>;
  /** keymap_zone 需要字根键位在 JS 中计算 */
  rootKeys: string[];
}

const USAGE_SQL: Record<'content_type' | 'lesson_stage' | 'practice_genre', string> = {
  content_type: 'SELECT type AS slug, COUNT(*) AS total FROM content GROUP BY type',
  lesson_stage:
    "SELECT stage AS slug, COUNT(*) AS total FROM content WHERE type = 'lesson' AND stage IS NOT NULL GROUP BY stage",
  practice_genre: 'SELECT genre AS slug, COUNT(*) AS total FROM practice_texts GROUP BY genre',
};

/** 按 domain 聚合引用数：所有统计合并为一次 D1 batch */
async function loadUsageMaps(env: Env, domains: CategoryDomain[]): Promise<UsageMaps> {
  const wanted = new Set(domains);
  const maps = new Map<CategoryDomain, Map<string, number>>();
  for (const domain of domains) maps.set(domain, new Map());

  const queries: UsageQuery[] = [];
  const flatDomains: Array<keyof typeof USAGE_SQL> = [
    'content_type',
    'lesson_stage',
    'practice_genre',
  ];

  for (const domain of flatDomains) {
    if (!wanted.has(domain)) continue;
    queries.push({ domain, kind: 'flat', statement: env.DB.prepare(USAGE_SQL[domain]) });
  }

  if (wanted.has('keymap_zone')) {
    queries.push({
      domain: 'keymap_zone',
      kind: 'zone',
      statement: env.DB.prepare('SELECT key FROM wubi_roots'),
    });
  }

  // 码表版本被多张表引用；同一次 batch 查询后在 JS 求和，避免复合查询条数限制
  if (wanted.has('keymap_version')) {
    const tables = ['content', 'wubi_roots', 'wubi_examples', 'media', 'submissions', 'feedback'];
    for (const table of tables) {
      queries.push({
        domain: 'keymap_version',
        kind: 'version',
        statement: env.DB.prepare(
          `SELECT version AS slug, COUNT(*) AS total FROM ${table} WHERE version IS NOT NULL GROUP BY version`,
        ),
      });
    }
  }

  let rootKeys: string[] = [];
  if (queries.length > 0) {
    const results = await env.DB.batch<Record<string, unknown>>(
      queries.map((query) => query.statement),
    );

    results.forEach((result, index) => {
      const query = queries[index];
      if (!query) return;

      if (query.kind === 'zone') {
        rootKeys = ((result.results ?? []) as unknown as Array<{ key: string }>).map(
          (row) => row.key,
        );
        return;
      }

      const map = maps.get(query.domain);
      if (!map) return;

      for (const row of (result.results ?? []) as unknown as CountRow[]) {
        const slug = String(row.slug ?? '');
        if (!slug) continue;
        map.set(slug, (map.get(slug) ?? 0) + (Number(row.total) || 0));
      }
    });
  }

  return { maps, rootKeys };
}

/** 分类列表带引用数：管理台据此展示并阻止删除在用项 */
export async function listCategoriesWithUsage(
  env: Env,
  domain?: CategoryDomain,
): Promise<CategoryWithUsage[]> {
  const rows = await listCategories(env, domain);
  const domains = domain ? [domain] : CATEGORY_DOMAINS;
  const { maps, rootKeys } = await loadUsageMaps(env, domains);
  const upperKeys = rootKeys.map((key) => key.toUpperCase());

  return rows.map((row) => {
    let count = maps.get(row.domain)?.get(row.slug) ?? 0;
    if (row.domain === 'keymap_zone') {
      const zoneKeys = new Set(splitKeys(row.key_list));
      count = upperKeys.filter((key) => zoneKeys.has(key)).length;
    }
    return { ...row, count };
  });
}

/** 单个分类的引用数，供删除前校验 */
export async function countCategoryUsage(
  env: Env,
  domain: CategoryDomain,
  slug: string,
): Promise<number> {
  const rows = await listCategoriesWithUsage(env, domain);
  return rows.find((row) => row.slug === slug)?.count ?? 0;
}
