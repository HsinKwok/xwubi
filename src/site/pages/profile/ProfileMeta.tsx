import type { SiteConfig } from '../../../shared/site-config';
import { formatTime } from '../../lib/format';
import type { Profile, ProfilePayload } from './profile-types';
import { ROLE_FALLBACKS } from './profile-types';

export function ProfileMeta({
  labels,
  profile,
  stats,
}: {
  labels: SiteConfig['labels'];
  profile: Profile;
  stats: ProfilePayload['stats'] | null;
}) {
  return (
    <div className="site-profile__meta">
      <div>
        <span className="site-status__label">{labels.profileEmail ?? '邮箱'}</span>
        <p className="site-profile__meta-value">{profile.email}</p>
      </div>
      <div>
        <span className="site-status__label">{labels.profileRole ?? '角色'}</span>
        <p className="site-profile__meta-value">
          {labels[`role_${profile.role}`] ?? ROLE_FALLBACKS[profile.role] ?? profile.role}
        </p>
      </div>
      <div>
        <span className="site-status__label">{labels.profileStats ?? '内容'}</span>
        <p className="site-profile__meta-value">
          {stats?.content ?? 0} {labels.countUnit ?? '条'}
          {stats && stats.published > 0 ? ` · 已发布 ${stats.published}` : ''}
        </p>
      </div>
      <div>
        <span className="site-status__label">{labels.profileLastLogin ?? '上次登录'}</span>
        <p className="site-profile__meta-value">{formatTime(profile.last_login_at) || '—'}</p>
      </div>
    </div>
  );
}
