import type { ChangeEvent } from 'react';
import type { ContentType } from '../../lib/content-api';
import { PLATFORM_SUGGESTIONS } from './content-meta';
import type { ContentFormState } from './content-form';

export interface ContentMetaFieldsProps {
  type: ContentType;
  stages: Array<{ slug: string; label: string }>;
  form: ContentFormState;
  disabled: boolean;
  onChange: <K extends keyof ContentFormState>(key: K, value: ContentFormState[K]) => void;
}

export function ContentMetaFields({ type, stages, form, disabled, onChange }: ContentMetaFieldsProps) {
  function bind<K extends keyof ContentFormState>(key: K) {
    return {
      value: form[key],
      disabled,
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        onChange(key, event.target.value as ContentFormState[K]),
    };
  }

  if (type === 'lesson') {
    return (
      <>
        <div className="xw-form__row">
          <label className="xw-field">
            <span className="xw-field__label">教学阶段</span>
            <select
              className="xw-select"
              value={form.stage}
              disabled={disabled}
              onChange={(event) => onChange('stage', event.target.value)}
            >
              <option value="">未指定阶段</option>
              {stages.map((stage) => (
                <option value={stage.slug} key={stage.slug}>
                  {stage.label}
                </option>
              ))}
            </select>
            <span className="xw-field__hint">阶段由「分类与标签」统一维护，前台筛选同源</span>
          </label>

          <label className="xw-field">
            <span className="xw-field__label">课时序号</span>
            <input className="xw-input" type="number" min={1} placeholder="1" {...bind('lesson_no')} />
          </label>
        </div>

        <label className="xw-field">
          <span className="xw-field__label">例字</span>
          <textarea
            className="xw-textarea"
            rows={4}
            placeholder={'我\n的\n一'}
            {...bind('examples')}
          />
          <span className="xw-field__hint">每行一个例字，发布前至少需要 3 条。</span>
        </label>

        <label className="xw-field">
          <span className="xw-field__label">建议时长（分钟）</span>
          <input className="xw-input" type="number" min={1} placeholder="15" {...bind('duration_min')} />
        </label>
      </>
    );
  }

  if (type === 'news') {
    return (
      <>
        <label className="xw-field">
          <span className="xw-field__label">原文链接</span>
          <input
            className="xw-input"
            type="url"
            placeholder="https://example.com/post"
            {...bind('source_url')}
          />
          <span className="xw-field__hint">发布前必填，前台会展示原文入口。</span>
        </label>

        <label className="xw-field">
          <span className="xw-field__label">来源名称</span>
          <input className="xw-input" placeholder="例如：xwubi 编辑" {...bind('source_name')} />
        </label>
      </>
    );
  }

  if (type === 'software') {
    return (
      <>
        <label className="xw-field">
          <span className="xw-field__label">支持平台</span>
          <textarea
            className="xw-textarea"
            rows={3}
            placeholder={PLATFORM_SUGGESTIONS.join('\n')}
            {...bind('platforms')}
          />
          <span className="xw-field__hint">每行一个平台，发布前至少需要一个。</span>
        </label>

        <div className="xw-form__row">
          <label className="xw-field">
            <span className="xw-field__label">授权方式</span>
            <input className="xw-input" placeholder="free / paid / trial" {...bind('license')} />
          </label>

          <label className="xw-field">
            <span className="xw-field__label">官网地址</span>
            <input className="xw-input" type="url" placeholder="https://example.com" {...bind('official_url')} />
          </label>
        </div>
      </>
    );
  }

  if (type === 'tool') {
    return (
      <label className="xw-field">
        <span className="xw-field__label">工具形式</span>
        <input className="xw-input" placeholder="web / desktop" {...bind('format')} />
      </label>
    );
  }

  // 自定义内容类型只使用通用字段
  return null;
}
