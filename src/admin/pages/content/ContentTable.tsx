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
  go: (event: ReactMouseEvent<HTMLAnchorElement>, href: string) => void;
}

/** 内容列表表格：标题、类型、版本、状态与编辑入口 */
export function ContentTable({ items, loading, contentTypes, emptyText, go }: Props) {
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
                <a
                  className="xw-table__link"
                  href={`/admin/content/${item.id}`}
                  onClick={(event) => go(event, `/admin/content/${item.id}`)}
                >
                  编辑
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
