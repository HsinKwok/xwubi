import { lazy } from 'react';
import type { AdminSection } from '../types';

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

// 各功能页的 chunk 加载器，按需加载以减小首屏 JS 体积，同时供侧栏悬停预取复用
const pageLoaders = {
  dashboard: () => import('./DashboardPage'),
  review: () => import('./review/ReviewPage'),
  settings: () => import('./settings/SettingsPage'),
  users: () => import('./users/UsersPage'),
  data: () => import('./data/DataPage'),
  media: () => import('./media/MediaPage'),
  practice: () => import('./practice/PracticeTextsPage'),
  categories: () => import('./categories/CategoriesPage'),
  content: () => import('./content/ContentListPage'),
} satisfies Record<AdminSection, () => Promise<unknown>>;

export const DashboardPage = lazy(() =>
  pageLoaders.dashboard().then((module) => ({ default: module.DashboardPage })),
);
export const ReviewPage = lazy(() =>
  pageLoaders.review().then((module) => ({ default: module.ReviewPage })),
);
export const SettingsPage = lazy(() =>
  pageLoaders.settings().then((module) => ({ default: module.SettingsPage })),
);
export const UsersPage = lazy(() =>
  pageLoaders.users().then((module) => ({ default: module.UsersPage })),
);
export const DataPage = lazy(() =>
  pageLoaders.data().then((module) => ({ default: module.DataPage })),
);
export const MediaPage = lazy(() =>
  pageLoaders.media().then((module) => ({ default: module.MediaPage })),
);
export const PracticeTextsPage = lazy(() =>
  pageLoaders.practice().then((module) => ({ default: module.PracticeTextsPage })),
);
export const CategoriesPage = lazy(() =>
  pageLoaders.categories().then((module) => ({ default: module.CategoriesPage })),
);
export const ContentListPage = lazy(() =>
  pageLoaders.content().then((module) => ({ default: module.ContentListPage })),
);
export const ContentEditorPage = lazy(() =>
  import('./content/ContentEditorPage').then((module) => ({
    default: module.ContentEditorPage,
  })),
);

/** 预取管理页 chunk：侧栏悬停/聚焦、键盘 Tab 到时提前下载 */
export function prefetchSection(section: AdminSection): void {
  void pageLoaders[section]().catch(() => {
    // 预取失败不打扰用户，真正进入页面时 lazy 会重试
  });
}

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
