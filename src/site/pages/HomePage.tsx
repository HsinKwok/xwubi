import type { BootstrapPayload, FeedSection, RailSection } from '../../shared/site-config';
import { SectionList, SectionRenderer } from '../components/Sections';

export function HomePage({ boot }: { boot: BootstrapPayload }) {
  const { sections } = boot.home;
  const context = {
    labels: boot.labels,
    versions: boot.versions,
    types: boot.types,
  };

  const feed = sections.find((section): section is FeedSection => section.kind === 'feed');
  const rail = sections.find((section): section is RailSection => section.kind === 'rail');

  // 未同时配置混排流与右栏时保持原有线性结构
  if (!feed || !rail) {
    return (
      <div className="site-page site-page--home">
        <SectionList sections={sections} context={context} />
      </div>
    );
  }

  // 流与右栏合并为双栏，其余区块仍按配置顺序渲染
  const splitAt = Math.min(sections.indexOf(feed), sections.indexOf(rail));
  const before = sections.slice(0, splitAt);
  const after = sections.filter(
    (section, index) =>
      index > splitAt && section.kind !== 'feed' && section.kind !== 'rail',
  );

  return (
    <div className="site-page site-page--home">
      <SectionList sections={before} context={context} />

      <div className="site-home-split">
        <div className="site-home-split__main">
          <SectionRenderer section={feed} context={context} />
        </div>
        <SectionRenderer section={rail} context={context} />
      </div>

      <SectionList sections={after} context={context} />
    </div>
  );
}
