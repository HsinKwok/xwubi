import { useState } from 'react';
import type { TagItem } from '../../lib/content-api';
import '../../styles/tag-picker.css';

export interface TagPickerProps {
  tags: TagItem[];
  selected: string[];
  disabled?: boolean;
  canCreate: boolean;
  loading?: boolean;
  error?: string | null;
  onToggle: (id: string) => void;
  onCreate: (name: string) => Promise<boolean>;
}

export function TagPicker({
  tags,
  selected,
  disabled = false,
  canCreate,
  loading = false,
  error = null,
  onToggle,
  onCreate,
}: TagPickerProps) {
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  async function submit() {
    const trimmed = name.trim();
    if (!trimmed || creating || disabled) return;
    setCreating(true);
    const ok = await onCreate(trimmed);
    setCreating(false);
    if (ok) setName('');
  }

  return (
    <>
      <div className="xw-tags">
        {error ? (
          <span className="xw-field__hint">{error}</span>
        ) : loading ? (
          <span className="xw-field__hint">标签加载中…</span>
        ) : tags.length === 0 ? (
          <span className="xw-field__hint">还没有标签，可在下方新建。</span>
        ) : (
          tags.map((tag) => {
            const active = selected.includes(tag.id);
            return (
              <button
                type="button"
                key={tag.id}
                className={`xw-tag-chip${active ? ' is-active' : ''}`}
                aria-pressed={active}
                disabled={disabled}
                onClick={() => onToggle(tag.id)}
              >
                {tag.name}
                {typeof tag.count === 'number' && tag.count > 0 && (
                  <span className="xw-tag-chip__count">{tag.count}</span>
                )}
              </button>
            );
          })
        )}
      </div>

      {canCreate && (
        <div className="xw-tag-create">
          <input
            className="xw-input"
            value={name}
            maxLength={20}
            placeholder="新建标签名称"
            disabled={disabled || creating}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void submit();
              }
            }}
          />
          <button
            type="button"
            className="xw-btn xw-btn--ghost xw-btn--sm"
            disabled={disabled || creating || !name.trim()}
            onClick={() => void submit()}
          >
            {creating ? '创建中…' : '新建'}
          </button>
        </div>
      )}
    </>
  );
}
