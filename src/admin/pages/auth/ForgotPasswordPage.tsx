import { useState } from 'react';
import type { FormEvent } from 'react';
import { postJson, resolveAdminError } from '../../lib/api';
import { AuthCard } from './AuthCard';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      await postJson('/api/auth/password/reset-request', { email: email.trim() });
      setDone(true);
    } catch (caught) {
      setError(resolveAdminError(caught, '发送失败，请重试'));
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <AuthCard
        title="请查收邮件"
        description="如果该邮箱对应启用中的员工账号，我们已发送重置密码邮件，链接 30 分钟内有效。"
      >
        <a className="xw-login__back" href="/admin">
          返回登录
        </a>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="找回密码" description="填写员工邮箱，我们会发送重置密码的链接。">
      <form className="xw-login__form" onSubmit={handleSubmit}>
        <label className="xw-login__field">
          <span>邮箱</span>
          <input
            type="email"
            name="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        {error && (
          <p className="xw-login__error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="xw-btn xw-btn--primary xw-login__submit" disabled={submitting}>
          {submitting ? '发送中…' : '发送重置邮件'}
        </button>
      </form>

      <a className="xw-login__back" href="/admin">
        返回登录
      </a>
    </AuthCard>
  );
}
