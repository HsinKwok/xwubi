import type { MouseEvent as ReactMouseEvent } from 'react';
import { Icon } from '../../components/icons';
import { versionLabel } from '../../lib/versions';
import { formatDateTime as formatDate } from '../../lib/format';
import type { AdminContentItem } from '../../lib/content-api';
import { CONTENT_STATUS_LABELS, typeLabel } from './content-meta';

interface Props {
  items: AdminContentItem[];
  loading: boolean;
  contentTypes: { slug: string; label: string }[];
  emptyText: string;
  canWrite: boolean;
  selectedIds: string[];
  deletingId: string | null;
  go: (event: ReactMouseEvent<HTMLAnchorElement>, href: string) => void;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onDelete: (item: AdminContentItem) => void;
}

/** 内容列表表格：勾选、标题、类型、版本、状态与编辑/删除入口 */
export function ContentTable({
  items,
  loading,
  contentTypes,
  emptyText,
  canWrite,
  selectedIds,
  deletingId,
  go,
  onToggleSelect,
  onToggleSelectAll,
  onDelete,
}: Props) {
  const allSelected = items.length > 0 && items.every((item) => selectedIds.includes(item.id));

  if (!loading && items.length === 0) {
    return (
      <div className="xw-empty">
        <Icon name="file" size={22} />
        <p>{emptyText}</p>
      </div>
    );
  }

  return (
    <div className={`xw-table-wrap${loading ? ' is-refreshing' : ''}`}>
      <table className="xw-table">
        <thead>
          <tr>
            {canWrite && (
              <th scope="col" className="xw-table__check">
                <input
                  type="checkbox"
                  aria-label="全选当前页内容"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                />
              </th>
            )}
            <th scope="col">标题</th>
            <th scope="col">类型</th>
            <th scope="col">版本</th>
            <th scope="col">状态</th>
            <th scope="col">作者</th>
            <th scope="col">更新时间</th>
            <th scope="col" aria-label="操作" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              {canWrite && (
                <td className="xw-table__check">
                  <input
                    type="checkbox"
                    aria-label={`选择 ${item.title}`}
                    checked={selectedIds.includes(item.id)}
                    onChange={() => onToggleSelect(item.id)}
                  />
                </td>
              )}
              <td>
                <a
                  className="xw-table__title"
                  href={`/admin/content/${item.id}`}
                  onClick={(event) => go(event, `/admin/content/${item.id}`)}
                >
                  {item.title}
                </a>
                <span className="xw-table__slug">{item.slug}</span>
              </td>
              <td>
                <span className="xw-tag">{typeLabel(item.type, contentTypes)}</span>
              </td>
              <td>{versionLabel(item.version)}</td>
              <td>
                <span className={`xw-status xw-status--${item.status}`}>
                  {CONTENT_STATUS_LABELS[item.status]}
                </span>
              </td>
              <td>{item.author ?? '—'}</td>
              <td className="xw-table__time">{formatDate(item.updated_at)}</td>
              <td className="xw-table__action">
                <span className="xw-table__actions">
                  <a
                    className="xw-table__link"
                    href={`/admin/content/${item.id}`}
                    onClick={(event) => go(event, `/admin/content/${item.id}`)}
                  >
                    编辑
                  </a>
                  {canWrite && (
                    <button
                      type="button"
                      className="xw-table__danger"
                      disabled={deletingId === item.id}
                      onClick={() => onDelete(item)}
                    >
                      {deletingId === item.id ? '删除中…' : '删除'}
                    </button>
                  )}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
