import type { ExampleDraft, WubiExampleItem } from '../../lib/data-api';
import { RowActions } from './KeymapRowActions';
import { useRowEditor } from './use-row-editor';

const EMPTY_EXAMPLE_EDIT: ExampleDraft = { char: '', code: '', roots: '', note: '' };

export interface ExamplesTableProps {
  items: WubiExampleItem[];
  canWrite: boolean;
  loading: boolean;
  onUpdate: (id: string, input: ExampleDraft) => Promise<void>;
  onDelete: (item: WubiExampleItem) => Promise<void>;
}

/** 例字表：行内编辑例字、编码、拆解与备注 */
export function ExamplesTable({ items, canWrite, loading, onUpdate, onDelete }: ExamplesTableProps) {
  const { editingId, draft, savingId, deletingId, startEdit, cancelEdit, patchDraft, runSave, runDelete } =
    useRowEditor<ExampleDraft>(EMPTY_EXAMPLE_EDIT);

  return (
    <div className={`xw-table-wrap${loading ? ' is-refreshing' : ''}`}>
      <table className="xw-table">
        <thead>
          <tr>
            <th>例字</th>
            <th>编码</th>
            <th>拆解</th>
            <th>备注</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const editing = editingId === item.id;
            return (
              <tr key={item.id}>
                <td>
                  {editing ? (
                    <input
                      className="xw-input xw-keymap__key"
                      value={draft.char}
                      maxLength={1}
                      onChange={(event) => patchDraft({ char: event.target.value })}
                    />
                  ) : (
                    <span className="xw-keymap__char">{item.char}</span>
                  )}
                </td>
                <td>
                  {editing ? (
                    <input
                      className="xw-input xw-keymap__code"
                      value={draft.code}
                      maxLength={8}
                      onChange={(event) => patchDraft({ code: event.target.value.toUpperCase() })}
                    />
                  ) : (
                    <code className="xw-keymap__code-text">{item.code}</code>
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
                        char: item.char,
                        code: item.code,
                        roots: item.roots,
                        note: item.note ?? '',
                      })
                    }
                    onCancel={cancelEdit}
                    onSave={() => void runSave(item.id, () => onUpdate(item.id, draft))}
                    onDelete={() =>
                      void runDelete(item.id, `确定删除例字「${item.char}」？`, () => onDelete(item))
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
