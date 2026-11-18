import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AppHeader } from '../components/AppHeader';
import { AdminSidebar } from '../components/AdminSidebar';
import type { VersionOption } from '../lib/versions';
import type {
  AdminBadgeCounts,
  AdminSection,
  AdminUser,
  PublicNavKey,
  WubiVersion,
} from '../types';

export interface AdminLayoutProps {
  user: AdminUser;
  current: AdminSection;
  version: WubiVersion;
  versions: VersionOption[];
  counts?: AdminBadgeCounts;
  activeNav?: PublicNavKey;
  onVersionChange: (version: WubiVersion) => void;
  onNavigate?: (section: AdminSection, href: string) => void;
  onHeaderNavigate?: (href: string) => void;
  onSearch?: (query: string) => void;
  onLogout?: () => void;
  children: ReactNode;
}

const SIDEBAR_STORAGE_KEY = 'xwubi.admin.sidebar';

function readCollapsed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function AdminLayout({
  user,
  current,
  version,
  versions,
  counts,
  activeNav,
  onVersionChange,
  onNavigate,
  onHeaderNavigate,
  onSearch,
  onLogout,
  children,
}: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? '1' : '0');
    } catch {
      // 隐私模式下 localStorage 不可写，忽略即可
    }
  }, [collapsed]);

  // 移动端抽屉：Esc 关闭
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  const handleNavigate = useCallback(
    (section: AdminSection, href: string) => {
      setMobileOpen(false);
      onNavigate?.(section, href);
    },
    [onNavigate],
  );

  return (
    <div className="xw-admin">
      <a className="xw-skip" href="#xw-admin-main">
        跳到主要内容
      </a>

      <AppHeader
        mode="admin"
        user={user}
        version={version}
        versions={versions}
        onVersionChange={onVersionChange}
        activeNav={activeNav}
        onNavigate={onHeaderNavigate}
        onToggleSidebar={() => setMobileOpen((open) => !open)}
        showSidebarToggle
        sidebarExpanded={mobileOpen}
        onSearch={onSearch}
        onLogout={onLogout}
      />

      <div className="xw-admin__body">
        <AdminSidebar
          user={user}
          current={current}
          counts={counts}
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onNavigate={handleNavigate}
          onToggleCollapse={() => setCollapsed((value) => !value)}
          onCloseMobile={() => setMobileOpen(false)}
          onBackToSite={onHeaderNavigate ? () => onHeaderNavigate('/') : undefined}
        />

        <main className="xw-admin__main" id="xw-admin-main">
          {children}
        </main>
      </div>

      <button
        type="button"
        className={`xw-scrim${mobileOpen ? ' is-visible' : ''}`}
        aria-label="关闭导航"
        tabIndex={mobileOpen ? 0 : -1}
        onClick={() => setMobileOpen(false)}
      />
    </div>
  );
}
