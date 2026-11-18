import type { FormEvent } from 'react';
import type { SiteConfig } from '../../../shared/site-config';
import type { TotpSetup } from './profile-types';
import { spacedSecret } from './profile-types';

export function ProfileTotpSection({
  labels,
  enabled,
  setup,
  password,
  code,
  busy,
  onPasswordChange,
  onCodeChange,
  onSetup,
  onEnable,
  onDisable,
  onCancel,
}: {
  labels: SiteConfig['labels'];
  enabled: boolean;
  setup: TotpSetup | null;
  password: string;
  code: string;
  busy: boolean;
  onPasswordChange: (value: string) => void;
  onCodeChange: (value: string) => void;
  onSetup: (event: FormEvent<HTMLFormElement>) => void;
  onEnable: (event: FormEvent<HTMLFormElement>) => void;
  onDisable: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  return (
    <section className="site-profile__section" aria-labelledby="profile-totp">
      <h2 className="site-profile__section-title" id="profile-totp">
        {labels.profileTotpTitle ?? '两步验证'}
      </h2>

      {enabled ? (
        <form className="site-form" onSubmit={onDisable}>
          <p className="site-profile__hint">
            {labels.profileTotpOnHint ?? '两步验证已开启，登录时需要输入验证器中的 6 位验证码。'}
          </p>
          <label className="site-field">
            <span className="site-field__label">{labels.profileCurrentPassword ?? '当前密码'}</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
            />
          </label>
          <div className="site-form__actions">
            <button type="submit" className="site-btn site-btn--ghost" disabled={busy}>
              {labels.profileTotpDisable ?? '关闭两步验证'}
            </button>
          </div>
        </form>
      ) : setup ? (
        <form className="site-form" onSubmit={onEnable}>
          <p className="site-profile__hint">
            {labels.profileTotpScanHint ??
              '在身份验证器中手动添加以下密钥（类型：基于时间），然后输入生成的 6 位验证码。'}
          </p>
          <div className="site-profile__secret">
            <code>{spacedSecret(setup.secret)}</code>
          </div>
          <p className="site-profile__hint site-profile__hint--mono">{setup.otpauth_url}</p>
          <label className="site-field">
            <span className="site-field__label">{labels.profileTotpCode ?? '6 位验证码'}</span>
            <input
              type="text"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) => onCodeChange(event.target.value)}
            />
          </label>
          <div className="site-form__actions">
            <button type="submit" className="site-btn site-btn--primary" disabled={busy}>
              {labels.profileTotpEnable ?? '启用两步验证'}
            </button>
            <button type="button" className="site-btn site-btn--text" onClick={onCancel}>
              {labels.close ?? '关闭'}
            </button>
          </div>
        </form>
      ) : (
        <form className="site-form" onSubmit={onSetup}>
          <p className="site-profile__hint">
            {labels.profileTotpOffHint ??
              '两步验证尚未开启。开启后登录需要额外输入验证器生成的验证码。'}
          </p>
          <label className="site-field">
            <span className="site-field__label">{labels.profileCurrentPassword ?? '当前密码'}</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
            />
          </label>
          <div className="site-form__actions">
            <button type="submit" className="site-btn site-btn--primary" disabled={busy}>
              {labels.profileTotpSetup ?? '生成密钥'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
