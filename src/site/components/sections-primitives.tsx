import type { ReactNode } from 'react';
import type {
  ActionLink,
  ContentTypeOption,
  PublicContentItem,
  VersionOption,
} from '../../shared/site-config';
import { contentHref, formatDate, padNumber, versionLabel } from '../lib/format';

/** 内容跳转链接：统一拼接详情路径，区块内只负责自己的排版 */
export function ContentLink({
  item,
  className,
  children,
}: {
  item: PublicContentItem;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a className={className} href={contentHref(item)}>
      {children}
    </a>
  );
}

/** 页面区块渲染所需的站点上下文 */
export interface SectionContext {
  labels: Record<string, string>;
  versions: VersionOption[];
  types: ContentTypeOption[];
  emptyTitle?: string;
  emptyDescription?: string;
}

export function typeLabel(type: string, types: ContentTypeOption[]): string {
  return types.find((item) => item.slug === type)?.label ?? type.toUpperCase();
}

/** 区块底部的一组跳转按钮 */
export function Actions({ actions }: { actions?: ActionLink[] }) {
  if (!actions || actions.length === 0) return null;

  return (
    <div className="site-actions">
      {actions.map((action) => (
        <a
          key={action.href + action.label}
          className={`site-btn site-btn--${action.variant ?? 'primary'}`}
          href={action.href}
        >
          {action.label}
          <span className="site-btn__arrow" aria-hidden="true">
            →
          </span>
        </a>
      ))}
    </div>
  );
}

/** 内容列表中的单行条目 */
export function CollectionRow({
  item,
  index,
  versions,
  labels,
}: {
  item: PublicContentItem;
  index: number;
  versions: VersionOption[];
  labels: Record<string, string>;
}) {
  return (
    <a className="site-item" href={contentHref(item)}>
      <span className="site-item__index">{padNumber(index + 1)}</span>
      <span className="site-item__body">
        <span className="site-item__title">{item.title}</span>
        {item.summary && <span className="site-item__summary">{item.summary}</span>}
      </span>
      <span className="site-item__meta">
        <span className="site-item__version">{versionLabel(item.version, versions, labels)}</span>
        {item.published_at && (
          <span className="site-item__date">{formatDate(item.published_at)}</span>
        )}
      </span>
      <span className="site-item__arrow" aria-hidden="true">
        →
      </span>
    </a>
  );
}
