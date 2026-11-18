import { moveItem } from './section-helpers';
import type { SettingsSectionProps } from './section-helpers';

export function NavSection({ config, disabled, update }: SettingsSectionProps) {
  return (
    <section className="xw-panel">
      <div className="xw-panel__head">
        <h2 className="xw-panel__title">导航</h2>
        <button
          type="button"
          className="xw-btn xw-btn--ghost xw-btn--sm"
          disabled={disabled}
          onClick={() =>
            update((draft) => {
              draft.nav.push({ key: `nav-${Date.now().toString(36)}`, label: '新导航', href: '/' });
            })
          }
        >
          添加导航项
        </button>
      </div>
      <div className="xw-panel__body xw-form">
        {config.nav.map((item, index) => (
          <div className="xw-settings__row xw-settings__row--nav" key={`${item.key}-${index}`}>
            <input
              className="xw-input"
              value={item.key}
              disabled={disabled}
              aria-label="导航 key"
              onChange={(event) => update((draft) => { draft.nav[index].key = event.target.value; })}
            />
            <input
              className="xw-input"
              value={item.label}
              disabled={disabled}
              aria-label="导航名称"
              onChange={(event) => update((draft) => { draft.nav[index].label = event.target.value; })}
            />
            <input
              className="xw-input"
              value={item.href}
              disabled={disabled}
              aria-label="导航链接"
              onChange={(event) => update((draft) => { draft.nav[index].href = event.target.value; })}
            />
            <div className="xw-settings__row-actions">
              <button
                type="button"
                className="xw-icon-btn"
                disabled={disabled || index === 0}
                aria-label="上移"
                onClick={() => update((draft) => moveItem(draft.nav, index, -1))}
              >
                ↑
              </button>
              <button
                type="button"
                className="xw-icon-btn"
                disabled={disabled || index === config.nav.length - 1}
                aria-label="下移"
                onClick={() => update((draft) => moveItem(draft.nav, index, 1))}
              >
                ↓
              </button>
              <button
                type="button"
                className="xw-icon-btn"
                disabled={disabled}
                aria-label="删除"
                onClick={() => update((draft) => { draft.nav.splice(index, 1); })}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
