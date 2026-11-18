import type { AdminContentItem } from '../../lib/content-api';

export { formatDateTime as formatDate } from '../../lib/format';

/** 内容在前台的访问地址，路由来自分类表配置 */
export function publicHref(item: AdminContentItem, route: string | undefined): string {
  const base = route || (item.type === 'lesson' ? '/learn' : `/${item.type}`);
  if (item.type === 'lesson' && item.stage) return `${base}/${item.stage}/${item.slug}`;
  return `${base}/${item.slug}`;
}
