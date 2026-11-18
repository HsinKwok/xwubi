import type { ContentStatus, ContentType } from '../../lib/content-api';

export const CONTENT_STATUSES: ContentStatus[] = [
  'draft',
  'pending',
  'published',
  'needs_review',
  'archived',
];

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  draft: '草稿',
  pending: '待审核',
  published: '已发布',
  needs_review: '待复核',
  archived: '已归档',
};

/** 软件平台的常见取值，允许自由填写 */
export const PLATFORM_SUGGESTIONS = ['Windows', 'macOS', 'Linux', 'Android', 'iOS'];

export interface TypeOption {
  slug: ContentType;
  label: string;
}

/** 内容类型文案来自后台分类表，找不到时退回标识本身 */
export function typeLabel(type: ContentType, types: TypeOption[]): string {
  return types.find((item) => item.slug === type)?.label ?? type;
}

export function isContentStatus(value: string): value is ContentStatus {
  return (CONTENT_STATUSES as string[]).includes(value);
}

/** 把「换行或逗号」分隔的输入拆成数组 */
export function splitList(value: string): string[] {
  return value
    .split(/[\n,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function joinList(value: unknown): string {
  if (!Array.isArray(value)) return '';
  return value.filter((item): item is string => typeof item === 'string').join('\n');
}
