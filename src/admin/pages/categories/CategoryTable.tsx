import { Icon } from '../../components/icons';
import type { CategoryDomain, CategoryItem } from '../../lib/categories-api';
import { DOMAIN_META, formatDate } from './category-config';

interface CategoryTableProps {
  domain: CategoryDomain;
  rows: CategoryItem[];
  loading: boolean;
  saving: boolean;
  deletingId: string | null;
  onStartCreate: (domain: CategoryDomain) => void;
  onEdit: (item: CategoryItem) => void;
  onDelete: (item: CategoryItem) => void;
}

export function CategoryTable({
  domain,
  rows,
  loading,
  saving,
  deletingId,
  onStartCreate,
  onEdit,
  onDelete,
}: CategoryTableProps) {
  const meta = DOMAIN_META[domain];

  return (
    <section>
      <div className="xw-toolbar">
        <div>
          <h2 className="xw-panel__title">{meta.label}</h2>
          <p className="xw-field__hint">{meta.desc}</p>
        </div>
        <span className="xw-toolbar__spacer" />
        <span className="xw-toolbar__count">
          {loading ? '加载中…' : `共 ${rows.length} 项`}
        </span>
        <button
          type="button"
          className="xw-btn xw-btn--primary xw-btn--sm"
          onClick={() => onStartCreate(domain)}
        >
          新建{meta.label}
        </button>
      </div>

      {rows.length === 0 && !loading ? (
        <div className="xw-empty">
          <Icon name="grid" size={22} />
          <p>还没有{meta.label}</p>
        </div>
      ) : (
        <div className="xw-table-wrap">
          <table className="xw-table">
            <thead>
              <tr>
                <th>名称</th>
                <th>标识</th>
                {domain === 'content_type' && <th>前台路径</th>}
                {domain === 'keymap_zone' && <th>键位</th>}
                <th>{domain === 'keymap_version' ? '备注' : '提示'}</th>
                <th>引用</th>
                <th>排序</th>
                <th>更新时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className="xw-table__title">{item.label}</span>
                  </td>
                  <td>{item.slug}</td>
                  {domain === 'content_type' && <td>{item.route || '—'}</td>}
                  {domain === 'keymap_zone' && <td>{item.key_list || '—'}</td>}
                  <td>{item.hint || '—'}</td>
                  <td>{item.count ?? 0}</td>
                  <td>{item.sort_order}</td>
                  <td>{formatDate(item.updated_at)}</td>
                  <td>
                    <div className="xw-table__actions">
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
                        className="xw-btn xw-btn--ghost xw-btn--sm"
                        disabled={deletingId === item.id || (item.count ?? 0) > 0}
                        title={(item.count ?? 0) > 0 ? '仍被引用，不能删除' : undefined}
                        onClick={() => onDelete(item)}
                      >
                        {deletingId === item.id ? '删除中…' : '删除'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
