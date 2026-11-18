import type { RailSection } from '../../../shared/site-config';
import { moveItem } from './section-helpers';

interface Props {
  cards: RailSection['cards'];
  disabled: boolean;
  patch: (mutator: (target: RailSection) => void) => void;
}

/** 右栏入口卡片列表编辑：排序、删除与字段维护 */
export function RailCardsEditor({ cards, disabled, patch }: Props) {
  return (
    <>
      <div className="xw-settings__cards">
        {cards.map((card, cardIndex) => (
          <div className="xw-settings__card" key={cardIndex}>
            <div className="xw-settings__card-head">
              <span>入口卡片 {cardIndex + 1}</span>
              <div className="xw-settings__card-actions">
                <button
                  type="button"
                  className="xw-icon-btn"
                  disabled={disabled || cardIndex === 0}
                  aria-label="卡片上移"
                  onClick={() => patch((target) => moveItem(target.cards, cardIndex, -1))}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="xw-icon-btn"
                  disabled={disabled || cardIndex === cards.length - 1}
                  aria-label="卡片下移"
                  onClick={() => patch((target) => moveItem(target.cards, cardIndex, 1))}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="xw-icon-btn"
                  disabled={disabled}
                  aria-label="删除卡片"
                  onClick={() => patch((target) => { target.cards.splice(cardIndex, 1); })}
                >
                  ×
                </button>
              </div>
            </div>

            <div className="xw-settings__card-grid">
              <input
                className="xw-input"
                value={card.label ?? ''}
                disabled={disabled}
                aria-label={`卡片 ${cardIndex + 1} 小标签`}
                placeholder="小标签（如 工具）"
                onChange={(event) => {
                  const value = event.target.value;
                  patch((target) => {
                    target.cards[cardIndex].label = value;
                  });
                }}
              />
              <input
                className="xw-input"
                value={card.title}
                disabled={disabled}
                aria-label={`卡片 ${cardIndex + 1} 标题`}
                placeholder="卡片标题"
                onChange={(event) => {
                  const value = event.target.value;
                  patch((target) => {
                    target.cards[cardIndex].title = value;
                  });
                }}
              />
              <input
                className="xw-input"
                value={card.description ?? ''}
                disabled={disabled}
                aria-label={`卡片 ${cardIndex + 1} 说明`}
                placeholder="一句话说明"
                onChange={(event) => {
                  const value = event.target.value;
                  patch((target) => {
                    target.cards[cardIndex].description = value;
                  });
                }}
              />
              <input
                className="xw-input"
                value={card.href}
                disabled={disabled}
                aria-label={`卡片 ${cardIndex + 1} 链接`}
                placeholder="跳转地址，如 /tools/keymap"
                onChange={(event) => {
                  const value = event.target.value;
                  patch((target) => {
                    target.cards[cardIndex].href = value;
                  });
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="xw-btn xw-btn--ghost xw-btn--sm"
        disabled={disabled || cards.length >= 6}
        onClick={() =>
          patch((target) => {
            target.cards.push({ label: '入口', title: '新的卡片', description: '', href: '/' });
          })
        }
      >
        添加入口卡片
      </button>
    </>
  );
}
