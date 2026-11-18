import type { FormEvent } from 'react';
import type { SiteConfig } from '../../../shared/site-config';

export function ProfileBasicForm({
  labels,
  name,
  saving,
  onNameChange,
  onSubmit,
}: {
  labels: SiteConfig['labels'];
  name: string;
  saving: boolean;
  onNameChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="site-profile__section" aria-labelledby="profile-basic">
      <h2 className="site-profile__section-title" id="profile-basic">
        {labels.profileBasicTitle ?? '基本资料'}
      </h2>
      <form className="site-form" onSubmit={onSubmit}>
        <label className="site-field">
          <span className="site-field__label">{labels.profileNickname ?? '昵称'}</span>
          <input
            type="text"
            required
            minLength={2}
            maxLength={32}
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
          />
        </label>
        <div className="site-form__actions">
          <button type="submit" className="site-btn site-btn--primary" disabled={saving}>
            {saving ? labels.profileSaving ?? '保存中…' : labels.profileSave ?? '保存'}
          </button>
        </div>
      </form>
    </section>
  );
}
