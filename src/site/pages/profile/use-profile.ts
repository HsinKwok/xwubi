import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { SiteConfig } from '../../../shared/site-config';
import { ApiError, deleteJson, getJson, patchJson, postJson } from '../../lib/api';
import { errorMessage } from '../../lib/format';
import type { Notice, Profile, ProfilePayload, SessionItem, TotpSetup } from './profile-types';

interface UseProfileOptions {
  labels: SiteConfig['labels'];
  onSignedOut: () => void;
  onProfileUpdated: (name: string) => void;
}

/** 个人中心的状态与请求逻辑，页面只负责渲染布局 */
export function useProfile({ labels, onSignedOut, onProfileUpdated }: UseProfileOptions) {
  const loadFailed = labels.profileLoadFailed ?? '个人资料加载失败';

  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<ProfilePayload['stats'] | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [notice, setNotice] = useState<Notice | null>(null);

  /** 所有请求失败都统一落到错误提示，避免每处重复拼装 */
  function reportError(caught: unknown, fallback: string) {
    setNotice({ tone: 'error', text: errorMessage(caught, fallback) });
  }

  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const [totpPassword, setTotpPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [totpSetup, setTotpSetup] = useState<TotpSetup | null>(null);
  const [totpBusy, setTotpBusy] = useState(false);

  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);

    Promise.all([
      getJson<ProfilePayload>('/api/profile', controller.signal),
      getJson<{ items: SessionItem[] }>('/api/profile/sessions', controller.signal),
    ])
      .then(([payload, sessionPayload]) => {
        setProfile(payload.profile);
        setStats(payload.stats);
        setName(payload.profile.name);
        setSessions(sessionPayload.items);
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        if (caught instanceof ApiError && caught.status === 401) {
          window.location.assign('/login?next=%2Fprofile');
          return;
        }
        setLoadError(errorMessage(caught, loadFailed));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [loadFailed, retryKey]);

  async function refreshSessions() {
    const payload = await getJson<{ items: SessionItem[] }>('/api/profile/sessions');
    setSessions(payload.items);
  }

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingName) return;
    setSavingName(true);
    setNotice(null);

    try {
      const payload = await patchJson<{ profile: Profile }>('/api/profile', { name: name.trim() });
      setProfile(payload.profile);
      onProfileUpdated(payload.profile.name);
      setNotice({ tone: 'ok', text: labels.profileSaved ?? '资料已保存' });
    } catch (caught) {
      reportError(caught, labels.profileSaveFailed ?? '保存失败');
    } finally {
      setSavingName(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (changingPassword) return;

    if (newPassword !== confirmPassword) {
      setNotice({ tone: 'error', text: labels.profilePasswordMismatch ?? '两次输入的新密码不一致' });
      return;
    }

    setChangingPassword(true);
    setNotice(null);

    try {
      await postJson('/api/profile/password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setProfile((current) => (current ? { ...current, must_change_password: false } : current));
      await refreshSessions();
      setNotice({ tone: 'ok', text: labels.profilePasswordChanged ?? '密码已更新，其他设备已退出登录' });
    } catch (caught) {
      reportError(caught, labels.profilePasswordFailed ?? '修改密码失败');
    } finally {
      setChangingPassword(false);
    }
  }

  async function setupTotp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (totpBusy) return;
    setTotpBusy(true);
    setNotice(null);

    try {
      const payload = await postJson<TotpSetup>('/api/profile/totp/setup', {
        password: totpPassword,
      });
      setTotpSetup(payload);
      setTotpPassword('');
      setTotpCode('');
    } catch (caught) {
      reportError(caught, labels.profileTotpSetupFailed ?? '生成密钥失败');
    } finally {
      setTotpBusy(false);
    }
  }

  async function enableTotp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (totpBusy) return;
    setTotpBusy(true);
    setNotice(null);

    try {
      await postJson('/api/profile/totp/enable', { code: totpCode });
      setProfile((current) => (current ? { ...current, totp_enabled: true } : current));
      setTotpSetup(null);
      setTotpCode('');
      setNotice({ tone: 'ok', text: labels.profileTotpEnabled ?? '两步验证已开启' });
    } catch (caught) {
      reportError(caught, labels.profileTotpEnableFailed ?? '启用失败');
    } finally {
      setTotpBusy(false);
    }
  }

  async function disableTotp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (totpBusy) return;
    setTotpBusy(true);
    setNotice(null);

    try {
      await postJson('/api/profile/totp/disable', { password: totpPassword });
      setProfile((current) => (current ? { ...current, totp_enabled: false } : current));
      setTotpPassword('');
      setNotice({ tone: 'ok', text: labels.profileTotpDisabled ?? '两步验证已关闭' });
    } catch (caught) {
      reportError(caught, labels.profileTotpDisableFailed ?? '关闭失败');
    } finally {
      setTotpBusy(false);
    }
  }

  function cancelTotpSetup() {
    setTotpSetup(null);
    setTotpCode('');
  }

  async function revoke(id: string) {
    if (revoking) return;
    setRevoking(id);
    setNotice(null);

    try {
      const payload = await deleteJson<{ ok: boolean; signed_out?: boolean }>(
        `/api/profile/sessions/${encodeURIComponent(id)}`,
      );
      if (payload.signed_out) {
        onSignedOut();
        return;
      }
      await refreshSessions();
      setNotice({ tone: 'ok', text: labels.profileSessionRevoked ?? '该设备已退出登录' });
    } catch (caught) {
      reportError(caught, labels.profileSessionRevokeFailed ?? '操作失败');
    } finally {
      setRevoking(null);
    }
  }

  async function revokeOthers() {
    if (revoking) return;
    setRevoking('others');
    setNotice(null);

    try {
      await deleteJson('/api/profile/sessions');
      await refreshSessions();
      setNotice({ tone: 'ok', text: labels.profileSessionsRevoked ?? '其他设备已全部退出登录' });
    } catch (caught) {
      reportError(caught, labels.profileSessionRevokeFailed ?? '操作失败');
    } finally {
      setRevoking(null);
    }
  }

  async function logout() {
    try {
      await postJson('/api/auth/logout');
    } catch {
      // 即使请求失败也回到未登录状态
    }
    onSignedOut();
  }

  return {
    profile,
    stats,
    sessions,
    loading,
    loadError,
    notice,
    retry: () => setRetryKey((key) => key + 1),
    name,
    setName,
    savingName,
    saveName,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    changingPassword,
    changePassword,
    totpPassword,
    setTotpPassword,
    totpCode,
    setTotpCode,
    totpSetup,
    totpBusy,
    setupTotp,
    enableTotp,
    disableTotp,
    cancelTotpSetup,
    revoking,
    revoke,
    revokeOthers,
    logout,
  };
}
