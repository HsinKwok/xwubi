import type { SiteConfig } from '../../../shared/site-config';
import type { SettingsSectionProps } from './section-helpers';

const HEADER_FIELDS: Array<[keyof SiteConfig['header'], string]> = [
  ['versionLabel', '版本切换'],
  ['loginLabel', '登录入口'],
  ['staffLabel', '员工入口'],
  ['themeLabel', '主题切换'],
  ['menuLabel', '菜单按钮'],
];

export function HeaderSection({ config, disabled, update }: SettingsSectionProps) {
  return (
    <section className="xw-panel">
      <div className="xw-panel__head">
        <h2 className="xw-panel__title">头部文案</h2>
      </div>
      <div className="xw-panel__body xw-form">
        {HEADER_FIELDS.map(([key, label]) => (
          <label className="xw-field" key={key}>
            <span className="xw-field__label">{label}</span>
            <input
              className="xw-input"
              value={config.header[key]}
              disabled={disabled}
              onChange={(event) => update((draft) => { draft.header[key] = event.target.value; })}
            />
          </label>
        ))}
      </div>
    </section>
  );
}
