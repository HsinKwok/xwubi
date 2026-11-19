import { Icon } from '../../components/icons';
import { NoticeBar } from '../../components/NoticeBar';
import { Pager } from '../../components/Pager';
import { STAFF_STATUSES, STAFF_STATUS_LABELS } from '../../lib/users-api';
import { STAFF_ROLES, ROLE_LABELS } from '../../types';
import type { AdminUser } from '../../types';
import { StaffCreatePanel } from './StaffCreatePanel';
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
  const selectableItems = items.filter((item) => item.id !== user.id);
  const allSelected =
    selectableItems.length > 0 &&
    selectableItems.every((item) => state.selectedIds.includes(item.id));

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

        <label className="xw-check-line">
          <input
            type="checkbox"
            className="xw-check"
            checked={allSelected}
            onChange={state.toggleSelectAll}
            disabled={selectableItems.length === 0}
          />
          全选本页
        </label>

        <span className="xw-toolbar__spacer" />
        {state.selectedIds.length > 0 && (
          <button
            type="button"
            className="xw-btn xw-btn--danger xw-btn--sm"
            disabled={state.deletingBatch}
            onClick={() => void state.deleteSelected()}
          >
            {state.deletingBatch ? '删除中…' : `批量删除（${state.selectedIds.length}）`}
          </button>
        )}
        <span className="xw-toolbar__count">
          {state.loading ? '加载中…' : `账号 ${state.total} 个`}
        </span>
        <button
          type="button"
          className="xw-btn xw-btn--ghost xw-btn--sm"
          onClick={state.startInvite}
        >
          {state.creating ? '收起邀请' : '邀请员工'}
        </button>
        <button
          type="button"
          className="xw-btn xw-btn--primary xw-btn--sm"
          onClick={state.openCreate}
        >
          新建账号
        </button>
      </div>

      <NoticeBar notice={state.notice} />

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

      <StaffCreatePanel
        open={state.createOpen}
        form={state.createForm}
        saving={state.createSaving}
        onChange={state.updateCreateForm}
        onGeneratePassword={state.generateCreatePassword}
        onSubmit={state.handleCreate}
        onCancel={state.closeCreate}
      />

      <StaffTable
        user={state.user}
        items={items}
        loading={state.loading}
        error={state.error}
        hasFilters={state.hasFilters}
        pendingId={state.pendingId}
        selectedIds={state.selectedIds}
        deletingId={state.deletingId}
        onToggleSelect={state.toggleSelect}
        onDelete={state.deleteOne}
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

      <Pager
        page={state.page}
        totalPages={state.totalPages}
        total={state.total}
        unit="个"
        hideOnSinglePage
        onChange={state.setPage}
      />
    </>
  );
}
