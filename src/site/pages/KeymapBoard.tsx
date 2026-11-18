import type { SiteCategory, SiteConfig } from '../../shared/site-config';
import { splitRoots } from './practice/practice-utils';
import type { KeymapExample, KeymapRoot } from './keymap-types';

interface KeymapBoardProps {
  labels: SiteConfig['labels'];
  zones: SiteCategory[];
  rootMap: Map<string, KeymapRoot>;
  selected: string | null;
  relatedExamples: KeymapExample[];
  onSelect: (key: string) => void;
}

/** 字根键位图：左侧分区键盘，右侧当前键位详情与代表例字 */
export function KeymapBoard({
  labels,
  zones,
  rootMap,
  selected,
  relatedExamples,
  onSelect,
}: KeymapBoardProps) {
  const activeRoot = selected ? rootMap.get(selected) ?? null : null;

  return (
    <div className="site-keymap__layout">
      <div className="site-keymap__board">
        {zones.map((zone) => (
          <div className="site-keymap__row" key={zone.label}>
            <div className="site-keymap__zone">
              <span className="site-keymap__zone-label">{zone.label}</span>
              <span className="site-keymap__zone-hint">{zone.hint}</span>
            </div>
            <div className="site-keymap__keys">
              {zone.keys.map((key) => {
                const root = rootMap.get(key);
                const active = selected === key;
                return (
                  <button
                    key={key}
                    type="button"
                    className={`site-keymap__key${active ? ' is-active' : ''}${
                      root ? '' : ' is-empty'
                    }`}
                    aria-pressed={active}
                    onClick={() => onSelect(key)}
                  >
                    <span className="site-keymap__letter">{key}</span>
                    <span className="site-keymap__preview">
                      {root ? splitRoots(root.roots).slice(0, 3).join(' ') : '待补充'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <aside className="site-keymap__detail">
        {activeRoot ? (
          <>
            <div className="site-keymap__detail-head">
              <span className="site-keymap__detail-key">{activeRoot.key}</span>
              <span className="site-keymap__detail-hint">
                {labels.keymapMnemonic ?? '口诀'}
              </span>
            </div>
            <p className="site-keymap__mnemonic">{activeRoot.mnemonic || '—'}</p>

            <div className="site-keymap__roots">
              {splitRoots(activeRoot.roots).map((root) => (
                <span className="site-keymap__root" key={root}>
                  {root}
                </span>
              ))}
            </div>

            {activeRoot.note && <p className="site-keymap__note">{activeRoot.note}</p>}

            <div className="site-keymap__related">
              <span className="site-keymap__related-title">
                {labels.keymapRelatedExamples ?? '代表例字'}
              </span>
              {relatedExamples.length > 0 ? (
                <div className="site-keymap__related-list">
                  {relatedExamples.map((item) => (
                    <span className="site-keymap__related-item" key={item.char}>
                      <span className="site-keymap__related-char">{item.char}</span>
                      <code>{item.code}</code>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="site-keymap__related-empty">
                  {labels.keymapRelatedEmpty ?? '还没有收录以这个键开头的例字。'}
                </p>
              )}
            </div>
          </>
        ) : (
          <p className="site-keymap__related-empty">
            {labels.keymapSelectHint ?? '选择左侧任一键位查看字根。'}
          </p>
        )}
      </aside>
    </div>
  );
}
