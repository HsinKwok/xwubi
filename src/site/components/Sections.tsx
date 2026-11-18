import type { SiteSection } from '../../shared/site-config';
import { CollectionView, FeedView } from './SectionCollection';
import { HeroView, StatsView } from './SectionHero';
import { CtaView, FeatureGridView, QuoteView, StepsView } from './SectionNarrative';
import { RailView } from './SectionRail';
import type { SectionContext } from './sections-primitives';

export type { SectionContext } from './sections-primitives';
export { CollectionRow } from './sections-primitives';

/** 按区块类型渲染单个首页区块 */
export function SectionRenderer({
  section,
  context,
}: {
  section: SiteSection;
  context: SectionContext;
}) {
  switch (section.kind) {
    case 'hero':
      return <HeroView section={section} />;
    case 'stats':
      return <StatsView section={section} labels={context.labels} />;
    case 'feature-grid':
      return <FeatureGridView section={section} />;
    case 'collection':
      return <CollectionView section={section} context={context} />;
    case 'feed':
      return <FeedView section={section} context={context} />;
    case 'rail':
      return <RailView section={section} />;
    case 'steps':
      return <StepsView section={section} />;
    case 'quote':
      return <QuoteView section={section} />;
    case 'cta':
      return <CtaView section={section} />;
    default:
      return null;
  }
}

/** 依次渲染一组首页区块 */
export function SectionList({
  sections,
  context,
}: {
  sections: SiteSection[];
  context: SectionContext;
}) {
  return (
    <>
      {sections.map((section, index) => (
        <SectionRenderer section={section} context={context} key={`${section.kind}-${index}`} />
      ))}
    </>
  );
}
