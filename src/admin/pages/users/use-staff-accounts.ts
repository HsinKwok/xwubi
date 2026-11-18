import { useEffect, useState } from 'react';
import { toQueryString } from '../../../shared/query';
import { resolveAdminError } from '../../lib/api';
import { useAsyncData } from '../../lib/use-async-data';
import {
  inviteStaff,
  listStaff,
  resendStaffInvite,
  resetStaffPassword,
  updateStaff,
} from '../../lib/users-api';
import type { StaffAccount, StaffListResponse, StaffStatus } from '../../lib/users-api';
import { ROLE_LABELS } from '../../types';
import type { AdminUser, StaffRole } from '../../types';
import { EMPTY_STAFF_FORM, type StaffForm, type StaffNotice } from './staff-utils';

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

  const [pendingId, setPendingId] = useState<string | null>(null);
  const [resetId, setResetId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState('');

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
  const { data, loading, error, reload } = useAsyncData<StaffListResponse>(
    (signal) => listStaff(filters, signal),
    {
      queryKey: toQueryString(filters),
      fallback: '账号列表加载失败',
      onUnauthorized,
    },
  );

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

  const total = data?.total ?? 0;

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
    totalPages: Math.max(1, Math.ceil(total / PER_PAGE)),
    perPage: PER_PAGE,
    hasFilters: Boolean(query || role || status),
  };
}
