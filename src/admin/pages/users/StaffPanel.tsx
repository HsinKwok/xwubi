import { Icon } from '../../components/icons';
import { STAFF_STATUSES, STAFF_STATUS_LABELS } from '../../lib/users-api';
import { STAFF_ROLES, ROLE_LABELS } from '../../types';
import type { AdminUser } from '../../types';
import { StaffInvitePanel } from './StaffInvitePanel';
import { StaffTable } from './StaffTable';
import { useStaffAccounts } from './use-staff-accounts';

export interface StaffPanelProps {
  user: AdminUser;
  onUnauthorized: () => void;
}

/** 员工账号管理：工具栏筛选 + 邀请 + 表格 */
export function StaffPanel({ user, onUnauthorized }: StaffPanelProps) {
  const state = useStaffAccounts({ user, onUnauthorized });
  const counts = state.data?.counts ?? {};
  const items = state.data?.items ?? [];

  return (
    <>
      <div className="xw-toolbar">
        <label className="xw-search">
          <Icon name="search" size={16} />
          <input
            type="search"
            value={state.keyword}
            placeholder="搜索姓名或邮箱"
            aria-label="搜索员工账号"
            onChange={(event) => state.setKeyword(event.target.value)}
          />
        </label>

        <select
          className="xw-select"
          aria-label="按角色筛选"
          value={state.role}
          onChange={(event) => {
            state.setRole(event.target.value);
            state.setPage(1);
          }}
        >
          <option value="">全部角色</option>
          {STAFF_ROLES.map((item) => (
            <option value={item} key={item}>
              {ROLE_LABELS[item]}（{counts[item] ?? 0}）
            </option>
          ))}
        </select>

        <select
          className="xw-select"
          aria-label="按状态筛选"
          value={state.status}
          onChange={(event) => {
            state.setStatus(event.target.value);
            state.setPage(1);
          }}
        >
          <option value="">全部状态</option>
          {STAFF_STATUSES.map((item) => (
            <option value={item} key={item}>
              {STAFF_STATUS_LABELS[item]}（{counts[item] ?? 0}）
            </option>
          ))}
        </select>

        <span className="xw-toolbar__spacer" />
        <span className="xw-toolbar__count">
          {state.loading ? '加载中…' : `账号 ${state.total} 个`}
        </span>
        <button
          type="button"
          className="xw-btn xw-btn--primary xw-btn--sm"
          onClick={() => {
            state.setCreating((open) => !open);
            state.setNotice(null);
          }}
        >
          {state.creating ? '收起表单' : '邀请员工'}
        </button>
      </div>

      {state.notice && (
        <div className={`xw-notice xw-notice--${state.notice.tone}`} role="status">
          {state.notice.text}
        </div>
      )}

      <StaffInvitePanel
        creating={state.creating}
        form={state.form}
        saving={state.saving}
        inviteLink={state.inviteLink}
        onChange={state.updateForm}
        onSubmit={state.handleInvite}
        onCancel={state.closeInvite}
        onCopyLink={state.copyInviteLink}
      />

      <StaffTable
        user={state.user}
        items={items}
        loading={state.loading}
        error={state.error}
        hasFilters={state.hasFilters}
        pendingId={state.pendingId}
        resetId={state.resetId}
        resetPassword={state.resetPassword}
        onReload={state.reload}
        onStartReset={state.startReset}
        onCancelReset={state.cancelReset}
        onResetPasswordChange={state.setResetPassword}
        onSubmitReset={state.handleResetPassword}
        onChangeRole={state.changeRole}
        onToggleStatus={state.toggleStatus}
        onResendInvite={state.handleResendInvite}
      />

      {state.total > state.perPage && (
        <div className="xw-page-foot">
          <span>
            共 {state.total} 个 · 第 {state.page} / {state.totalPages} 页
          </span>
          <div className="xw-page-foot__actions">
            <button
              type="button"
              className="xw-btn xw-btn--ghost xw-btn--sm"
              disabled={state.page <= 1}
              onClick={() => state.setPage(state.page - 1)}
            >
              上一页
            </button>
            <button
              type="button"
              className="xw-btn xw-btn--ghost xw-btn--sm"
              disabled={state.page >= state.totalPages}
              onClick={() => state.setPage(state.page + 1)}
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </>
  );
}
