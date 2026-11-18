import type { SiteConfig, SiteSection } from '../../../shared/site-config';

export type SettingsUpdater = (mutator: (draft: SiteConfig) => void) => void;

export interface SettingsSectionProps {
  config: SiteConfig;
  disabled: boolean;
  update: SettingsUpdater;
}

/** 列表上移/下移；由调用方在配置副本上执行 */
export function moveItem<T>(list: T[], index: number, delta: number): void {
  const next = index + delta;
  if (next < 0 || next >= list.length) return;
  const [item] = list.splice(index, 1);
  list.splice(next, 0, item);
}

export const SECTION_KIND_LABELS: Record<SiteSection['kind'], string> = {
  hero: '首屏',
  stats: '数据统计',
  'feature-grid': '特性网格',
  collection: '内容列表',
  feed: '混排流',
  rail: '侧栏',
  steps: '步骤说明',
  quote: '引用',
  cta: '行动号召',
};

export const SECTION_KINDS = Object.keys(SECTION_KIND_LABELS) as Array<SiteSection['kind']>;

export function createSection(
  kind: SiteSection['kind'],
  collectionKeys: string[],
): SiteSection {
  switch (kind) {
    case 'hero':
      return { kind, title: '新的首屏标题', lead: '一句话说明站点价值。' };
    case 'stats':
      return { kind, items: [{ label: '统计项', value: '0' }] };
    case 'feature-grid':
      return {
        kind,
        title: '新的特性区块',
        items: [{ title: '特性一', description: '补充说明。' }],
      };
    case 'collection':
      return {
        kind,
        source: collectionKeys[0] ?? 'lesson',
        title: '新的内容列表',
        limit: 4,
      };
    case 'feed':
      return { kind, title: '最新收录', limit: 8 };
    case 'rail':
      return { kind, cards: [{ label: '入口', title: '新的入口卡', href: '/' }] };
    case 'steps':
      return {
        kind,
        title: '新的步骤区块',
        items: [{ title: '第一步', description: '补充说明。' }],
      };
    case 'quote':
      return { kind, text: '新的引用文案。' };
    case 'cta':
      return { kind, title: '新的行动号召', actions: [{ label: '了解更多', href: '/' }] };
    default:
      return { kind: 'cta', title: '新的区块' };
  }
}

export function getSectionTitle(section: SiteSection): string {
  if (section.kind === 'quote') return section.text;
  if (section.kind === 'stats' || section.kind === 'rail') return '';
  return section.title;
}

export function setSectionTitle(section: SiteSection, value: string): SiteSection {
  if (section.kind === 'quote') return { ...section, text: value };
  if (section.kind === 'stats' || section.kind === 'rail') return section;
  return { ...section, title: value };
}

export function getSectionSummary(section: SiteSection): string {
  switch (section.kind) {
    case 'collection':
      return `来源 ${section.source}${section.limit ? ` · 最多 ${section.limit} 条` : ''}`;
    case 'feed':
      return `${section.sources?.length ?? 0} 类内容混排`;
    case 'rail':
      return `${section.cards.length} 张卡片`;
    case 'stats':
    case 'steps':
    case 'feature-grid':
      return `${section.items.length} 项`;
    case 'hero':
      return section.actions?.length ? `${section.actions.length} 个按钮` : '无按钮';
    case 'cta':
      return section.actions?.length ? `${section.actions.length} 个按钮` : '无按钮';
    case 'quote':
      return section.attribution ? `— ${section.attribution}` : '无出处';
    default:
      return '';
  }
}
