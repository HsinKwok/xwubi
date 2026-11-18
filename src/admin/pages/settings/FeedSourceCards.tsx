// 混排流来源卡片：类型选择、展示名与上移/下移/删除
import type { FeedSection } from '../../../shared/site-config';
import { moveItem } from './section-helpers';

export type FeedPatch = (mutator: (target: FeedSection) => void) => void;

interface FeedSourceCardsProps {
  sources: NonNullable<FeedSection['sources']>;
  disabled: boolean;
  typeOptions: Map<string, string>;
  patch: FeedPatch;
}

export function FeedSourceCards({ sources, disabled, typeOptions, patch }: FeedSourceCardsProps) {
  return (
    <div className="xw-settings__cards">
      {sources.map((source, sourceIndex) => (
        <div className="xw-settings__card" key={sourceIndex}>
          <div className="xw-settings__card-head">
            <span>来源 {sourceIndex + 1}</span>
            <div className="xw-settings__card-actions">
              <button
                type="button"
                className="xw-icon-btn"
                disabled={disabled || sourceIndex === 0}
                aria-label="来源上移"
                onClick={() =>
                  patch((target) => {
                    if (target.sources) moveItem(target.sources, sourceIndex, -1);
                  })
                }
              >
                ↑
              </button>
              <button
                type="button"
                className="xw-icon-btn"
                disabled={disabled || sourceIndex === sources.length - 1}
                aria-label="来源下移"
                onClick={() =>
                  patch((target) => {
                    if (target.sources) moveItem(target.sources, sourceIndex, 1);
                  })
                }
              >
                ↓
              </button>
              <button
                type="button"
                className="xw-icon-btn"
                disabled={disabled}
                aria-label="删除来源"
                onClick={() =>
                  patch((target) => {
                    target.sources?.splice(sourceIndex, 1);
                  })
                }
              >
                ×
              </button>
            </div>
          </div>

          <div className="xw-settings__card-grid">
            <select
              className="xw-select"
              value={source.type}
              disabled={disabled}
              aria-label={`来源 ${sourceIndex + 1} 类型`}
              onChange={(event) => {
                const value = event.target.value;
                patch((target) => {
                  const current = target.sources?.[sourceIndex];
                  if (current) current.type = value;
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
              value={source.label}
              disabled={disabled}
              aria-label={`来源 ${sourceIndex + 1} 展示名`}
              placeholder="展示名，如 教学"
              onChange={(event) => {
                const value = event.target.value;
                patch((target) => {
                  const current = target.sources?.[sourceIndex];
                  if (current) current.label = value;
                });
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
