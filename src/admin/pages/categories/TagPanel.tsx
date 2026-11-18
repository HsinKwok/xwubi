import { Icon } from '../../components/icons';
import type { TagItem } from '../../lib/content-api';

interface TagPanelProps {
  tags: TagItem[];
  loading: boolean;
  newTag: string;
  creatingTag: boolean;
  editingTagId: string | null;
  editTagName: string;
  savingTagId: string | null;
  deletingTagId: string | null;
  onNewTagChange: (value: string) => void;
  onCreate: () => void;
  onStartEdit: (tag: TagItem) => void;
  onEditNameChange: (value: string) => void;
  onRename: (tag: TagItem) => void;
  onCancelEdit: () => void;
  onDelete: (tag: TagItem) => void;
}

export function TagPanel({
  tags,
  loading,
  newTag,
  creatingTag,
  editingTagId,
  editTagName,
  savingTagId,
  deletingTagId,
  onNewTagChange,
  onCreate,
  onStartEdit,
  onEditNameChange,
  onRename,
  onCancelEdit,
  onDelete,
}: TagPanelProps) {
  return (
    <>
      <div className="xw-panel">
        <div className="xw-panel__head">
          <h2 className="xw-panel__title">新建标签</h2>
          <span className="xw-panel__count">{tags.length} 个</span>
        </div>
        <div className="xw-panel__body xw-form">
          <div className="xw-form__row">
            <input
              className="xw-input"
              value={newTag}
              maxLength={20}
              placeholder="标签名称，1-20 个字符"
              disabled={creatingTag}
              onChange={(event) => onNewTagChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  onCreate();
                }
              }}
            />
            <button
              type="button"
              className="xw-btn xw-btn--primary xw-btn--sm"
              disabled={creatingTag || !newTag.trim()}
              onClick={onCreate}
            >
              {creatingTag ? '创建中…' : '新建'}
            </button>
          </div>
          <span className="xw-field__hint">
            标签不区分类型，所有内容都可多选；被引用时不允许删除。
          </span>
        </div>
      </div>

      {tags.length === 0 && !loading ? (
        <div className="xw-panel">
          <div className="xw-empty">
            <Icon name="file" size={22} />
            <p>还没有标签</p>
          </div>
        </div>
      ) : (
        <div className="xw-table-wrap">
          <table className="xw-table">
            <thead>
              <tr>
                <th>名称</th>
                <th>引用</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {tags.map((tag) => {
                const editing = editingTagId === tag.id;
                return (
                  <tr key={tag.id}>
                    <td>
                      {editing ? (
                        <input
                          className="xw-input"
                          value={editTagName}
                          maxLength={20}
                          autoFocus
                          disabled={savingTagId === tag.id}
                          onChange={(event) => onEditNameChange(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              onRename(tag);
                            }
                            if (event.key === 'Escape') onCancelEdit();
                          }}
                        />
                      ) : (
                        <span className="xw-table__title">{tag.name}</span>
                      )}
                    </td>
                    <td>{tag.count ?? 0}</td>
                    <td>
                      <div className="xw-table__actions">
                        {editing ? (
                          <>
                            <button
                              type="button"
                              className="xw-btn xw-btn--primary xw-btn--sm"
                              disabled={savingTagId === tag.id || !editTagName.trim()}
                              onClick={() => onRename(tag)}
                            >
                              {savingTagId === tag.id ? '保存中…' : '保存'}
                            </button>
                            <button
                              type="button"
                              className="xw-btn xw-btn--ghost xw-btn--sm"
                              disabled={savingTagId === tag.id}
                              onClick={onCancelEdit}
                            >
                              取消
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="xw-btn xw-btn--ghost xw-btn--sm"
                              onClick={() => onStartEdit(tag)}
                            >
                              重命名
                            </button>
                            <button
                              type="button"
                              className="xw-btn xw-btn--ghost xw-btn--sm"
                              disabled={deletingTagId === tag.id || (tag.count ?? 0) > 0}
                              title={(tag.count ?? 0) > 0 ? '仍被内容引用，不能删除' : undefined}
                              onClick={() => onDelete(tag)}
                            >
                              {deletingTagId === tag.id ? '删除中…' : '删除'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
