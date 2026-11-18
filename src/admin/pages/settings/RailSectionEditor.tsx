import type { RailSection } from '../../../shared/site-config';
import type { SettingsUpdater } from './section-helpers';
import { RailCardsEditor } from './RailCardsEditor';
import { RailRecentEditor } from './RailRecentEditor';

export interface RailSectionEditorProps {
  index: number;
  section: RailSection;
  disabled: boolean;
  update: SettingsUpdater;
  /** 内容类型可选项：类型 key → 展示名 */
  typeOptions: Map<string, string>;
}

/** 右栏区块详情编辑：入口卡片列表 + 最近更新列表 */
export function RailSectionEditor({
  index,
  section,
  disabled,
  update,
  typeOptions,
}: RailSectionEditorProps) {
  // 所有改动都落在首页对应下标的 rail 区块上
  const patch = (mutator: (target: RailSection) => void) =>
    update((draft) => {
      const current = draft.home.sections[index];
      if (current?.kind === 'rail') mutator(current);
    });

  const recent = section.recent;

  return (
    <>
      <input
        className="xw-input"
        value={section.eyebrow ?? ''}
        disabled={disabled}
        aria-label="右栏小标题"
        placeholder="小标题（如 SHORTCUT）"
        onChange={(event) => {
          const value = event.target.value;
          patch((target) => {
            target.eyebrow = value;
          });
        }}
      />

      <RailCardsEditor cards={section.cards} disabled={disabled} patch={patch} />

      {recent ? (
        <RailRecentEditor
          recent={recent}
          disabled={disabled}
          typeOptions={typeOptions}
          patch={patch}
        />
      ) : (
        <button
          type="button"
          className="xw-btn xw-btn--ghost xw-btn--sm"
          disabled={disabled}
          onClick={() =>
            patch((target) => {
              target.recent = {
                source: 'software',
                title: '最近更新',
                limit: 3,
                more: { label: '查看全部', href: '/software' },
              };
            })
          }
        >
          添加最近更新列表
        </button>
      )}
    </>
  );
}
