import type {
  CollectionFilter,
  CollectionFilterOption,
  CollectionMeta,
  ContentTypeOption,
  SiteCategory,
  SiteConfig,
} from '../../shared/site-config';
import type { CategoryRow } from './categories';
import { toContentTypeOption, toSiteCategory } from './categories';
import type { Env } from './env';

/** 站点分类在实例内的复用时长，与站点配置缓存保持一致 */
const TAXONOMY_TTL_MS = 30_000;

interface TagUsageRow {
  id: string;
  name: string;
  type: string;
}

export interface SiteTaxonomy {
  /** 内容类型 */
  types: ContentTypeOption[];
  /** 教学阶段 */
  stages: SiteCategory[];
  /** 实际有阶段内容的类型标识 */
  stageTypes: Set<string>;
  /** 各内容类型实际用到的标签 */
  tagsByType: Map<string, CollectionFilterOption[]>;
}

interface TaxonomySnapshot {
  taxonomy: SiteTaxonomy;
  at: number;
}

let snapshot: TaxonomySnapshot | null = null;

/**
 * 一次 D1 batch 取齐前台分类数据：
 *   1. 内容类型 + 教学阶段（同一张 categories 表）
 *   2. 实际带阶段的内容类型
 *   3. 各内容类型在已发布内容中用到的标签
 * 结果在实例内复用 30 秒，避免每个列表/详情请求都重算。
 */
export async function loadSiteTaxonomy(env: Env): Promise<SiteTaxonomy> {
  if (snapshot && Date.now() - snapshot.at < TAXONOMY_TTL_MS) return snapshot.taxonomy;

  const [categoryResult, stageTypeResult, tagResult] = await env.DB.batch<Record<string, unknown>>([
    env.DB.prepare(
      `SELECT * FROM categories
       WHERE domain IN ('content_type', 'lesson_stage')
       ORDER BY domain, sort_order, label`,
    ),
    env.DB.prepare(
      "SELECT DISTINCT type FROM content WHERE status = 'published' AND stage IS NOT NULL AND stage <> ''",
    ),
    env.DB.prepare(
      `SELECT t.id, t.name, c.type
       FROM tags t
       JOIN content_tags ct ON ct.tag_id = t.id
       JOIN content c ON c.id = ct.content_id
       WHERE c.status = 'published'
       GROUP BY t.id, c.type
       ORDER BY t.name`,
    ),
  ]);

  const categoryRows = (categoryResult.results ?? []) as unknown as CategoryRow[];
  const types = categoryRows
    .filter((row) => row.domain === 'content_type')
    .map(toContentTypeOption);
  const stages = categoryRows
    .filter((row) => row.domain === 'lesson_stage')
    .map(toSiteCategory);

  const stageTypes = new Set(
    ((stageTypeResult.results ?? []) as unknown as Array<{ type: string }>).map((row) => row.type),
  );

  const tagsByType = new Map<string, CollectionFilterOption[]>();
  for (const row of (tagResult.results ?? []) as unknown as TagUsageRow[]) {
    const list = tagsByType.get(row.type) ?? [];
    list.push({ value: row.id, label: row.name });
    tagsByType.set(row.type, list);
  }

  const taxonomy: SiteTaxonomy = { types, stages, stageTypes, tagsByType };
  snapshot = { taxonomy, at: Date.now() };
  return taxonomy;
}

/** 分类或标签变更后清空实例缓存，让下一次请求重新读取 */
export function invalidateSiteTaxonomy(): void {
  snapshot = null;
}

/**
 * 把分类数据拼装为前台合集配置。
 * 文案与空状态仍来自 site_config，筛选选项由数据库驱动。
 */
export function buildCollections(
  config: SiteConfig,
  taxonomy: SiteTaxonomy,
): Record<string, CollectionMeta> {
  const labels = config.labels ?? {};
  const allOption = labels.allOption ?? '全部';
  const stageLabel = labels.stageFilter ?? '阶段';
  const tagLabel = labels.tagFilter ?? '标签';

  const collections: Record<string, CollectionMeta> = { ...(config.collections ?? {}) };

  for (const type of taxonomy.types) {
    const base = collections[type.slug] ?? { title: type.label };
    const filters: CollectionFilter[] = [];

    if (taxonomy.stageTypes.has(type.slug) && taxonomy.stages.length > 0) {
      filters.push({
        key: 'stage',
        label: stageLabel,
        options: [
          { value: '', label: allOption },
          ...taxonomy.stages.map((stage) => ({ value: stage.slug, label: stage.label })),
        ],
      });
    }

    const usedTags = taxonomy.tagsByType.get(type.slug) ?? [];
    if (usedTags.length > 0) {
      filters.push({
        key: 'tag',
        label: tagLabel,
        options: [{ value: '', label: allOption }, ...usedTags],
      });
    }

    collections[type.slug] = {
      ...base,
      title: base.title || type.label,
      filters,
    };
  }

  return collections;
}
