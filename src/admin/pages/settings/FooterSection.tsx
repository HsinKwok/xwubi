import type { SettingsSectionProps } from './section-helpers';

export function FooterSection({ config, disabled, update }: SettingsSectionProps) {
  return (
    <section className="xw-panel">
      <div className="xw-panel__head">
        <h2 className="xw-panel__title">页脚</h2>
      </div>
      <div className="xw-panel__body xw-form">
        <label className="xw-field">
          <span className="xw-field__label">说明</span>
          <input
            className="xw-input"
            value={config.footer.note}
            disabled={disabled}
            onChange={(event) => update((draft) => { draft.footer.note = event.target.value; })}
          />
        </label>
        <label className="xw-field">
          <span className="xw-field__label">版权信息</span>
          <input
            className="xw-input"
            value={config.footer.copyright}
            disabled={disabled}
            onChange={(event) => update((draft) => { draft.footer.copyright = event.target.value; })}
          />
        </label>
        <span className="xw-field__hint">页脚栏目与链接请使用高级 JSON 编辑（footer.columns）。</span>
      </div>
    </section>
  );
}
