import { useEffect, useState } from 'react';
import type { SessionUser, SiteConfig, VersionOption } from '../../shared/site-config';

export interface SiteHeaderProps {
  brand: SiteConfig['brand'];
  nav: SiteConfig['nav'];
  versions: VersionOption[];
  version: string;
  activeNav?: string;
  header: SiteConfig['header'];
  user: SessionUser | null;
  themeMode: 'light' | 'dark';
  onVersionChange: (version: string) => void;
  onToggleTheme: () => void;
  currentPath: string;
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none">
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none">
      <path
        d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none">
      {open ? (
        <path
          d="M6 6l12 12M18 6L6 18"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M4 7h16M4 12h16M4 17h16"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export function SiteHeader({
  brand,
  nav,
  versions,
  version,
  activeNav,
  header,
  user,
  themeMode,
  onVersionChange,
  onToggleTheme,
  currentPath,
}: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [currentPath]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [menuOpen]);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a className="site-brand" href="/">
          <span className="site-brand__mark" aria-hidden="true">
            <img src="/logo.png" alt="" width={34} height={34} />
          </span>
          <span className="site-brand__text">
            <span className="site-brand__name">{brand.name}</span>
            <span className="site-brand__tagline">{brand.tagline}</span>
          </span>
        </a>

        <nav className="site-nav" aria-label={brand.name}>
          {nav.map((item) => (
            <a
              key={item.key}
              className="site-nav__link"
              href={item.href}
              aria-current={activeNav === item.key ? 'page' : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="site-header__tools">
          <div className="site-versions" role="group" aria-label={header.versionLabel}>
            {versions.map((item) => (
              <button
                key={item.value}
                type="button"
                className={`site-versions__item${version === item.value ? ' is-active' : ''}`}
                title={item.note ?? item.label}
                aria-pressed={version === item.value}
                onClick={() => onVersionChange(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="site-icon-btn"
            onClick={onToggleTheme}
            aria-label={header.themeLabel}
            title={header.themeLabel}
          >
            {themeMode === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>

          {user ? (
            <a className="site-header__account" href="/admin" title={header.staffLabel}>
              <span className="site-header__account-dot" aria-hidden="true" />
              {user.name}
            </a>
          ) : (
            <a className="site-header__login" href="/login">
              {header.loginLabel}
            </a>
          )}

          <button
            type="button"
            className="site-icon-btn site-header__menu-btn"
            aria-label={header.menuLabel}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MenuIcon open={menuOpen} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="site-menu">
          <nav className="site-menu__nav" aria-label={header.menuLabel}>
            {nav.map((item) => (
              <a key={item.key} className="site-menu__link" href={item.href}>
                <span>{item.label}</span>
                <span className="site-menu__arrow" aria-hidden="true">
                  →
                </span>
              </a>
            ))}
          </nav>

          <div className="site-menu__versions" role="group" aria-label={header.versionLabel}>
            {versions.map((item) => (
              <button
                key={item.value}
                type="button"
                className={`site-versions__item${version === item.value ? ' is-active' : ''}`}
                aria-pressed={version === item.value}
                onClick={() => onVersionChange(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="site-menu__foot">
            {user ? (
              <span className="site-menu__links">
                <a className="site-menu__staff" href="/profile">
                  {header.profileLabel ?? '个人中心'}
                </a>
                <a className="site-menu__staff" href="/admin">
                  <span className="site-header__account-dot" aria-hidden="true" />
                  {header.staffLabel}
                </a>
              </span>
            ) : (
              <a className="site-menu__staff" href="/login">
                {header.loginLabel}
              </a>
            )}
            <button type="button" className="site-menu__theme" onClick={onToggleTheme}>
              {themeMode === 'dark' ? <SunIcon /> : <MoonIcon />}
              <span>{header.themeLabel}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
