import type {
  CollectionSection,
  FeedSection,
  RailSection,
  SiteSection,
} from '../../../shared/site-config';
import type { Env } from '../../lib/env';
import type { ContentListRow, LatestQuery } from '../../lib/content';
import { buildLatestStatement, buildListStatement, mapContentRows } from '../../lib/content';

/** 混排流的默认内容类型，配置未指定 sources 时使用 */
const DEFAULT_FEED_TYPES = ['lesson', 'news', 'software', 'tool'];

/**
 * 只为首页的合集、混排流与右栏区块补齐条目，其他区块原样返回。
 * 所有查询合并到一次 D1 batch，首屏只等待一个往返。
 */
export async function resolveSections(
  env: Env,
  sections: SiteSection[],
  version: string,
): Promise<SiteSection[]> {
  const collections = sections.filter(
    (section): section is CollectionSection => section.kind === 'collection',
  );
  const feed = sections.find((section): section is FeedSection => section.kind === 'feed');
  const rail = sections.find((section): section is RailSection => section.kind === 'rail');
  const recentSource = rail?.recent;

  if (collections.length === 0 && !feed && !recentSource) return sections;

  const feedQuery: LatestQuery | null = feed
    ? {
        types: feed.sources?.map((source) => source.type) ?? DEFAULT_FEED_TYPES,
        version,
        limit: feed.limit ?? 8,
      }
    : null;
  const recentQuery: LatestQuery | null = recentSource
    ? {
        types: [recentSource.source ?? 'software'],
        version,
        limit: recentSource.limit ?? 3,
      }
    : null;

  const statements = collections.map((collection) =>
    buildListStatement(env, {
      type: collection.source,
      version,
      limit: collection.limit ?? 3,
    }),
  );
  const feedIndex = feedQuery ? statements.push(buildLatestStatement(env, feedQuery)) - 1 : -1;
  const recentIndex = recentQuery
    ? statements.push(buildLatestStatement(env, recentQuery)) - 1
    : -1;

  const results = await env.DB.batch<ContentListRow>(statements);

  let index = 0;
  return sections.map((section) => {
    if (section.kind === 'collection') {
      return { ...section, items: mapContentRows(results[index++]?.results as ContentListRow[] | undefined) };
    }
    if (section.kind === 'feed') {
      return {
        ...section,
        items: mapContentRows(results[feedIndex]?.results as ContentListRow[] | undefined),
      };
    }
    if (section.kind === 'rail' && section.recent) {
      return {
        ...section,
        recent: {
          ...section.recent,
          items: mapContentRows(results[recentIndex]?.results as ContentListRow[] | undefined),
        },
      };
    }
    return section;
  });
}
