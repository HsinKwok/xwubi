import type { HeroSection, StatsSection } from '../../shared/site-config';
import { Actions } from './sections-primitives';

/** 首页头图区块 */
export function HeroView({ section }: { section: HeroSection }) {
  const lines = section.title.split('\n');

  return (
    <section className={`site-hero${section.aside ? '' : ' site-hero--plain'}`}>
      <div className="site-hero__main">
        {section.eyebrow && <p className="site-eyebrow">{section.eyebrow}</p>}
        <h1 className="site-hero__title">
          {lines.map((line, index) => (
            <span className="site-hero__line" key={`${line}-${index}`}>
              {line}
            </span>
          ))}
        </h1>
        {section.lead && <p className="site-hero__lead">{section.lead}</p>}
        <Actions actions={section.actions} />
      </div>

      {section.aside && (
        <aside className="site-hero__aside">
          {section.aside.label && <p className="site-eyebrow">{section.aside.label}</p>}
          <dl className="site-hero__facts">
            {section.aside.items.map((item) => (
              <div className="site-hero__fact" key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
                {item.hint && <p className="site-hero__fact-hint">{item.hint}</p>}
              </div>
            ))}
          </dl>
        </aside>
      )}
    </section>
  );
}

/** 数据概览区块 */
export function StatsView({
  section,
  labels,
}: {
  section: StatsSection;
  labels: Record<string, string>;
}) {
  return (
    <section className="site-stats" aria-label={labels.statsAria}>
      {section.items.map((item) => (
        <div className="site-stats__item" key={item.label}>
          <p className="site-stats__value">{item.value}</p>
          <p className="site-stats__label">{item.label}</p>
          {item.hint && <p className="site-stats__hint">{item.hint}</p>}
        </div>
      ))}
    </section>
  );
}
