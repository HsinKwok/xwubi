import type { FormState, EditorState } from './category-config';
import { DOMAIN_META } from './category-config';

interface CategoryEditorProps {
  editor: EditorState;
  saving: boolean;
  onPatch: (patch: Partial<FormState>) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function CategoryEditor({
  editor,
  saving,
  onPatch,
  onSave,
  onCancel,
}: CategoryEditorProps) {
  return (
    <div className="xw-panel">
      <div className="xw-panel__head">
        <h2 className="xw-panel__title">
          {editor.id ? '编辑' : '新建'}
          {DOMAIN_META[editor.form.domain].label}
        </h2>
        <button
          type="button"
          className="xw-btn xw-btn--ghost xw-btn--sm"
          disabled={saving}
          onClick={onCancel}
        >
          取消
        </button>
      </div>

      <div className="xw-panel__body xw-form">
        <div className="xw-form__row">
          <label className="xw-field">
            <span className="xw-field__label">名称</span>
            <input
              className="xw-input"
              value={editor.form.label}
              maxLength={20}
              placeholder={
                editor.form.domain === 'keymap_version'
                  ? '如：86 版 / 新世纪'
                  : editor.form.domain === 'content_type'
                    ? '如：教学 / 资讯'
                    : '如：横区 / 散文'
              }
              disabled={saving}
              onChange={(event) => onPatch({ label: event.target.value })}
            />
          </label>
          <label className="xw-field">
            <span className="xw-field__label">标识</span>
            <input
              className="xw-input"
              value={editor.form.slug}
              maxLength={32}
              placeholder={
                editor.form.domain === 'keymap_version'
                  ? '如：86 / 98 / xsj'
                  : '如：lesson / basic'
              }
              disabled={saving}
              onChange={(event) => onPatch({ slug: event.target.value.toLowerCase().trim() })}
            />
            <span className="xw-field__hint">
              {editor.form.domain === 'keymap_version'
                ? '允许数字开头，仅含小写字母、数字、下划线或连字符'
                : '小写字母开头，仅含小写字母、数字或下划线'}
              {editor.id && editor.form.domain === 'content_type'
                ? '；修改后已有内容的类型会同步更新'
                : ''}
              {editor.id && editor.form.domain === 'lesson_stage'
                ? '；修改后已有课时的阶段会同步更新'
                : ''}
              {editor.id && editor.form.domain === 'practice_genre'
                ? '；修改后已使用该分类的篇目会同步更新'
                : ''}
              {editor.id && editor.form.domain === 'keymap_version'
                ? '；修改后已使用该版本的内容、字根与例字会同步更新'
                : ''}
            </span>
          </label>
        </div>

        {editor.form.domain === 'content_type' && (
          <label className="xw-field">
            <span className="xw-field__label">前台路径</span>
            <input
              className="xw-input"
              value={editor.form.route}
              placeholder="如：/learn"
              disabled={saving}
              onChange={(event) => onPatch({ route: event.target.value.trim() })}
            />
            <span className="xw-field__hint">
              列表页为「前缀」，详情页为「前缀/slug」；教学模板会多一段阶段。修改后请同步「系统设置」里的导航链接。
            </span>
          </label>
        )}

        <div className="xw-form__row">
          <label className="xw-field">
            <span className="xw-field__label">
              {editor.form.domain === 'keymap_version' ? '备注' : '提示'}
            </span>
            <input
              className="xw-input"
              value={editor.form.hint}
              maxLength={40}
              placeholder="可留空"
              disabled={saving}
              onChange={(event) => onPatch({ hint: event.target.value })}
            />
          </label>
          <label className="xw-field">
            <span className="xw-field__label">排序</span>
            <input
              className="xw-input"
              type="number"
              value={editor.form.sort_order}
              disabled={saving}
              onChange={(event) => onPatch({ sort_order: event.target.value })}
            />
          </label>
        </div>

        {editor.form.domain === 'keymap_zone' && (
          <label className="xw-field">
            <span className="xw-field__label">键位</span>
            <input
              className="xw-input"
              value={editor.form.key_list}
              placeholder="如：G,F,D,S,A"
              disabled={saving}
              onChange={(event) => onPatch({ key_list: event.target.value })}
            />
            <span className="xw-field__hint">单个大写字母，用逗号分隔，最多 12 个</span>
          </label>
        )}

        <div className="xw-form__actions">
          <button
            type="button"
            className="xw-btn xw-btn--primary xw-btn--sm"
            disabled={saving}
            onClick={onSave}
          >
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
