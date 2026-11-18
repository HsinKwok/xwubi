import { Suspense, useCallback, useEffect, useState } from 'react';
import { AdminPageView } from './components/AdminPageView';
import { AdminLayout } from './layout/AdminLayout';
import { getCurrentUser } from './lib/api';
import { toQueryString } from '../shared/query';
import {
  readVersion,
  resolveAuthRoute,
  resolvePage,
  sectionFromPath,
  storeVersion,
} from './lib/routes';
import { loadVersions, subscribeVersions } from './lib/versions';
import type { VersionOption, VersionsPayload } from './lib/versions';
import {
  AcceptInvitePage,
  ChangePasswordPage,
  ForgotPasswordPage,
  PageLoading,
  ResetPasswordPage,
} from './pages/lazy-pages';
import type { AdminSection, AdminUser, WubiVersion } from './types';

export function App() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  // 同时跟踪查询串，确保同一路径下再次搜索也会触发页面更新
  const [location, setLocation] = useState(
    () => window.location.pathname + window.location.search,
  );
  const pathname = location.split('?')[0];
  const search = location.slice(pathname.length);
  const [version, setVersion] = useState<WubiVersion>(readVersion);
  const [versions, setVersions] = useState<VersionOption[]>([]);

  const applyVersions = useCallback((payload: VersionsPayload) => {
    const allowed = payload.versions.map((item) => item.value);
    setVersions(payload.versions);
    // 本地缓存的版本可能已下线：回退到后端给的默认版本
    setVersion((previous) => {
      if (previous && allowed.includes(previous)) return previous;
      const next = allowed.includes(payload.defaultVersion)
        ? payload.defaultVersion
        : (allowed[0] ?? '');
      storeVersion(next);
      return next;
    });
  }, []);

  // 设置页保存后版本清单会刷新，这里同步到页头下拉
  useEffect(() => subscribeVersions(applyVersions), [applyVersions]);

  useEffect(() => {
    const controller = new AbortController();

    getCurrentUser(controller.signal)
      .then((current) => {
        setUser(current);
        setLoading(false);
        if (current) {
          // 先渲染管理台外壳，版本清单在后台补齐，避免首屏多等一次请求
          void loadVersions(controller.signal)
            .then((payload) => {
              if (payload) applyVersions(payload);
            })
            .catch(() => undefined);
        }
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });

    return () => controller.abort();
  }, [applyVersions]);

  // 登录成功后立即进入管理台，版本清单后台加载；分类与标签由具体页面按需取
  useEffect(() => {
    const handlePop = () => setLocation(window.location.pathname + window.location.search);
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const handleNavigate = useCallback((_section: AdminSection, href: string) => {
    if (window.location.pathname + window.location.search === href) return;
    window.history.pushState({}, '', href);
    setLocation(window.location.pathname + window.location.search);
  }, []);

  const handleHeaderNavigate = useCallback(
    (href: string) => {
      if (href.startsWith('/admin')) {
        handleNavigate(sectionFromPath(href), href);
        return;
      }
      window.location.assign(href);
    },
    [handleNavigate],
  );

  const handleSearch = useCallback(
    (query: string) => {
      handleNavigate('content', `/admin/content${toQueryString({ q: query })}`);
    },
    [handleNavigate],
  );

  const handleVersionChange = useCallback((next: WubiVersion) => {
    setVersion(next);
    storeVersion(next);
  }, []);

  const handleLogout = useCallback(() => {
    fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
      .catch(() => undefined)
      .finally(() => setUser(null));
  }, []);

  const handleUnauthorized = useCallback(() => {
    setUser(null);
  }, []);

  const navigateAdmin = useCallback(
    (href: string) => {
      handleNavigate(sectionFromPath(href), href);
    },
    [handleNavigate],
  );

  const clearPasswordChange = useCallback(() => {
    setUser((current) => (current ? { ...current, must_change_password: false } : current));
  }, []);

  // 未登录统一走站点登录页，登录成功后按 next 回到当前管理台地址
  useEffect(() => {
    if (loading || user) return;
    if (resolveAuthRoute(pathname)) return;
    const next = `${pathname}${window.location.search}`;
    window.location.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [loading, user, pathname]);

  const authRoute = resolveAuthRoute(pathname);
  if (authRoute === 'accept-invite') {
    return (
      <Suspense fallback={<PageLoading />}>
        <AcceptInvitePage />
      </Suspense>
    );
  }
  if (authRoute === 'reset-password') {
    return (
      <Suspense fallback={<PageLoading />}>
        <ResetPasswordPage />
      </Suspense>
    );
  }
  if (authRoute === 'forgot-password') {
    return (
      <Suspense fallback={<PageLoading />}>
        <ForgotPasswordPage />
      </Suspense>
    );
  }

  if (loading) {
    return (
      <div className="xw-boot" role="status">
        正在加载管理台…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="xw-boot" role="status">
        正在前往登录…
      </div>
    );
  }

  if (user.must_change_password) {
    return (
      <Suspense fallback={<PageLoading />}>
        <ChangePasswordPage forced onChanged={clearPasswordChange} />
      </Suspense>
    );
  }

  return (
    <AdminLayout
      user={user}
      current={sectionFromPath(pathname)}
      version={version}
      versions={versions}
      onVersionChange={handleVersionChange}
      onNavigate={handleNavigate}
      onHeaderNavigate={handleHeaderNavigate}
      onSearch={handleSearch}
      onLogout={handleLogout}
      activeNav={undefined}
    >
      <Suspense fallback={<PageLoading />}>
        <AdminPageView
          page={resolvePage(pathname)}
          search={search}
          user={user}
          onNavigate={navigateAdmin}
          onUnauthorized={handleUnauthorized}
          onPasswordChanged={clearPasswordChange}
        />
      </Suspense>
    </AdminLayout>
  );
}
