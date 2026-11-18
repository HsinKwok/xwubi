import { useState } from 'react';
import type { FormEvent } from 'react';
import { postJson, resolveAdminError } from '../../lib/api';
import { AuthCard } from './AuthCard';

export function ResetPasswordPage() {
  const [token] = useState(() => new URLSearchParams(window.location.search).get('token') ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

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
      await postJson('/api/auth/password/reset', { token, password });
      setDone(true);
    } catch (caught) {
      setError(resolveAdminError(caught, '重置失败，请重试'));
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <AuthCard title="重置链接无效" description="链接缺少重置凭证，请重新申请找回密码。">
        <a className="xw-login__back" href="/admin/forgot-password">
          重新申请
        </a>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard title="密码已重置" description="新密码已生效，其他设备上的登录状态已全部退出。">
        <a className="xw-btn xw-btn--primary xw-login__submit" href="/admin">
          进入管理台
        </a>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="设置新密码" description="密码至少 8 位，需同时包含字母和数字。">
      <form className="xw-login__form" onSubmit={handleSubmit}>
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

        {error && (
          <p className="xw-login__error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="xw-btn xw-btn--primary xw-login__submit" disabled={submitting}>
          {submitting ? '提交中…' : '确认重置'}
        </button>
      </form>

      <a className="xw-login__back" href="/admin">
        返回登录
      </a>
    </AuthCard>
  );
}
