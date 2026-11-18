import { useState } from 'react';
import type { SettingsSectionProps } from './section-helpers';

export function LabelsSection({ config, disabled, update }: SettingsSectionProps) {
  const [newLabelKey, setNewLabelKey] = useState('');

  return (
    <section className="xw-panel">
      <div className="xw-panel__head">
        <h2 className="xw-panel__title">界面文案</h2>
        <span className="xw-panel__count">{Object.keys(config.labels).length} 条</span>
      </div>
      <div className="xw-panel__body xw-form">
        {Object.entries(config.labels).map(([key, value]) => (
          <div className="xw-settings__row xw-settings__row--label" key={key}>
            <span className="xw-settings__code">{key}</span>
            <input
              className="xw-input"
              value={value}
              disabled={disabled}
              aria-label={`${key} 文案`}
              onChange={(event) => update((draft) => { draft.labels[key] = event.target.value; })}
            />
            <button
              type="button"
              className="xw-icon-btn"
              disabled={disabled}
              aria-label="删除文案"
              onClick={() => update((draft) => { delete draft.labels[key]; })}
            >
              ×
            </button>
          </div>
        ))}

        <div className="xw-settings__row xw-settings__row--newlabel">
          <input
            className="xw-input"
            value={newLabelKey}
            disabled={disabled}
            placeholder="新增 key，如 loginHint"
            aria-label="新增文案 key"
            onChange={(event) => setNewLabelKey(event.target.value)}
          />
          <button
            type="button"
            className="xw-btn xw-btn--ghost xw-btn--sm"
            disabled={disabled || !newLabelKey.trim()}
            onClick={() => {
              const key = newLabelKey.trim();
              if (!key) return;
              update((draft) => {
                draft.labels[key] = '';
              });
              setNewLabelKey('');
            }}
          >
            添加
          </button>
        </div>
      </div>
    </section>
  );
}
