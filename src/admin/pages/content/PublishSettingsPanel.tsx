import type { ContentFormState } from './content-form';
import type { TypeOption } from './content-meta';
import { contentVersionOptions } from '../../lib/versions';
import type { AdminUser } from '../../types';

export interface PublishSettingsPanelProps {
  form: ContentFormState;
  contentTypes: TypeOption[];
  canEdit: boolean;
  /** 已有内容不允许再改类型 */
  isEditing: boolean;
  role: AdminUser['role'];
  onChange: <K extends keyof ContentFormState>(key: K, value: ContentFormState[K]) => void;
  onChangeType: (next: string) => void;
}

export function PublishSettingsPanel({
  form,
  contentTypes,
  canEdit,
  isEditing,
  role,
  onChange,
  onChangeType,
}: PublishSettingsPanelProps) {
  return (
    <section className="xw-panel">
      <div className="xw-panel__head">
        <h2 className="xw-panel__title">发布设置</h2>
      </div>
      <div className="xw-panel__body xw-form">
        <label className="xw-field">
          <span className="xw-field__label">内容类型</span>
          <select
            className="xw-select xw-select--block"
            value={form.type}
            disabled={!canEdit || isEditing || role === 'ops'}
            onChange={(event) => onChangeType(event.target.value)}
          >
            {contentTypes.map((type) => (
              <option value={type.slug} key={type.slug}>
                {type.label}
              </option>
            ))}
          </select>
          <span className="xw-field__hint">
            {isEditing ? '创建后不可更改类型。' : '类型决定前台归属与发布校验。'}
          </span>
        </label>

        <label className="xw-field">
          <span className="xw-field__label">码表版本</span>
          <select
            className="xw-select xw-select--block"
            value={form.version}
            disabled={!canEdit}
            onChange={(event) => onChange('version', event.target.value)}
          >
            {form.version && !contentVersionOptions().some((item) => item.value === form.version) ? (
              <option value={form.version}>{`${form.version.toUpperCase()}（已下线）`}</option>
            ) : null}
            {contentVersionOptions().map((item) => (
              <option value={item.value} key={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="xw-field">
          <span className="xw-field__label">Slug</span>
          <input
            className="xw-input"
            value={form.slug}
            disabled={!canEdit}
            placeholder="留空自动生成"
            onChange={(event) => onChange('slug', event.target.value)}
          />
          <span className="xw-field__hint">同一类型与版本下唯一，发布后即为前台地址。</span>
        </label>

        <label className="xw-field">
          <span className="xw-field__label">排序权重</span>
          <input
            className="xw-input"
            type="number"
            value={form.sort_order}
            disabled={!canEdit}
            onChange={(event) => onChange('sort_order', event.target.value)}
          />
          <span className="xw-field__hint">数值越大越靠前，默认 0。</span>
        </label>
      </div>
    </section>
  );
}
