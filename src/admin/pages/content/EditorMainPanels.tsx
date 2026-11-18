import type { ContentFormState } from './content-form';
import { ContentMetaFields } from './ContentMetaFields';
import { MarkdownEditor } from './MarkdownEditor';
import { typeLabel } from './content-meta';
import type { TypeOption } from './content-meta';

export interface EditorMainPanelsProps {
  form: ContentFormState;
  contentTypes: TypeOption[];
  stages: Array<{ slug: string; label: string }>;
  canEdit: boolean;
  onChange: <K extends keyof ContentFormState>(key: K, value: ContentFormState[K]) => void;
}

/** 主区：基本信息、正文、类型字段 */
export function EditorMainPanels({
  form,
  contentTypes,
  stages,
  canEdit,
  onChange,
}: EditorMainPanelsProps) {
  return (
    <div className="xw-editor__main">
      <section className="xw-panel">
        <div className="xw-panel__head">
          <h2 className="xw-panel__title">基本信息</h2>
        </div>
        <div className="xw-panel__body xw-form">
          <label className="xw-field">
            <span className="xw-field__label">标题</span>
            <input
              className="xw-input"
              value={form.title}
              disabled={!canEdit}
              placeholder="一条内容只讲一件事"
              onChange={(event) => onChange('title', event.target.value)}
            />
          </label>

          <label className="xw-field">
            <span className="xw-field__label">摘要</span>
            <textarea
              className="xw-textarea"
              rows={3}
              value={form.summary}
              disabled={!canEdit}
              placeholder="一到两句话说明这条内容解决什么问题"
              onChange={(event) => onChange('summary', event.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="xw-panel">
        <div className="xw-panel__head">
          <h2 className="xw-panel__title">正文</h2>
          <span className="xw-panel__count">Markdown</span>
        </div>
        <div className="xw-panel__body xw-form">
          <MarkdownEditor
            value={form.body_md}
            disabled={!canEdit}
            onChange={(value) => onChange('body_md', value)}
          />
          <span className="xw-field__hint">支持 Markdown，发布后由前台按主题样式渲染。</span>
        </div>
      </section>

      <section className="xw-panel">
        <div className="xw-panel__head">
          <h2 className="xw-panel__title">类型字段</h2>
          <span className="xw-panel__count">{typeLabel(form.type, contentTypes)}</span>
        </div>
        <div className="xw-panel__body xw-form">
          <ContentMetaFields
            type={form.type}
            stages={stages}
            form={form}
            disabled={!canEdit}
            onChange={onChange}
          />
        </div>
      </section>
    </div>
  );
}
