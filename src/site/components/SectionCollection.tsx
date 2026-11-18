import type { CollectionSection, FeedSection, PublicContentItem } from '../../shared/site-config';
import { formatDate, versionLabel } from '../lib/format';
import { EmptyState, SectionHeader } from './Bits';
import {
  CollectionRow,
  ContentLink,
  typeLabel,
  type SectionContext,
} from './sections-primitives';

function EmptyBlock({ context }: { context: SectionContext }) {
  return (
    <EmptyState
      title={context.emptyTitle ?? context.labels.emptyTitle ?? '暂无内容'}
      description={context.emptyDescription ?? context.labels.emptyDescription}
    />
  );
}

/** 编号列表区块：常用作精选与最新内容 */
export function CollectionView({
  section,
  context,
}: {
  section: CollectionSection;
  context: SectionContext;
}) {
  const items = section.items ?? [];

  return (
    <section className="site-section">
      <SectionHeader
        eyebrow={section.eyebrow}
        title={section.title}
        description={section.description}
        more={section.more}
        stacked
      />

      {items.length > 0 ? (
        <div className="site-items">
          {items.map((item, index) => (
            <CollectionRow
              item={item}
              index={index}
              versions={context.versions}
              labels={context.labels}
              key={item.id}
            />
          ))}
        </div>
      ) : (
        <EmptyBlock context={context} />
      )}
    </section>
  );
}

/** 时间流区块：按发布时间展示类型与摘要 */
export function FeedView({
  section,
  context,
}: {
  section: FeedSection;
  context: SectionContext;
}) {
  const items = section.items ?? [];

  return (
    <section className="site-feed">
      <SectionHeader
        eyebrow={section.eyebrow}
        title={section.title}
        description={section.description}
        more={section.more}
        stacked
      />

      {items.length > 0 ? (
        <div className="site-feed__list">
          {items.map((item: PublicContentItem) => (
            <ContentLink className="site-feed__item" item={item} key={item.id}>
              <span className="site-feed__meta">
                <span className="site-feed__type">{typeLabel(item.type, context.types)}</span>
                {item.published_at && (
                  <time className="site-feed__date" dateTime={item.published_at}>
                    {formatDate(item.published_at)}
                  </time>
                )}
              </span>
              <span className="site-feed__title">{item.title}</span>
              {item.summary && <span className="site-feed__summary">{item.summary}</span>}
              <span className="site-feed__version">
                {versionLabel(item.version, context.versions, context.labels)}
              </span>
            </ContentLink>
          ))}
        </div>
      ) : (
        <EmptyBlock context={context} />
      )}
    </section>
  );
}
