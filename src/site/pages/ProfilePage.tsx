import type { SiteConfig } from '../../shared/site-config';
import { ErrorState, PageSkeleton } from '../components/Bits';
import { ProfileBasicForm } from './profile/ProfileBasicForm';
import { ProfileMeta } from './profile/ProfileMeta';
import { ProfilePasswordForm } from './profile/ProfilePasswordForm';
import { ProfileSessionsSection } from './profile/ProfileSessionsSection';
import { ProfileTotpSection } from './profile/ProfileTotpSection';
import { useProfile } from './profile/use-profile';
import '../styles/forms.css';
import '../styles/profile.css';

export interface ProfilePageProps {
  labels: SiteConfig['labels'];
  onSignedOut: () => void;
  onProfileUpdated: (name: string) => void;
}

export function ProfilePage({ labels, onSignedOut, onProfileUpdated }: ProfilePageProps) {
  const profileState = useProfile({ labels, onSignedOut, onProfileUpdated });
  const { profile, stats, notice } = profileState;

  if (profileState.loading) {
    return (
      <div className="site-form-page">
        <PageSkeleton rows={4} />
      </div>
    );
  }

  if (profileState.loadError || !profile) {
    return (
      <div className="site-form-page">
        <ErrorState
          title={labels.profileErrorTitle ?? '无法加载个人中心'}
          message={profileState.loadError ?? undefined}
          onRetry={profileState.retry}
        />
      </div>
    );
  }

  return (
    <div className="site-form-page site-profile">
      <header>
        <p className="site-eyebrow">{labels.profileEyebrow ?? 'ACCOUNT'}</p>
        <h1 className="site-form-page__title">{labels.profileTitle ?? '个人中心'}</h1>
        <p className="site-form-page__desc">
          {labels.profileDescription ??
            '管理昵称与密码、两步验证和登录设备。退出其他设备不会影响当前会话。'}
        </p>
      </header>

      <ProfileMeta labels={labels} profile={profile} stats={stats} />

      {notice && (
        <p className={`site-form__error site-form__error--${notice.tone}`} role="status">
          {notice.text}
        </p>
      )}

      <ProfileBasicForm
        labels={labels}
        name={profileState.name}
        saving={profileState.savingName}
        onNameChange={profileState.setName}
        onSubmit={profileState.saveName}
      />

      <ProfilePasswordForm
        labels={labels}
        currentPassword={profileState.currentPassword}
        newPassword={profileState.newPassword}
        confirmPassword={profileState.confirmPassword}
        busy={profileState.changingPassword}
        onCurrentPasswordChange={profileState.setCurrentPassword}
        onNewPasswordChange={profileState.setNewPassword}
        onConfirmPasswordChange={profileState.setConfirmPassword}
        onSubmit={profileState.changePassword}
      />

      <ProfileTotpSection
        labels={labels}
        enabled={profile.totp_enabled}
        setup={profileState.totpSetup}
        password={profileState.totpPassword}
        code={profileState.totpCode}
        busy={profileState.totpBusy}
        onPasswordChange={profileState.setTotpPassword}
        onCodeChange={profileState.setTotpCode}
        onSetup={profileState.setupTotp}
        onEnable={profileState.enableTotp}
        onDisable={profileState.disableTotp}
        onCancel={profileState.cancelTotpSetup}
      />

      <ProfileSessionsSection
        labels={labels}
        sessions={profileState.sessions}
        revoking={profileState.revoking}
        onRevoke={profileState.revoke}
        onRevokeOthers={profileState.revokeOthers}
        onLogout={profileState.logout}
      />
    </div>
  );
}
