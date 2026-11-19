import { Fragment } from 'react';
import { Icon } from '../../components/icons';
import { formatDateTime } from '../../lib/format';
import { STAFF_STATUS_LABELS } from '../../lib/users-api';
import type { StaffAccount } from '../../lib/users-api';
import { STAFF_ROLES, ROLE_LABELS } from '../../types';
import type { AdminUser, StaffRole } from '../../types';
import { statusClass } from './staff-utils';

interface StaffTableProps {
  user: AdminUser;
  items: StaffAccount[];
  loading: boolean;
  error: string | null;
  hasFilters: boolean;
  pendingId: string | null;
  selectedIds: string[];
  deletingId: string | null;
  onToggleSelect: (id: string) => void;
  onDelete: (item: StaffAccount) => void;
  resetId: string | null;
  resetPassword: string;
  onReload: () => void;
  onStartReset: (id: string) => void;
  onCancelReset: () => void;
  onResetPasswordChange: (value: string) => void;
  onSubmitReset: (item: StaffAccount) => void;
  onChangeRole: (item: StaffAccount, next: StaffRole) => void;
  onToggleStatus: (item: StaffAccount) => void;
  onResendInvite: (item: StaffAccount) => void;
}

/** 员工账号表格：角色切换、启停用、重置密码与重发邀请 */
export function StaffTable({
  user,
  items,
  loading,
  error,
  hasFilters,
  pendingId,
  selectedIds,
  deletingId,
  onToggleSelect,
  onDelete,
  resetId,
  resetPassword,
  onReload,
  onStartReset,
  onCancelReset,
  onResetPasswordChange,
  onSubmitReset,
  onChangeRole,
  onToggleStatus,
  onResendInvite,
}: StaffTableProps) {
  if (error) {
    return (
      <div className="xw-panel">
        <div className="xw-empty">
          <Icon name="users" size={22} />
          <p>{error}</p>
          <button type="button" className="xw-btn xw-btn--ghost xw-btn--sm" onClick={onReload}>
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="xw-panel">
      {!loading && items.length === 0 ? (
        <div className="xw-empty">
          <Icon name="users" size={22} />
          <p>{hasFilters ? '没有符合筛选条件的账号' : '还没有员工账号'}</p>
        </div>
      ) : (
        <div className={`xw-table-wrap${loading ? ' is-refreshing' : ''}`}>
          <table className="xw-table">
            <thead>
              <tr>
                <th scope="col" className="xw-table__check">
                  <span className="xw-table__check-box" aria-hidden="true" />
                </th>
                <th scope="col">姓名</th>
                <th scope="col">角色</th>
                <th scope="col">状态</th>
                <th scope="col">最近登录</th>
                <th scope="col">创建时间</th>
                <th scope="col" aria-label="操作" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isSelf = item.id === user.id;
                const busy = pendingId === item.id;

                return (
                  <Fragment key={item.id}>
                    <tr>
                      <td className="xw-table__check">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          disabled={isSelf}
                          aria-label={`选择 ${item.name}`}
                          onChange={() => onToggleSelect(item.id)}
                        />
                      </td>
                      <td>
                        <span className="xw-table__title">
                          {item.name}
                          {isSelf && <span className="xw-tag xw-tag--inline">当前账号</span>}
                        </span>
                        <span className="xw-table__slug">{item.email}</span>
                      </td>
                      <td>
                        <select
                          className="xw-select"
                          aria-label={`修改 ${item.name} 的角色`}
                          value={item.role}
                          disabled={busy || isSelf}
                          onChange={(event) => onChangeRole(item, event.target.value as StaffRole)}
                        >
                          {STAFF_ROLES.map((roleItem) => (
                            <option value={roleItem} key={roleItem}>
                              {ROLE_LABELS[roleItem]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <span className={`xw-status ${statusClass(item.status)}`}>
                          {STAFF_STATUS_LABELS[item.status] ?? item.status}
                        </span>
                      </td>
                      <td className="xw-table__time">
                        {formatDateTime(item.last_login_at, '从未登录')}
                      </td>
                      <td className="xw-table__time">{formatDateTime(item.created_at)}</td>
                      <td className="xw-table__action">
                        <div className="xw-table__actions">
                          {item.status === 'invited' ? (
                            <button
                              type="button"
                              className="xw-btn xw-btn--ghost xw-btn--sm"
                              disabled={busy}
                              onClick={() => onResendInvite(item)}
                            >
                              重发邀请
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="xw-btn xw-btn--ghost xw-btn--sm"
                              disabled={busy}
                              onClick={() => onStartReset(item.id)}
                            >
                              重置密码
                            </button>
                          )}
                          <button
                            type="button"
                            className="xw-btn xw-btn--ghost xw-btn--sm"
                            disabled={busy || isSelf}
                            onClick={() => onToggleStatus(item)}
                          >
                            {item.status === 'disabled' ? '启用' : '停用'}
                          </button>
                          <button
                            type="button"
                            className="xw-btn xw-btn--danger xw-btn--sm"
                            disabled={busy || isSelf || deletingId === item.id}
                            onClick={() => onDelete(item)}
                          >
                            {deletingId === item.id ? '删除中…' : '删除'}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {resetId === item.id && (
                      <tr>
                        <td colSpan={7}>
                          <div className="xw-inline-form">
                            <input
                              className="xw-input"
                              type="password"
                              value={resetPassword}
                              placeholder="新密码至少 8 位，含字母和数字"
                              aria-label={`${item.name} 的新密码`}
                              onChange={(event) => onResetPasswordChange(event.target.value)}
                            />
                            <button
                              type="button"
                              className="xw-btn xw-btn--ghost xw-btn--sm"
                              onClick={onCancelReset}
                            >
                              取消
                            </button>
                            <button
                              type="button"
                              className="xw-btn xw-btn--primary xw-btn--sm"
                              disabled={busy || resetPassword.length < 8}
                              onClick={() => onSubmitReset(item)}
                            >
                              {busy ? '重置中…' : '确认重置'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
