// 管理台/前台共用头部：品牌、主导航、码表版本切换、站内搜索与账号菜单
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Icon } from './icons';
import { HeaderUserMenu } from './HeaderUserMenu';
import { createNavigateHandler } from '../lib/navigate';
import type { AdminUser, PublicNavKey, WubiVersion } from '../types';
import type { VersionOption } from '../lib/versions';

export interface AppHeaderProps {
  /** 当前登录员工；为空时展示登录入口 */
  user?: AdminUser | null;
  /** site：前台页面；admin：管理台（品牌后追加“管理”标记） */
  mode?: 'site' | 'admin';
  version: WubiVersion;
  versions: VersionOption[];
  onVersionChange: (version: WubiVersion) => void;
  activeNav?: PublicNavKey;
  /** SPA 内部跳转；不传时保持原生链接行为 */
  onNavigate?: (href: string) => void;
  onToggleSidebar?: () => void;
  showSidebarToggle?: boolean;
  /** 供移动端抽屉按钮读取 aria-expanded */
  sidebarExpanded?: boolean;
  profileHref?: string;
  passwordHref?: string;
  adminHref?: string;
  onSearch?: (query: string) => void;
  onLogout?: () => void;
}

const PUBLIC_NAV: Array<{ key: PublicNavKey; label: string; href: string }> = [
  { key: 'learn', label: '教学', href: '/learn' },
  { key: 'news', label: '资讯', href: '/news' },
  { key: 'software', label: '软件库', href: '/software' },
  { key: 'tools', label: '工具', href: '/tools' },
];

export function AppHeader({
  user = null,
  mode = 'site',
  version,
  versions,
  onVersionChange,
  activeNav,
  onNavigate,
  onToggleSidebar,
  showSidebarToggle = false,
  sidebarExpanded = false,
  profileHref = '/profile',
  passwordHref = '/admin/password',
  adminHref = '/admin',
  onSearch,
  onLogout,
}: AppHeaderProps) {
  const [query, setQuery] = useState('');
  const go = createNavigateHandler(onNavigate);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const keyword = query.trim();
    if (!keyword) return;
    onSearch?.(keyword);
  }

  return (
    <header className={`xw-header${mode === 'admin' ? ' xw-header--admin' : ''}`}>
      <div className="xw-header__bar">
        {showSidebarToggle && (
          <button
            type="button"
            className="xw-icon-btn xw-header__toggle"
            onClick={onToggleSidebar}
            aria-label="打开管理台导航"
            aria-expanded={sidebarExpanded}
            aria-controls="xw-admin-sidebar"
          >
            <Icon name="menu" size={20} />
          </button>
        )}

        <a className="xw-header__logo" href="/" onClick={(event) => go(event, '/')}>
          <span className="xw-header__mark" aria-hidden="true">
            五
          </span>
          <span className="xw-header__wordmark">xwubi</span>
          {mode === 'admin' && <span className="xw-header__mode">管理</span>}
        </a>

        <nav className="xw-header__nav" aria-label="主导航">
          {PUBLIC_NAV.map((item) => (
            <a
              key={item.key}
              className="xw-header__nav-link"
              href={item.href}
              aria-current={activeNav === item.key ? 'page' : undefined}
              onClick={(event) => go(event, item.href)}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="xw-header__spacer" />

        <div className="xw-header__version">
          <span className="xw-header__version-label">码表</span>
          <select
            className="xw-header__select"
            value={version}
            onChange={(event) => onVersionChange(event.target.value as WubiVersion)}
            aria-label="码表版本"
          >
            {versions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <Icon name="chevronDown" size={14} className="xw-header__version-chevron" />
        </div>

        <form className="xw-header__search" role="search" onSubmit={handleSearch}>
          <Icon name="search" size={16} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索教程、资讯、软件"
            aria-label="站内搜索"
          />
        </form>

        {user ? (
          <HeaderUserMenu
            user={user}
            mode={mode}
            profileHref={profileHref}
            passwordHref={passwordHref}
            adminHref={adminHref}
            onNavigate={onNavigate}
            onLogout={onLogout}
          />
        ) : (
          <a className="xw-header__login" href="/login">
            登录
          </a>
        )}
      </div>
    </header>
  );
}
