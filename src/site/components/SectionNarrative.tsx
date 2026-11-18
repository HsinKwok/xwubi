import type {
  CtaSection,
  FeatureGridSection,
  QuoteSection,
  StepsSection,
} from '../../shared/site-config';
import { padNumber } from '../lib/format';
import { Badge, SectionHeader } from './Bits';
import { Actions } from './sections-primitives';

/** 特性网格区块：编号卡片，可带徽标与链接 */
export function FeatureGridView({ section }: { section: FeatureGridSection }) {
  return (
    <section className="site-section">
      <SectionHeader
        eyebrow={section.eyebrow}
        title={section.title}
        description={section.description}
      />

      <div className="site-features">
        {section.items.map((item, index) => {
          const content = (
            <>
              <div className="site-feature__top">
                <span className="site-feature__index">{padNumber(index + 1)}</span>
                {item.badge && <Badge>{item.badge}</Badge>}
              </div>
              <h3 className="site-feature__title">{item.title}</h3>
              {item.description && <p className="site-feature__desc">{item.description}</p>}
              {item.meta && <p className="site-feature__meta">{item.meta}</p>}
            </>
          );

          return item.href ? (
            <a className="site-feature" href={item.href} key={item.title}>
              {content}
              <span className="site-feature__arrow" aria-hidden="true">
                →
              </span>
            </a>
          ) : (
            <article className="site-feature" key={item.title}>
              {content}
            </article>
          );
        })}
      </div>
    </section>
  );
}

/** 步骤区块：默认横排，path 变体为纵向学习路线 */
export function StepsView({ section }: { section: StepsSection }) {
  // 学习路线：纵向长卡，突出阶段顺序与入口按钮
  if (section.variant === 'path') {
    return (
      <section className="site-section">
        <div className="site-path">
          <header className="site-path__head">
            <div>
              {section.eyebrow && <p className="site-eyebrow">{section.eyebrow}</p>}
              <h2 className="site-section__title">{section.title}</h2>
              {section.description && <p className="site-path__desc">{section.description}</p>}
            </div>
          </header>

          <ol className="site-path__list">
            {section.items.map((item, index) => (
              <li className="site-path__item" key={item.title}>
                <span className="site-path__label">{item.label ?? padNumber(index + 1)}</span>
                <div>
                  <h3 className="site-path__title">{item.title}</h3>
                  {item.description && (
                    <p className="site-path__item-desc">{item.description}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>

          {section.actions && <Actions actions={section.actions} />}
        </div>
      </section>
    );
  }

  return (
    <section className="site-section">
      <SectionHeader
        eyebrow={section.eyebrow}
        title={section.title}
        description={section.description}
      />

      <ol className="site-steps">
        {section.items.map((item, index) => (
          <li className="site-step" key={item.title}>
            <span className="site-step__label">{item.label ?? padNumber(index + 1)}</span>
            <h3 className="site-step__title">{item.title}</h3>
            {item.description && <p className="site-step__desc">{item.description}</p>}
          </li>
        ))}
      </ol>
    </section>
  );
}

/** 引用区块 */
export function QuoteView({ section }: { section: QuoteSection }) {
  return (
    <section className="site-quote">
      <blockquote>{section.text}</blockquote>
      {section.attribution && <p className="site-quote__by">{section.attribution}</p>}
    </section>
  );
}

/** 行动号召区块 */
export function CtaView({ section }: { section: CtaSection }) {
  return (
    <section className="site-cta">
      <div>
        <h2 className="site-cta__title">{section.title}</h2>
        {section.description && <p className="site-cta__desc">{section.description}</p>}
      </div>
      <Actions actions={section.actions} />
    </section>
  );
}
