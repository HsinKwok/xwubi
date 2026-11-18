import type { SiteConfig } from '../../../shared/site-config';
import { formatTime } from '../../lib/format';
import type { SessionItem } from './profile-types';
import { deviceLabel } from './profile-types';

export function ProfileSessionsSection({
  labels,
  sessions,
  revoking,
  onRevoke,
  onRevokeOthers,
  onLogout,
}: {
  labels: SiteConfig['labels'];
  sessions: SessionItem[];
  revoking: string | null;
  onRevoke: (id: string) => void;
  onRevokeOthers: () => void;
  onLogout: () => void;
}) {
  return (
    <section className="site-profile__section" aria-labelledby="profile-sessions">
      <h2 className="site-profile__section-title" id="profile-sessions">
        {labels.profileSessionsTitle ?? '登录设备'}
      </h2>

      <ul className="site-session-list">
        {sessions.map((item) => (
          <li className="site-session" key={item.id}>
            <div className="site-session__main">
              <p className="site-session__device">
                {deviceLabel(item.user_agent)}
                {item.current && (
                  <span className="site-session__current">
                    {labels.profileSessionCurrent ?? '当前设备'}
                  </span>
                )}
              </p>
              <p className="site-session__meta">
                {item.ip ?? '—'} · {formatTime(item.created_at)}
              </p>
            </div>
            {!item.current && (
              <button
                type="button"
                className="site-btn site-btn--text"
                disabled={revoking !== null}
                onClick={() => onRevoke(item.id)}
              >
                {labels.profileSessionRevoke ?? '退出登录'}
              </button>
            )}
          </li>
        ))}
      </ul>

      <div className="site-form__actions">
        <button
          type="button"
          className="site-btn site-btn--ghost"
          disabled={revoking !== null || sessions.length <= 1}
          onClick={onRevokeOthers}
        >
          {labels.profileSessionsRevokeOthers ?? '退出其他设备'}
        </button>
        <button type="button" className="site-btn site-btn--text" onClick={onLogout}>
          {labels.logout ?? '退出登录'}
        </button>
      </div>
    </section>
  );
}
