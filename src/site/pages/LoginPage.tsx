import { useState } from 'react';
import type { FormEvent } from 'react';
import type { SessionUser, SiteConfig } from '../../shared/site-config';
import { ApiError, postJson } from '../lib/api';
import '../styles/forms.css';
import '../styles/login.css';

export interface LoginPageProps {
  labels: SiteConfig['labels'];
  onLoggedIn: (user: SessionUser) => void;
}

export function LoginPage({ labels, onLoggedIn }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [challenge, setChallenge] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const payload = await postJson<{
        user?: SessionUser;
        totp_required?: boolean;
        challenge?: string;
      }>('/api/auth/login', {
        email: email.trim(),
        password,
      });

      if (payload.totp_required && payload.challenge) {
        setChallenge(payload.challenge);
        setSubmitting(false);
        return;
      }

      if (payload.user) onLoggedIn(payload.user);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : labels.loginFailed);
      setSubmitting(false);
    }
  }

  async function handleTotp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !challenge) return;

    setSubmitting(true);
    setError(null);

    try {
      const payload = await postJson<{ user: SessionUser }>('/api/auth/totp', {
        challenge,
        code: code.trim(),
      });
      onLoggedIn(payload.user);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : labels.loginTotpFailed ?? '验证码校验失败');
      setSubmitting(false);
    }
  }

  return (
    <div className="site-login">
      <div className="site-login__panel">
        <h1 className="site-login__title">{labels.loginTitle}</h1>
        <p className="site-login__desc">{labels.loginDescription}</p>

        {challenge ? (
          <form className="site-login__form" onSubmit={handleTotp}>
            <p className="site-login__desc">
              {labels.loginTotpHint ?? '该账号已开启两步验证，请输入验证器中的 6 位验证码。'}
            </p>
            <label className="site-field">
              <span className="site-field__label">{labels.loginTotpCode ?? '验证码'}</span>
              <input
                type="text"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                value={code}
                onChange={(event) => setCode(event.target.value)}
              />
            </label>

            {error && <p className="site-login__error" role="alert">{error}</p>}

            <button
              type="submit"
              className="site-btn site-btn--primary site-login__submit"
              disabled={submitting}
            >
              {submitting
                ? labels.loginSubmitting
                : labels.loginTotpSubmit ?? '验证并登录'}
            </button>
            <button
              type="button"
              className="site-btn site-btn--text"
              onClick={() => {
                setChallenge(null);
                setCode('');
                setError(null);
              }}
            >
              {labels.loginTotpBack ?? '返回重新输入密码'}
            </button>
          </form>
        ) : (
          <form className="site-login__form" onSubmit={handleSubmit}>
            <label className="site-field">
              <span className="site-field__label">{labels.loginEmail}</span>
              <input
                type="email"
                name="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <label className="site-field">
              <span className="site-field__label">{labels.loginPassword}</span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            {error && <p className="site-login__error" role="alert">{error}</p>}

            <button type="submit" className="site-btn site-btn--primary site-login__submit" disabled={submitting}>
              {submitting ? labels.loginSubmitting : labels.loginSubmit}
            </button>
          </form>
        )}

        <a className="site-login__link" href="/admin/forgot-password">
          {labels.loginForgot ?? '忘记密码？'}
        </a>
      </div>
    </div>
  );
}
