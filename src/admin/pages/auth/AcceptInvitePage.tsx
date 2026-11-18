import { useState } from 'react';
import type { FormEvent } from 'react';
import { postJson, resolveAdminError } from '../../lib/api';
import type { AdminUser } from '../../types';
import { AuthCard } from './AuthCard';

export function AcceptInvitePage() {
  const [token] = useState(() => new URLSearchParams(window.location.search).get('token') ?? '');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    if (password !== confirm) {
      setError('两次输入的密码不一致');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await postJson<{ user: AdminUser }>('/api/auth/invite/accept', {
        token,
        name: name.trim() || undefined,
        password,
      });
      window.location.assign('/admin');
    } catch (caught) {
      setError(resolveAdminError(caught, '激活失败，请重试'));
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <AuthCard title="邀请链接无效" description="链接缺少邀请凭证，请向管理员重新索取邀请邮件。">
        <a className="xw-login__back" href="/admin">
          返回登录
        </a>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="激活员工账号" description="设置登录密码后，账号将立即启用并自动登录。">
      <form className="xw-login__form" onSubmit={handleSubmit}>
        <label className="xw-login__field">
          <span>昵称（可选）</span>
          <input
            type="text"
            name="name"
            autoComplete="nickname"
            maxLength={32}
            value={name}
            placeholder="保留管理员填写的姓名"
            onChange={(event) => setName(event.target.value)}
          />
        </label>

        <label className="xw-login__field">
          <span>新密码</span>
          <input
            type="password"
            name="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        <label className="xw-login__field">
          <span>确认密码</span>
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
          {submitting ? '激活中…' : '设置密码并激活'}
        </button>
      </form>

      <a className="xw-login__back" href="/admin">
        返回登录
      </a>
    </AuthCard>
  );
}
