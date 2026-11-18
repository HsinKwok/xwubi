// 首页混排流详情编辑：描述、条数、参与类型与更多链接
import type { FeedSection } from '../../../shared/site-config';
import { FeedSourceCards, type FeedPatch } from './FeedSourceCards';
import type { SettingsUpdater } from './section-helpers';

export interface FeedSectionEditorProps {
  index: number;
  section: FeedSection;
  disabled: boolean;
  update: SettingsUpdater;
  /** 内容类型可选项：类型 key → 展示名 */
  typeOptions: Map<string, string>;
}

/** 未配置来源时的默认混排类型 */
const DEFAULT_SOURCE_TYPES = ['lesson', 'news', 'software', 'tool'];

export function FeedSectionEditor({
  index,
  section,
  disabled,
  update,
  typeOptions,
}: FeedSectionEditorProps) {
  const patch: FeedPatch = (mutator) =>
    update((draft) => {
      const current = draft.home.sections[index];
      if (current?.kind === 'feed') mutator(current);
    });

  const sources = section.sources ?? [];
  const more = section.more;

  return (
    <>
      <input
        className="xw-input"
        value={section.eyebrow ?? ''}
        disabled={disabled}
        aria-label="混排流小标题"
        placeholder="小标题（如 LATEST）"
        onChange={(event) => {
          const value = event.target.value;
          patch((target) => {
            target.eyebrow = value;
          });
        }}
      />

      <textarea
        className="xw-settings__textarea"
        value={section.description ?? ''}
        disabled={disabled}
        aria-label="混排流说明"
        placeholder="一句话说明这个流里放什么"
        onChange={(event) => {
          const value = event.target.value;
          patch((target) => {
            target.description = value;
          });
        }}
      />

      <input
        className="xw-input"
        type="number"
        min={1}
        max={20}
        value={section.limit ?? 8}
        disabled={disabled}
        aria-label="混排流条数"
        placeholder="条数"
        onChange={(event) => {
          const value = Number(event.target.value);
          patch((target) => {
            target.limit = Number.isFinite(value) ? Math.min(Math.max(value, 1), 20) : 8;
          });
        }}
      />

      {sources.length > 0 ? (
        <FeedSourceCards
          sources={sources}
          disabled={disabled}
          typeOptions={typeOptions}
          patch={patch}
        />
      ) : (
        <p className="xw-field__hint">未配置来源时按 教学 / 资讯 / 软件 / 工具 混排。</p>
      )}

      <button
        type="button"
        className="xw-btn xw-btn--ghost xw-btn--sm"
        disabled={disabled || sources.length >= 6}
        onClick={() =>
          patch((target) => {
            if (!target.sources) {
              // 首次配置先补上默认四类，避免加入重复项
              target.sources = DEFAULT_SOURCE_TYPES.map((type) => ({
                type,
                label: typeOptions.get(type) ?? type,
              }));
              return;
            }
            target.sources.push({ type: 'lesson', label: '教学' });
          })
        }
      >
        {sources.length > 0 ? '添加来源' : '配置默认来源'}
      </button>

      {more ? (
        <div className="xw-settings__card">
          <div className="xw-settings__card-head">
            <span>更多链接</span>
            <div className="xw-settings__card-actions">
              <button
                type="button"
                className="xw-icon-btn"
                disabled={disabled}
                aria-label="删除更多链接"
                onClick={() =>
                  patch((target) => {
                    delete target.more;
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
              value={more.label}
              disabled={disabled}
              aria-label="更多链接文案"
              placeholder="链接文案，如 全部资讯"
              onChange={(event) => {
                const value = event.target.value;
                patch((target) => {
                  if (target.more) target.more.label = value;
                });
              }}
            />
            <input
              className="xw-input"
              value={more.href}
              disabled={disabled}
              aria-label="更多链接地址"
              placeholder="链接地址，如 /news"
              onChange={(event) => {
                const value = event.target.value;
                patch((target) => {
                  if (target.more) target.more.href = value;
                });
              }}
            />
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="xw-btn xw-btn--ghost xw-btn--sm"
          disabled={disabled}
          onClick={() =>
            patch((target) => {
              target.more = { label: '查看全部', href: '/news' };
            })
          }
        >
          添加更多链接
        </button>
      )}
    </>
  );
}
