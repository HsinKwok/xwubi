import { Suspense, useCallback, useEffect, useState } from 'react';
import type {
  BootstrapPayload,
  SessionUser,
  ThemeMode,
} from '../shared/site-config';
import { ErrorState, PageSkeleton } from './components/Bits';
import { SiteFooter } from './components/SiteFooter';
import { SiteHeader } from './components/SiteHeader';
import { SiteView } from './components/SiteView';
import { getOptionalJson } from './lib/api';
import { fetchBootstrap, readCachedBootstrap } from './lib/bootstrap-cache';
import { navigate, searchParam, subscribeToLocation } from './lib/router';
import {
  applyTheme,
  readStoredMode,
  readStoredVersion,
  storeMode,
  storeVersion,
} from './lib/theme';
import { resolveView } from './lib/views';

/** 后端登录时写入的非 HttpOnly 标记，用来判断是否值得请求 /api/auth/me */
const SESSION_HINT = 'xwubi_has_session=1';

function hasSessionHint(): boolean {
  return document.cookie.split('; ').includes(SESSION_HINT);
}

export function App() {
  const [boot, setBoot] = useState<BootstrapPayload | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const [bootKey, setBootKey] = useState(0);
  const [me, setMe] = useState<SessionUser | null>(null);
  const [version, setVersion] = useState<string | null>(readStoredVersion);
  // 版本切换防抖：头部立即高亮，数据请求等点击停下后再发，避免连点产生多次请求
  const [dataVersion, setDataVersion] = useState<string | null>(readStoredVersion);
  const [mode, setMode] = useState<ThemeMode>(() => readStoredMode() ?? 'light');
  const [location, setLocation] = useState(() => window.location.pathname + window.location.search);

  const pathname = location.split('?')[0];

  // history 路由：只在同源、无修饰键的左键点击时接管
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = (event.target as Element | null)?.closest('a');
      if (!anchor) return;
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }

      const url = new URL(href, window.location.origin);
      if (url.origin !== window.location.origin) return;
      if (url.pathname.startsWith('/admin')) return;

      event.preventDefault();
      navigate(url.pathname + url.search);
    }

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => subscribeToLocation((next) => setLocation(next.pathname + next.search)), []);

  useEffect(() => {
    if (version === dataVersion) return;
    const timer = window.setTimeout(() => setDataVersion(version), 250);
    return () => window.clearTimeout(timer);
  }, [version, dataVersion]);

  useEffect(() => {
    const controller = new AbortController();
    setBootError(null);

    const apply = (payload: BootstrapPayload) => {
      setBoot(payload);
      // 本地缓存的版本可能已下线：回退到后端归一化后的版本
      const known = payload.versions.some((item) => item.value === dataVersion);
      if (dataVersion === null || !known) {
        setVersion(payload.meta.version);
        setDataVersion(payload.meta.version);
        storeVersion(payload.meta.version);
      }
      if (!readStoredMode()) setMode(payload.theme.defaultMode);
    };

    // 版本切换或重复进入时优先用内存缓存，省掉一次 AJAX 往返
    const cached = bootKey === 0 ? readCachedBootstrap(dataVersion) : null;
    if (cached) {
      apply(cached);
      return () => controller.abort();
    }

    fetchBootstrap(dataVersion, controller.signal, bootKey > 0)
      .then(apply)
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        setBootError(caught instanceof Error ? caught.message : '站点配置加载失败');
      });

    return () => controller.abort();
  }, [dataVersion, bootKey]);

  useEffect(() => {
    if (!hasSessionHint()) {
      setMe(null);
      return;
    }
    const controller = new AbortController();
    getOptionalJson<{ user: SessionUser }>('/api/auth/me', controller.signal)
      .then((payload) => setMe(payload?.user ?? null))
      .catch(() => setMe(null));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!boot) return;
    applyTheme(document.documentElement, boot.theme, mode);
  }, [boot, mode]);

  useEffect(() => {
    if (!boot) return;
    document.title = `${boot.brand.name} · ${boot.brand.tagline}`;
  }, [boot]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const handleVersionChange = useCallback((next: string) => {
    setVersion(next);
    storeVersion(next);
  }, []);

  const handleToggleTheme = useCallback(() => {
    setMode((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      storeMode(next);
      return next;
    });
  }, []);

  const handleLoggedIn = useCallback((user: SessionUser) => {
    setMe(user);
    const next = searchParam('next');
    // 只接受站内绝对路径，避免 //evil.com 这类协议相对地址
    const target = next.startsWith('/') && !next.startsWith('//') ? next : '/admin';
    window.location.assign(target);
  }, []);

  const handleSignedOut = useCallback(() => {
    setMe(null);
    navigate('/');
  }, []);

  const handleProfileUpdated = useCallback((name: string) => {
    setMe((current) => (current ? { ...current, name } : current));
  }, []);

  if (!boot) {
    return (
      <div className="site-shell">
        <div className="site-boot">
          {bootError ? (
            <ErrorState
              title="站点暂时无法加载"
              message={bootError}
              onRetry={() => setBootKey((key) => key + 1)}
            />
          ) : (
            <PageSkeleton rows={3} />
          )}
        </div>
      </div>
    );
  }

  const config = boot;
  const effectiveVersion = version ?? config.meta.version;
  const view = resolveView(config, pathname);
  const activeNav = config.nav.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  )?.key;

  return (
    <div className="site-shell">
      <a className="site-skip" href="#site-main">
        {config.labels.skipToContent ?? '跳到主要内容'}
      </a>

      <SiteHeader
        brand={config.brand}
        nav={config.nav}
        versions={config.versions}
        version={effectiveVersion}
        activeNav={activeNav}
        header={config.header}
        user={me}
        themeMode={mode}
        onVersionChange={handleVersionChange}
        onToggleTheme={handleToggleTheme}
        currentPath={pathname}
      />

      <main className="site-main" id="site-main">
        <Suspense fallback={<PageSkeleton rows={4} />}>
          <SiteView
            view={view}
            boot={config}
            version={dataVersion ?? config.meta.version}
            onSignedOut={handleSignedOut}
            onLoggedIn={handleLoggedIn}
            onProfileUpdated={handleProfileUpdated}
          />
        </Suspense>
      </main>

      <SiteFooter brand={config.brand} footer={config.footer} />
    </div>
  );
}
