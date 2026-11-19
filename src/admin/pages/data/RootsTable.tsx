import type { RootDraft, WubiRootItem } from '../../lib/data-api';
import { versionLabel } from '../../lib/versions';
import { RowActions } from './KeymapRowActions';
import { useRowEditor } from './use-row-editor';

const EMPTY_ROOT_EDIT: RootDraft = { key: '', mnemonic: '', roots: '', note: '' };

export interface RootsTableProps {
  items: WubiRootItem[];
  canWrite: boolean;
  loading: boolean;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onUpdate: (id: string, input: RootDraft) => Promise<void>;
  onDelete: (item: WubiRootItem) => Promise<void>;
}

/** 字根表：行内编辑键位、口诀、字根与备注 */
export function RootsTable({
  items,
  canWrite,
  loading,
  selectedIds,
  onToggleSelect,
  onUpdate,
  onDelete,
}: RootsTableProps) {
  const { editingId, draft, savingId, deletingId, startEdit, cancelEdit, patchDraft, runSave, runDelete } =
    useRowEditor<RootDraft>(EMPTY_ROOT_EDIT);

  return (
    <div className={`xw-table-wrap${loading ? ' is-refreshing' : ''}`}>
      <table className="xw-table">
        <thead>
          <tr>
            <th className="xw-table__check">
              <span className="xw-table__check-box" aria-hidden="true" />
            </th>
            <th>键位</th>
            <th>口诀</th>
            <th>字根</th>
            <th>备注</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const editing = editingId === item.id;
            return (
              <tr key={item.id}>
                <td className="xw-table__check">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => onToggleSelect(item.id)}
                    aria-label={`选择 ${item.key} 键字根`}
                  />
                </td>
                <td>
                  {editing ? (
                    <input
                      className="xw-input xw-keymap__key"
                      value={draft.key}
                      maxLength={1}
                      onChange={(event) => patchDraft({ key: event.target.value.toUpperCase() })}
                    />
                  ) : (
                    <span className="xw-keymap__key-badge">{item.key}</span>
                  )}
                </td>
                <td>
                  {editing ? (
                    <input
                      className="xw-input"
                      value={draft.mnemonic}
                      onChange={(event) => patchDraft({ mnemonic: event.target.value })}
                    />
                  ) : (
                    item.mnemonic || '—'
                  )}
                </td>
                <td>
                  {editing ? (
                    <input
                      className="xw-input"
                      value={draft.roots}
                      onChange={(event) => patchDraft({ roots: event.target.value })}
                    />
                  ) : (
                    item.roots || '—'
                  )}
                </td>
                <td>
                  {editing ? (
                    <input
                      className="xw-input"
                      value={draft.note}
                      onChange={(event) => patchDraft({ note: event.target.value })}
                    />
                  ) : (
                    item.note || '—'
                  )}
                </td>
                <td>
                  <RowActions
                    canWrite={canWrite}
                    editing={editing}
                    saving={savingId === item.id}
                    deleting={deletingId === item.id}
                    onEdit={() =>
                      startEdit(item.id, {
                        key: item.key,
                        mnemonic: item.mnemonic,
                        roots: item.roots,
                        note: item.note ?? '',
                      })
                    }
                    onCancel={cancelEdit}
                    onSave={() => void runSave(item.id, () => onUpdate(item.id, draft))}
                    onDelete={() =>
                      void runDelete(
                        item.id,
                        `确定删除 ${versionLabel(item.version)}的 ${item.key} 键字根？`,
                        () => onDelete(item),
                      )
                    }
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
