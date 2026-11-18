import type { SettingsSectionProps } from './section-helpers';

export function BrandSection({ config, disabled, update }: SettingsSectionProps) {
  return (
    <section className="xw-panel">
      <div className="xw-panel__head">
        <h2 className="xw-panel__title">品牌与主题</h2>
      </div>
      <div className="xw-panel__body xw-form">
        <div className="xw-form__row">
          <label className="xw-field">
            <span className="xw-field__label">品牌名称</span>
            <input
              className="xw-input"
              value={config.brand.name}
              disabled={disabled}
              onChange={(event) => update((draft) => { draft.brand.name = event.target.value; })}
            />
          </label>

          <label className="xw-field">
            <span className="xw-field__label">品牌标识</span>
            <input
              className="xw-input"
              value={config.brand.mark}
              disabled={disabled}
              onChange={(event) => update((draft) => { draft.brand.mark = event.target.value; })}
            />
          </label>
        </div>

        <label className="xw-field">
          <span className="xw-field__label">标语</span>
          <input
            className="xw-input"
            value={config.brand.tagline}
            disabled={disabled}
            onChange={(event) => update((draft) => { draft.brand.tagline = event.target.value; })}
          />
        </label>

        <label className="xw-field">
          <span className="xw-field__label">描述</span>
          <textarea
            className="xw-textarea"
            rows={2}
            value={config.brand.description}
            disabled={disabled}
            onChange={(event) => update((draft) => { draft.brand.description = event.target.value; })}
          />
        </label>

        <div className="xw-form__row">
          <label className="xw-field">
            <span className="xw-field__label">默认主题</span>
            <select
              className="xw-select xw-select--block"
              value={config.theme.defaultMode}
              disabled={disabled}
              onChange={(event) =>
                update((draft) => {
                  draft.theme.defaultMode = event.target.value === 'dark' ? 'dark' : 'light';
                })
              }
            >
              <option value="light">浅色</option>
              <option value="dark">深色</option>
            </select>
          </label>

          <label className="xw-field">
            <span className="xw-field__label">默认码表版本</span>
            <select
              className="xw-select xw-select--block"
              value={config.defaultVersion}
              disabled={disabled}
              onChange={(event) => update((draft) => { draft.defaultVersion = event.target.value; })}
            >
              {config.versions.map((version) => (
                <option value={version.value} key={version.value}>
                  {version.label}
                </option>
              ))}
            </select>
            <span className="xw-field__hint">版本名称与备注在「分类管理 → 码表版本」中维护</span>
          </label>
        </div>
      </div>
    </section>
  );
}
