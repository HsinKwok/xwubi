import type { PublicContentItem, VersionOption } from '../../shared/site-config';

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) return '';

  return new Date(timestamp).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function contentHref(item: Pick<PublicContentItem, 'type' | 'slug' | 'stage'>): string {
  switch (item.type) {
    case 'lesson':
      return `/learn/${item.stage ?? 'basic'}/${item.slug}`;
    case 'news':
      return `/news/${item.slug}`;
    case 'software':
      return `/software/${item.slug}`;
    case 'tool':
      return `/tools/${item.slug}`;
    default:
      return '/';
  }
}

export function padNumber(value: number): string {
  return String(value).padStart(2, '0');
}

/** 码表版本的展示名：'all' 走通用文案，未知值直接大写兜底 */
export function versionLabel(
  version: string,
  versions: VersionOption[],
  labels: Record<string, string>,
): string {
  if (version === 'all') return labels.generalVersion ?? version.toUpperCase();
  return versions.find((item) => item.value === version)?.label ?? version.toUpperCase();
}

/** 统一从异常中取展示文案：后端已给出可读消息时直接复用，否则回退到页面文案 */
export function errorMessage(caught: unknown, fallback: string): string {
  return caught instanceof Error && caught.message ? caught.message : fallback;
}

/** 提交/纠错查询页的本地时间展示；空值由调用方决定占位符 */
export function formatTime(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
}
