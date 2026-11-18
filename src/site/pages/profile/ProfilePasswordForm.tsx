import type { FormEvent } from 'react';
import type { SiteConfig } from '../../../shared/site-config';

export function ProfilePasswordForm({
  labels,
  currentPassword,
  newPassword,
  confirmPassword,
  busy,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
}: {
  labels: SiteConfig['labels'];
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  busy: boolean;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="site-profile__section" aria-labelledby="profile-password">
      <h2 className="site-profile__section-title" id="profile-password">
        {labels.profilePasswordTitle ?? '修改密码'}
      </h2>
      <form className="site-form" onSubmit={onSubmit}>
        <div className="site-form__row">
          <label className="site-field">
            <span className="site-field__label">{labels.profileCurrentPassword ?? '当前密码'}</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => onCurrentPasswordChange(event.target.value)}
            />
          </label>
          <label className="site-field">
            <span className="site-field__label">{labels.profileNewPassword ?? '新密码'}</span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => onNewPasswordChange(event.target.value)}
            />
          </label>
          <label className="site-field">
            <span className="site-field__label">{labels.profileConfirmPassword ?? '确认新密码'}</span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => onConfirmPasswordChange(event.target.value)}
            />
          </label>
        </div>
        <div className="site-form__actions">
          <button type="submit" className="site-btn site-btn--primary" disabled={busy}>
            {busy
              ? labels.profilePasswordSubmitting ?? '更新中…'
              : labels.profilePasswordAction ?? '更新密码'}
          </button>
        </div>
      </form>
    </section>
  );
}
