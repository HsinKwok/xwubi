import type { RailSection } from '../../../shared/site-config';

interface Props {
  recent: NonNullable<RailSection['recent']>;
  disabled: boolean;
  typeOptions: Map<string, string>;
  patch: (mutator: (target: RailSection) => void) => void;
}

/** 右栏「最近更新」列表配置：标题、来源、条数与更多链接 */
export function RailRecentEditor({ recent, disabled, typeOptions, patch }: Props) {
  return (
    <div className="xw-settings__card">
      <div className="xw-settings__card-head">
        <span>最近更新列表</span>
        <div className="xw-settings__card-actions">
          <button
            type="button"
            className="xw-icon-btn"
            disabled={disabled}
            aria-label="删除最近更新列表"
            onClick={() =>
              patch((target) => {
                delete target.recent;
              })
            }
          >
            ×
          </button>
        </div>
      </div>

      <div className="xw-settings__card-grid">
        <input
          className="xw-input"
          value={recent.title}
          disabled={disabled}
          aria-label="最近更新列表标题"
          placeholder="列表标题"
          onChange={(event) => {
            const value = event.target.value;
            patch((target) => {
              if (target.recent) target.recent.title = value;
            });
          }}
        />
        <select
          className="xw-select"
          value={recent.source ?? 'software'}
          disabled={disabled}
          aria-label="最近更新来源类型"
          onChange={(event) => {
            const value = event.target.value;
            patch((target) => {
              if (target.recent) target.recent.source = value;
            });
          }}
        >
          {[...typeOptions.entries()].map(([key, label]) => (
            <option value={key} key={key}>
              {key} · {label}
            </option>
          ))}
        </select>
        <input
          className="xw-input"
          type="number"
          min={1}
          max={10}
          value={recent.limit ?? 3}
          disabled={disabled}
          aria-label="最近更新条数"
          placeholder="条数"
          onChange={(event) => {
            const value = Number(event.target.value);
            patch((target) => {
              if (target.recent) {
                target.recent.limit = Number.isFinite(value)
                  ? Math.min(Math.max(value, 1), 10)
                  : 3;
              }
            });
          }}
        />
        <input
          className="xw-input"
          value={recent.more?.label ?? ''}
          disabled={disabled}
          aria-label="最近更新更多链接文案"
          placeholder="更多链接文案，如 全部软件"
          onChange={(event) => {
            const value = event.target.value;
            patch((target) => {
              if (!target.recent) return;
              target.recent.more = { label: value, href: target.recent.more?.href ?? '' };
            });
          }}
        />
        <input
          className="xw-input"
          value={recent.more?.href ?? ''}
          disabled={disabled}
          aria-label="最近更新更多链接地址"
          placeholder="更多链接地址，如 /software"
          onChange={(event) => {
            const value = event.target.value;
            patch((target) => {
              if (!target.recent) return;
              target.recent.more = { label: target.recent.more?.label ?? '', href: value };
            });
          }}
        />
      </div>
    </div>
  );
}
