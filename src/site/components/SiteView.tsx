import { lazy } from 'react';
import type { BootstrapPayload, SessionUser } from '../../shared/site-config';
import { HomePage } from '../pages/HomePage';
import { versionLabel as formatVersionLabel } from '../lib/format';
import type { View } from '../lib/views';

// 首屏只加载首页；其余页面按路由按需加载，减小初始 JS 体积
const AboutPage = lazy(() =>
  import('../pages/AboutPage').then((module) => ({ default: module.AboutPage })),
);
const CollectionPage = lazy(() =>
  import('../pages/CollectionPage').then((module) => ({ default: module.CollectionPage })),
);
const ContentPage = lazy(() =>
  import('../pages/ContentPage').then((module) => ({ default: module.ContentPage })),
);
const FeedbackStatusPage = lazy(() =>
  import('../pages/FeedbackStatusPage').then((module) => ({
    default: module.FeedbackStatusPage,
  })),
);
const LoginPage = lazy(() =>
  import('../pages/LoginPage').then((module) => ({ default: module.LoginPage })),
);
const NotFoundPage = lazy(() =>
  import('../pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })),
);
const ProfilePage = lazy(() =>
  import('../pages/ProfilePage').then((module) => ({ default: module.ProfilePage })),
);
const SubmitConfirmPage = lazy(() =>
  import('../pages/SubmitConfirmPage').then((module) => ({ default: module.SubmitConfirmPage })),
);
const SubmitPage = lazy(() =>
  import('../pages/SubmitPage').then((module) => ({ default: module.SubmitPage })),
);
const SubmitStatusPage = lazy(() =>
  import('../pages/SubmitStatusPage').then((module) => ({ default: module.SubmitStatusPage })),
);

// 工具与练习页体积较大，仅在访问对应路由时加载
const KeymapPage = lazy(() =>
  import('../pages/KeymapPage').then((module) => ({ default: module.KeymapPage })),
);
const PracticePage = lazy(() =>
  import('../pages/PracticePage').then((module) => ({ default: module.PracticePage })),
);

export interface SiteViewProps {
  view: View;
  boot: BootstrapPayload;
  version: string;
  onSignedOut: () => void;
  onLoggedIn: (user: SessionUser) => void;
  onProfileUpdated: (name: string) => void;
}

/** 按视图渲染页面；页面级懒加载统一收敛在这里 */
export function SiteView({
  view,
  boot,
  version,
  onSignedOut,
  onLoggedIn,
  onProfileUpdated,
}: SiteViewProps) {
  const versionLabel = formatVersionLabel(version, boot.versions, boot.labels);

  switch (view.name) {
    case 'home':
      return <HomePage boot={boot} />;
    case 'collection':
      return (
        <CollectionPage
          key={`${view.type}-${version}`}
          boot={boot}
          type={view.type}
          version={version}
        />
      );
    case 'content':
      return (
        <ContentPage
          key={`${view.type}-${view.slug}-${version}`}
          boot={boot}
          type={view.type}
          slug={view.slug}
          version={version}
        />
      );
    case 'about':
      return <AboutPage boot={boot} />;
    case 'keymap':
      return (
        <KeymapPage
          key={`keymap-${version}`}
          labels={boot.labels}
          version={version}
          versionLabel={versionLabel}
        />
      );
    case 'practice':
      return (
        <PracticePage
          key={`practice-${version}`}
          labels={boot.labels}
          version={version}
          versionLabel={versionLabel}
        />
      );
    case 'submit':
      return <SubmitPage boot={boot} />;
    case 'submit-confirm':
      return <SubmitConfirmPage labels={boot.labels} />;
    case 'submit-status':
      return <SubmitStatusPage labels={boot.labels} />;
    case 'feedback-status':
      return <FeedbackStatusPage labels={boot.labels} />;
    case 'profile':
      return (
        <ProfilePage
          labels={boot.labels}
          onSignedOut={onSignedOut}
          onProfileUpdated={onProfileUpdated}
        />
      );
    case 'login':
      return <LoginPage labels={boot.labels} onLoggedIn={onLoggedIn} />;
    default:
      return <NotFoundPage labels={boot.labels} />;
  }
}
