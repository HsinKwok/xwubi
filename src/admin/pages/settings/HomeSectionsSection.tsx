import { useState } from 'react';
import type { SiteSection } from '../../../shared/site-config';
import type { CategoryItem } from '../../lib/categories-api';
import { FeedSectionEditor } from './FeedSectionEditor';
import { RailSectionEditor } from './RailSectionEditor';
import {
  SECTION_KINDS,
  SECTION_KIND_LABELS,
  createSection,
  getSectionSummary,
  getSectionTitle,
  moveItem,
  setSectionTitle,
} from './section-helpers';
import type { SettingsSectionProps } from './section-helpers';

export interface HomeSectionsSectionProps extends SettingsSectionProps {
  /** 分类表中的内容类型，决定合集区块可选的来源 */
  contentTypes: CategoryItem[];
}

export function HomeSectionsSection({
  config,
  disabled,
  update,
  contentTypes,
}: HomeSectionsSectionProps) {
  const [newSectionKind, setNewSectionKind] = useState<SiteSection['kind']>('collection');

  // 合集来源：分类表里的内容类型优先，保留旧的配置项以兼容历史区块
  const collectionOptions = new Map<string, string>();
  for (const [key, meta] of Object.entries(config.collections ?? {})) {
    collectionOptions.set(key, meta.title || key);
  }
  for (const type of contentTypes) {
    collectionOptions.set(type.slug, type.label);
  }

  return (
    <section className="xw-panel">
      <div className="xw-panel__head">
        <h2 className="xw-panel__title">首页区块</h2>
        <div className="xw-settings__add">
          <select
            className="xw-select"
            value={newSectionKind}
            disabled={disabled}
            aria-label="新增区块类型"
            onChange={(event) => setNewSectionKind(event.target.value as SiteSection['kind'])}
          >
            {SECTION_KINDS.map((kind) => (
              <option value={kind} key={kind}>
                {SECTION_KIND_LABELS[kind]}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="xw-btn xw-btn--ghost xw-btn--sm"
            disabled={disabled}
            onClick={() =>
              update((draft) => {
                const kind = SECTION_KINDS.find((item) => item === newSectionKind) ?? 'cta';
                draft.home.sections.push(createSection(kind, Object.keys(draft.collections)));
              })
            }
          >
            追加
          </button>
        </div>
      </div>
      <div className="xw-panel__body xw-form">
        {config.home.sections.map((section, index) => (
          <div className="xw-settings__row xw-settings__row--section" key={`${section.kind}-${index}`}>
            <div className="xw-settings__section-main">
              <div className="xw-settings__section-top">
                <span className="xw-tag">{SECTION_KIND_LABELS[section.kind]}</span>
                <span className="xw-settings__code">{getSectionSummary(section)}</span>
              </div>
              {section.kind === 'stats' ? (
                <p className="xw-field__hint">数据项文案请使用高级 JSON 编辑。</p>
              ) : section.kind === 'rail' ? null : (
                <input
                  className="xw-input"
                  value={getSectionTitle(section)}
                  disabled={disabled}
                  aria-label="区块标题"
                  onChange={(event) =>
                    update((draft) => {
                      draft.home.sections[index] = setSectionTitle(
                        draft.home.sections[index],
                        event.target.value,
                      );
                    })
                  }
                />
              )}
              {section.kind === 'collection' && (
                <select
                  className="xw-select xw-select--block"
                  value={section.source}
                  disabled={disabled}
                  aria-label="内容来源"
                  onChange={(event) =>
                    update((draft) => {
                      const current = draft.home.sections[index];
                      if (current.kind === 'collection') current.source = event.target.value;
                    })
                  }
                >
                  {[...collectionOptions.entries()].map(([key, label]) => (
                    <option value={key} key={key}>
                      {key} · {label}
                    </option>
                  ))}
                </select>
              )}
              {section.kind === 'feed' && (
                <FeedSectionEditor
                  index={index}
                  section={section}
                  disabled={disabled}
                  update={update}
                  typeOptions={collectionOptions}
                />
              )}
              {section.kind === 'rail' && (
                <RailSectionEditor
                  index={index}
                  section={section}
                  disabled={disabled}
                  update={update}
                  typeOptions={collectionOptions}
                />
              )}
            </div>

            <div className="xw-settings__row-actions">
              <button
                type="button"
                className="xw-icon-btn"
                disabled={disabled || index === 0}
                aria-label="上移"
                onClick={() => update((draft) => moveItem(draft.home.sections, index, -1))}
              >
                ↑
              </button>
              <button
                type="button"
                className="xw-icon-btn"
                disabled={disabled || index === config.home.sections.length - 1}
                aria-label="下移"
                onClick={() => update((draft) => moveItem(draft.home.sections, index, 1))}
              >
                ↓
              </button>
              <button
                type="button"
                className="xw-icon-btn"
                disabled={disabled}
                aria-label="删除"
                onClick={() => update((draft) => { draft.home.sections.splice(index, 1); })}
              >
                ×
              </button>
            </div>
          </div>
        ))}
        <span className="xw-field__hint">
          区块顺序即首页顺序；按钮、列表项等细节可在高级 JSON 中调整。
        </span>
      </div>
    </section>
  );
}
