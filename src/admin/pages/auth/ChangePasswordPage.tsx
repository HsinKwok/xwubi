import { useState } from 'react';
import type { FormEvent } from 'react';
import { postJson, resolveAdminError } from '../../lib/api';
import { AuthCard } from './AuthCard';

interface ChangePasswordPageProps {
  forced?: boolean;
  onChanged: () => void;
}

export function ChangePasswordPage({ forced = false, onChanged }: ChangePasswordPageProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    if (newPassword !== confirm) {
      setError('两次输入的新密码不一致');
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      await postJson('/api/auth/password/change', {
        current_password: currentPassword,
        new_password: newPassword,
      });

      if (forced) {
        onChanged();
        return;
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
      setNotice('密码已更新，其他设备上的登录状态已退出。');
      onChanged();
    } catch (caught) {
      setError(resolveAdminError(caught, '修改失败，请重试'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } finally {
      window.location.assign('/admin');
    }
  }

  const form = (
    <form className="xw-login__form" onSubmit={handleSubmit}>
      <label className="xw-login__field">
        <span>当前密码</span>
        <input
          type="password"
          name="current_password"
          autoComplete="current-password"
          required
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
        />
      </label>

      <label className="xw-login__field">
        <span>新密码</span>
        <input
          type="password"
          name="new_password"
          autoComplete="new-password"
          required
          minLength={8}
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
        />
      </label>

      <label className="xw-login__field">
        <span>确认新密码</span>
        <input
          type="password"
          name="confirm"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
        />
      </label>

      <p className="xw-login__desc">密码至少 8 位，需同时包含字母和数字。</p>

      {error && (
        <p className="xw-login__error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="xw-btn xw-btn--primary xw-login__submit" disabled={submitting}>
        {submitting ? '保存中…' : '保存新密码'}
      </button>
    </form>
  );

  if (forced) {
    return (
      <AuthCard
        title="请先修改初始密码"
        description="首次登录或密码被管理员重置后，需要设置新密码才能继续使用管理台。"
      >
        {form}

        <a
          className="xw-login__back"
          href="/admin"
          onClick={(event) => {
            event.preventDefault();
            void handleLogout();
          }}
        >
          退出登录
        </a>
      </AuthCard>
    );
  }

  return (
    <div className="xw-panel">
      <div className="xw-panel__head">
        <h2 className="xw-panel__title">修改密码</h2>
      </div>
      <div className="xw-panel__body">
        {notice && (
          <div className="xw-notice xw-notice--ok" role="status">
            {notice}
          </div>
        )}
        {form}
      </div>
    </div>
  );
}
