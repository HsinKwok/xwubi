import { useEffect, useState } from 'react';
import { toQueryString } from '../../../shared/query';
import { resolveAdminError } from '../../lib/api';
import { useAsyncData } from '../../lib/use-async-data';
import { useSelection } from '../../lib/use-selection';
import {
  createStaff,
  deleteStaff,
  deleteStaffBatch,
  inviteStaff,
  listStaff,
  resendStaffInvite,
  resetStaffPassword,
  updateStaff,
} from '../../lib/users-api';
import type { StaffAccount, StaffListResponse, StaffStatus } from '../../lib/users-api';
import { ROLE_LABELS } from '../../types';
import type { AdminUser, StaffRole } from '../../types';
import {
  EMPTY_CREATE_FORM,
  EMPTY_STAFF_FORM,
  randomStaffPassword,
  type StaffCreateForm,
  type StaffForm,
  type StaffNotice,
} from './staff-utils';

const PER_PAGE = 20;

interface UseStaffAccountsOptions {
  user: AdminUser;
  onUnauthorized: () => void;
}

/** 员工账号列表的筛选、邀请与行内操作状态 */
export function useStaffAccounts({ user, onUnauthorized }: UseStaffAccountsOptions) {
  const [keyword, setKeyword] = useState('');
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState<StaffNotice | null>(null);

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<StaffForm>(EMPTY_STAFF_FORM);
  const [saving, setSaving] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<StaffCreateForm>(EMPTY_CREATE_FORM);
  const [createSaving, setCreateSaving] = useState(false);

  const [pendingId, setPendingId] = useState<string | null>(null);
  const [resetId, setResetId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingBatch, setDeletingBatch] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(keyword.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [keyword]);

  const filters = {
    q: query || undefined,
    role: role || undefined,
    status: status || undefined,
    page,
    per_page: PER_PAGE,
  };
  const queryKey = toQueryString(filters);
  const { data, loading, error, reload } = useAsyncData<StaffListResponse>(
    (signal) => listStaff(filters, signal),
    {
      queryKey,
      fallback: '账号列表加载失败',
      onUnauthorized,
    },
  );

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const { selectedIds, toggleSelect, toggleSelectAll, clearSelection, deselect } = useSelection(
    items,
    { resetKey: queryKey, excludeIds: [user.id] },
  );

  useEffect(() => {
    if (!loading && page > 1 && items.length === 0 && total > 0) {
      setPage((previous) => Math.max(1, previous - 1));
    }
  }, [loading, page, items.length, total]);

  function updateForm(patch: Partial<StaffForm>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function handleError(caught: unknown) {
    const message = resolveAdminError(caught, '操作失败，请重试', onUnauthorized);
    if (!message) return;
    setNotice({ tone: 'error', text: message });
  }

  function resetForm() {
    setForm(EMPTY_STAFF_FORM);
  }

  function closeInvite() {
    setCreating(false);
    resetForm();
  }

  function showInviteResult(result: { invite_url: string; mail: { sent: boolean } }, name: string) {
    setInviteLink(result.invite_url);
    setNotice({
      tone: 'ok',
      text: result.mail.sent
        ? `邀请邮件已发送给 ${name}，账号将在对方设置密码后启用。`
        : `邀请已生成，但邮件未发送（未配置邮件服务），请复制下方链接转交给 ${name}。`,
    });
  }

  async function handleInvite() {
    if (saving) return;
    setSaving(true);
    setNotice(null);
    setInviteLink('');

    try {
      const result = await inviteStaff({
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
      });
      showInviteResult(result, form.name.trim());
      setCreating(false);
      resetForm();
      reload();
    } catch (caught) {
      handleError(caught);
    } finally {
      setSaving(false);
    }
  }

  function startInvite() {
    setCreateOpen(false);
    setNotice(null);
    setCreating((open) => !open);
  }

  function openCreate() {
    setCreating(false);
    setInviteLink('');
    setNotice(null);
    setCreateForm(EMPTY_CREATE_FORM);
    setCreateOpen(true);
  }

  function closeCreate() {
    setCreateOpen(false);
    setCreateForm(EMPTY_CREATE_FORM);
  }

  function updateCreateForm(patch: Partial<StaffCreateForm>) {
    setCreateForm((current) => ({ ...current, ...patch }));
  }

  function generateCreatePassword() {
    setCreateForm((current) => ({ ...current, password: randomStaffPassword() }));
  }

  async function handleCreate() {
    if (createSaving) return;

    const name = createForm.name.trim();
    const email = createForm.email.trim();
    const password = createForm.password;

    setCreateSaving(true);
    setNotice(null);

    try {
      await createStaff({ name, email, role: createForm.role, password });
      setNotice({
        tone: 'ok',
        text: `已创建 ${name}（${email}）的账号，初始密码：${password}。对方首次登录需修改密码。`,
      });
      setCreateOpen(false);
      setCreateForm(EMPTY_CREATE_FORM);
      reload();
    } catch (caught) {
      handleError(caught);
    } finally {
      setCreateSaving(false);
    }
  }

  async function handleResendInvite(item: StaffAccount) {
    if (pendingId) return;
    setPendingId(item.id);
    setNotice(null);
    setInviteLink('');

    try {
      const result = await resendStaffInvite(item.id);
      showInviteResult(result, item.name);
      reload();
    } catch (caught) {
      handleError(caught);
    } finally {
      setPendingId(null);
    }
  }

  async function copyInviteLink() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setNotice({ tone: 'ok', text: '邀请链接已复制，可直接发送给受邀人。' });
    } catch {
      setNotice({ tone: 'error', text: '复制失败，请手动选中链接复制。' });
    }
  }

  async function changeRole(item: StaffAccount, next: StaffRole) {
    if (pendingId || next === item.role) return;
    setPendingId(item.id);
    setNotice(null);

    try {
      await updateStaff(item.id, { role: next });
      setNotice({ tone: 'ok', text: `${item.name} 的角色已改为${ROLE_LABELS[next]}。` });
      reload();
    } catch (caught) {
      handleError(caught);
    } finally {
      setPendingId(null);
    }
  }

  async function toggleStatus(item: StaffAccount) {
    if (pendingId) return;
    const next: StaffStatus = item.status === 'disabled' ? 'active' : 'disabled';
    if (next === 'disabled' && !window.confirm(`确定停用 ${item.name} 的账号？停用后会立即退出登录。`)) {
      return;
    }

    setPendingId(item.id);
    setNotice(null);

    try {
      await updateStaff(item.id, { status: next });
      setNotice({
        tone: 'ok',
        text: `已${next === 'disabled' ? '停用' : '启用'} ${item.name} 的账号。`,
      });
      reload();
    } catch (caught) {
      handleError(caught);
    } finally {
      setPendingId(null);
    }
  }

  function startReset(id: string) {
    setResetId(resetId === id ? null : id);
    setResetPassword('');
    setNotice(null);
  }

  function cancelReset() {
    setResetId(null);
    setResetPassword('');
  }

  async function handleResetPassword(item: StaffAccount) {
    if (pendingId) return;
    setPendingId(item.id);
    setNotice(null);

    try {
      await resetStaffPassword(item.id, resetPassword);
      setNotice({ tone: 'ok', text: `已重置 ${item.name} 的密码，请转交新密码。` });
      setResetId(null);
      setResetPassword('');
      reload();
    } catch (caught) {
      handleError(caught);
    } finally {
      setPendingId(null);
    }
  }

  async function deleteOne(item: StaffAccount) {
    if (deletingId || deletingBatch || item.id === user.id) return;
    if (!window.confirm(`确定删除 ${item.name}（${item.email}）的账号？删除后无法恢复。`)) return;

    setDeletingId(item.id);
    setNotice(null);
    try {
      await deleteStaff(item.id);
      deselect(item.id);
      setNotice({ tone: 'ok', text: `已删除 ${item.name} 的账号。` });
      reload();
    } catch (caught) {
      handleError(caught);
    } finally {
      setDeletingId(null);
    }
  }

  async function deleteSelected() {
    if (deletingId || deletingBatch || selectedIds.length === 0) return;
    if (
      !window.confirm(
        `确定删除选中的 ${selectedIds.length} 个账号？\n删除后无法恢复，这些账号将立即失去后台访问权限。`,
      )
    ) {
      return;
    }

    setDeletingBatch(true);
    setNotice(null);
    try {
      const payload = await deleteStaffBatch(selectedIds);
      clearSelection();
      setNotice({ tone: 'ok', text: `已删除 ${payload.deleted} 个账号。` });
      reload();
    } catch (caught) {
      handleError(caught);
    } finally {
      setDeletingBatch(false);
    }
  }

  return {
    user,
    keyword,
    setKeyword,
    query,
    role,
    setRole,
    status,
    setStatus,
    page,
    setPage,
    notice,
    setNotice,
    data,
    loading,
    error,
    reload,
    creating,
    setCreating,
    form,
    updateForm,
    saving,
    inviteLink,
    copyInviteLink,
    handleInvite,
    closeInvite,
    startInvite,
    createOpen,
    createForm,
    createSaving,
    openCreate,
    closeCreate,
    updateCreateForm,
    generateCreatePassword,
    handleCreate,
    pendingId,
    resetId,
    resetPassword,
    setResetPassword,
    startReset,
    cancelReset,
    handleResetPassword,
    handleResendInvite,
    changeRole,
    toggleStatus,
    total,
    totalPages,
    perPage: PER_PAGE,
    hasFilters: Boolean(query || role || status),
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    deletingId,
    deletingBatch,
    deleteOne,
    deleteSelected,
  };
}
