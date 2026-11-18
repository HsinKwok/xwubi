import type { AdminUser } from '../types';
import type { AdminPage } from '../lib/routes';
import {
  CategoriesPage,
  ChangePasswordPage,
  ContentEditorPage,
  ContentListPage,
  DashboardPage,
  DataPage,
  MediaPage,
  PracticeTextsPage,
  ReviewPage,
  SettingsPage,
  UsersPage,
} from '../pages/lazy-pages';

export interface AdminPageViewProps {
  page: AdminPage;
  search: string;
  user: AdminUser;
  onNavigate: (href: string) => void;
  onUnauthorized: () => void;
  onPasswordChanged: () => void;
}

/** 管理台页面分发：App 只负责登录态与外壳，具体页面在这里按 kind 渲染 */
export function AdminPageView({
  page,
  search,
  user,
  onNavigate,
  onUnauthorized,
  onPasswordChanged,
}: AdminPageViewProps) {
  switch (page.kind) {
    case 'dashboard':
      return <DashboardPage user={user} onNavigate={onNavigate} onUnauthorized={onUnauthorized} />;
    case 'review':
      return <ReviewPage user={user} onNavigate={onNavigate} onUnauthorized={onUnauthorized} />;
    case 'settings':
      return <SettingsPage user={user} onUnauthorized={onUnauthorized} />;
    case 'users':
      return <UsersPage user={user} onUnauthorized={onUnauthorized} />;
    case 'data':
      return <DataPage user={user} onUnauthorized={onUnauthorized} />;
    case 'media':
      return <MediaPage user={user} onUnauthorized={onUnauthorized} />;
    case 'practice':
      return <PracticeTextsPage user={user} onUnauthorized={onUnauthorized} />;
    case 'categories':
      return <CategoriesPage user={user} onUnauthorized={onUnauthorized} />;
    case 'password':
      return <ChangePasswordPage onChanged={onPasswordChanged} />;
    case 'content-list':
      return (
        <ContentListPage
          key={search}
          initialQuery={new URLSearchParams(search).get('q')?.trim() ?? ''}
          user={user}
          onNavigate={onNavigate}
          onUnauthorized={onUnauthorized}
        />
      );
    case 'content-new':
      return (
        <ContentEditorPage
          key="new"
          user={user}
          id={null}
          onNavigate={onNavigate}
          onUnauthorized={onUnauthorized}
        />
      );
    case 'content-edit':
      return (
        <ContentEditorPage
          key={page.id}
          user={user}
          id={page.id}
          onNavigate={onNavigate}
          onUnauthorized={onUnauthorized}
        />
      );
    default:
      return null;
  }
}
