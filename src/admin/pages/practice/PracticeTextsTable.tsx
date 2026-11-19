import { Pager } from '../../components/Pager';
import { formatStamp } from '../../lib/format';
import type { PracticeTextSummary } from '../../lib/practice-api';

interface PracticeTextsTableProps {
  items: PracticeTextSummary[];
  loading: boolean;
  canWrite: boolean;
  saving: boolean;
  deletingId: string | null;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  pageStart: number;
  currentPage: number;
  totalPages: number;
  total: number;
  genreLabel: (slug: string) => string;
  onEdit: (item: PracticeTextSummary) => void;
  onDelete: (item: PracticeTextSummary) => void;
  onPrev: () => void;
  onNext: () => void;
}

/** 篇目列表与分页 */
export function PracticeTextsTable({
  items,
  loading,
  canWrite,
  saving,
  deletingId,
  selectedIds,
  onToggleSelect,
  pageStart,
  currentPage,
  totalPages,
  total,
  genreLabel,
  onEdit,
  onDelete,
  onPrev,
  onNext,
}: PracticeTextsTableProps) {
  return (
    <>
      <div className={`xw-table-wrap${loading ? ' is-refreshing' : ''}`}>
        <table className="xw-table">
          <thead>
            <tr>
              <th className="xw-table__check">
                <span className="xw-table__check-box" aria-hidden="true" />
              </th>
              <th>标题</th>
              <th>朝代 / 作者</th>
              <th>分类</th>
              <th>字数</th>
              <th>排序</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td className="xw-table__check">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => onToggleSelect(item.id)}
                    aria-label={`选择《${item.title}》`}
                  />
                </td>
                <td>
                  <span className="xw-table__title">{item.title}</span>
                </td>
                <td>{[item.dynasty, item.author].filter(Boolean).join(' · ') || '佚名'}</td>
                <td>{genreLabel(item.genre)}</td>
                <td>{item.char_count}</td>
                <td>{item.sort_order}</td>
                <td>{formatStamp(item.updated_at)}</td>
                <td>
                  <div className="xw-table__actions">
                    {canWrite ? (
                      <>
                        <button
                          type="button"
                          className="xw-btn xw-btn--ghost xw-btn--sm"
                          disabled={saving}
                          onClick={() => onEdit(item)}
                        >
                          编辑
                        </button>
                        <button
                          type="button"
                          className="xw-btn xw-btn--danger xw-btn--sm"
                          disabled={deletingId === item.id}
                          onClick={() => onDelete(item)}
                        >
                          {deletingId === item.id ? '删除中…' : '删除'}
                        </button>
                      </>
                    ) : (
                      <span className="xw-toolbar__count">只读</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pager
        page={currentPage}
        totalPages={totalPages}
        infoText={`第 ${pageStart + 1}-${pageStart + items.length} 条 / 共 ${total} 条`}
        onChange={(next) => (next < currentPage ? onPrev() : onNext())}
      />
    </>
  );
}
