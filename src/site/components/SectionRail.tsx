import type { RailSection } from '../../shared/site-config';
import { ContentLink } from './sections-primitives';

/** 侧栏区块：快捷卡片与最近更新 */
export function RailView({ section }: { section: RailSection }) {
  return (
    <aside className="site-rail">
      {section.eyebrow && <p className="site-eyebrow">{section.eyebrow}</p>}

      {section.cards.map((card) => (
        <a className="site-rail__card" href={card.href} key={card.title}>
          {card.label && <span className="site-rail__label">{card.label}</span>}
          <span className="site-rail__title">{card.title}</span>
          {card.description && <span className="site-rail__desc">{card.description}</span>}
          <span className="site-rail__arrow" aria-hidden="true">
            →
          </span>
        </a>
      ))}

      {/* 当前码表版本没有更新内容时整块隐藏，避免只剩标题的空区块 */}
      {section.recent && (section.recent.items?.length ?? 0) > 0 && (
        <div className="site-rail__recent">
          <div className="site-rail__recent-head">
            <h2 className="site-rail__recent-title">{section.recent.title}</h2>
            {section.recent.more && (
              <a className="site-rail__recent-more" href={section.recent.more.href}>
                {section.recent.more.label}
              </a>
            )}
          </div>
          <ul className="site-rail__recent-list">
            {(section.recent.items ?? []).map((item) => (
              <li key={item.id}>
                <ContentLink item={item}>{item.title}</ContentLink>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
