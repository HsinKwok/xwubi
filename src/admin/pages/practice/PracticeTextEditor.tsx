import type { CategoryItem } from '../../lib/categories-api';
import type { PracticeTextEditorState, PracticeTextForm } from './practice-text-utils';

interface PracticeTextEditorProps {
  editor: PracticeTextEditorState;
  genres: CategoryItem[];
  saving: boolean;
  bodyChars: number;
  onChange: (patch: Partial<PracticeTextForm>) => void;
  onCancel: () => void;
  onSave: () => void;
}

/** 篇目新增/编辑表单 */
export function PracticeTextEditor({
  editor,
  genres,
  saving,
  bodyChars,
  onChange,
  onCancel,
  onSave,
}: PracticeTextEditorProps) {
  return (
    <div className="xw-panel">
      <div className="xw-panel__head">
        <h2 className="xw-panel__title">{editor.id ? '编辑篇目' : '新建篇目'}</h2>
        <button
          type="button"
          className="xw-btn xw-btn--ghost xw-btn--sm"
          disabled={saving}
          onClick={onCancel}
        >
          取消
        </button>
      </div>

      {editor.loading ? (
        <p className="xw-field__hint">正在加载正文…</p>
      ) : (
        <div className="xw-panel__body xw-form">
          <div className="xw-form__row">
            <label className="xw-field">
              <span className="xw-field__label">标题</span>
              <input
                className="xw-input"
                value={editor.form.title}
                maxLength={60}
                disabled={saving}
                onChange={(event) => onChange({ title: event.target.value })}
              />
            </label>
            <label className="xw-field">
              <span className="xw-field__label">分类</span>
              <select
                className="xw-select"
                value={editor.form.genre}
                disabled={saving}
                onChange={(event) => onChange({ genre: event.target.value })}
              >
                {genres.length === 0 && <option value="">暂无分类，请先在分类管理中创建</option>}
                {genres.map((option) => (
                  <option value={option.slug} key={option.id}>
                    {option.label}
                  </option>
                ))}
                {editor.form.genre &&
                  !genres.some((option) => option.slug === editor.form.genre) && (
                    <option value={editor.form.genre}>{editor.form.genre}（已下线）</option>
                  )}
              </select>
            </label>
          </div>

          <div className="xw-form__row">
            <label className="xw-field">
              <span className="xw-field__label">作者</span>
              <input
                className="xw-input"
                value={editor.form.author}
                maxLength={30}
                placeholder="佚名可留空"
                disabled={saving}
                onChange={(event) => onChange({ author: event.target.value })}
              />
            </label>
            <label className="xw-field">
              <span className="xw-field__label">朝代</span>
              <input
                className="xw-input"
                value={editor.form.dynasty}
                maxLength={20}
                placeholder="如：先秦、唐、宋"
                disabled={saving}
                onChange={(event) => onChange({ dynasty: event.target.value })}
              />
            </label>
          </div>

          <label className="xw-field">
            <span className="xw-field__label">排序</span>
            <input
              className="xw-input"
              type="number"
              value={editor.form.sort_order}
              disabled={saving}
              onChange={(event) => onChange({ sort_order: event.target.value })}
            />
            <span className="xw-field__hint">数字越小越靠前；相同时按标题排序。</span>
          </label>

          <label className="xw-field">
            <span className="xw-field__label">正文</span>
            <textarea
              className="xw-textarea"
              rows={14}
              value={editor.form.body}
              disabled={saving}
              placeholder="粘贴古文全文，保留原有分段与标点"
              onChange={(event) => onChange({ body: event.target.value })}
            />
            <span className="xw-field__hint">
              当前 {bodyChars} 个汉字（保存后由后端重新统计）
            </span>
          </label>

          <div className="xw-editor__actions">
            <button
              type="button"
              className="xw-btn xw-btn--primary"
              disabled={saving || !editor.form.title.trim() || !editor.form.body.trim()}
              onClick={onSave}
            >
              {saving ? '保存中…' : editor.id ? '保存修改' : '创建篇目'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
