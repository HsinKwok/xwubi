import { lazy } from 'react';

// 邀请、找回与改密页面使用频率低，按需加载以缩小登录首屏 JS
export const AcceptInvitePage = lazy(() =>
  import('./auth/AcceptInvitePage').then((module) => ({
    default: module.AcceptInvitePage,
  })),
);
export const ChangePasswordPage = lazy(() =>
  import('./auth/ChangePasswordPage').then((module) => ({
    default: module.ChangePasswordPage,
  })),
);
export const ForgotPasswordPage = lazy(() =>
  import('./auth/ForgotPasswordPage').then((module) => ({
    default: module.ForgotPasswordPage,
  })),
);
export const ResetPasswordPage = lazy(() =>
  import('./auth/ResetPasswordPage').then((module) => ({
    default: module.ResetPasswordPage,
  })),
);

// 管理后台各功能页按需加载，减小首屏 JS 体积
export const DashboardPage = lazy(() =>
  import('./DashboardPage').then((module) => ({ default: module.DashboardPage })),
);
export const ReviewPage = lazy(() =>
  import('./review/ReviewPage').then((module) => ({ default: module.ReviewPage })),
);
export const SettingsPage = lazy(() =>
  import('./settings/SettingsPage').then((module) => ({ default: module.SettingsPage })),
);
export const UsersPage = lazy(() =>
  import('./users/UsersPage').then((module) => ({ default: module.UsersPage })),
);
export const DataPage = lazy(() =>
  import('./data/DataPage').then((module) => ({ default: module.DataPage })),
);
export const MediaPage = lazy(() =>
  import('./media/MediaPage').then((module) => ({ default: module.MediaPage })),
);
export const PracticeTextsPage = lazy(() =>
  import('./practice/PracticeTextsPage').then((module) => ({
    default: module.PracticeTextsPage,
  })),
);
export const CategoriesPage = lazy(() =>
  import('./categories/CategoriesPage').then((module) => ({
    default: module.CategoriesPage,
  })),
);
export const ContentListPage = lazy(() =>
  import('./content/ContentListPage').then((module) => ({ default: module.ContentListPage })),
);
export const ContentEditorPage = lazy(() =>
  import('./content/ContentEditorPage').then((module) => ({
    default: module.ContentEditorPage,
  })),
);

/** 懒加载页面与登录检测共用的骨架 */
export function PageLoading() {
  return (
    <div className="xw-skeleton-stack" role="status" aria-label="正在加载页面" aria-live="polite">
      <div className="xw-skeleton xw-skeleton--heading" />
      <div className="xw-skeleton xw-skeleton--bar" />
      <div className="xw-skeleton xw-skeleton--bar" />
    </div>
  );
}
