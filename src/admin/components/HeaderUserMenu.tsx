// 头部账号菜单：头像下拉、个人中心/管理台入口与退出登录
import { useEffect, useRef, useState } from 'react';
import { Icon } from './icons';
import { ROLE_LABELS } from '../types';
import type { AdminUser } from '../types';
import { createNavigateHandler } from '../lib/navigate';

interface HeaderUserMenuProps {
  user: AdminUser;
  mode: 'site' | 'admin';
  profileHref: string;
  passwordHref: string;
  adminHref: string;
  onNavigate?: (href: string) => void;
  onLogout?: () => void;
}

export function HeaderUserMenu({
  user,
  mode,
  profileHref,
  passwordHref,
  adminHref,
  onNavigate,
  onLogout,
}: HeaderUserMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const avatarButtonRef = useRef<HTMLButtonElement>(null);
  const go = createNavigateHandler(onNavigate);

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!avatarRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        avatarButtonRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  // 切换账号（含退出登录）时收起菜单
  useEffect(() => {
    setMenuOpen(false);
  }, [user.id]);

  function handleLogout() {
    setMenuOpen(false);
    onLogout?.();
  }

  const initial = user.name.trim().slice(0, 1).toUpperCase();
  const accountHref = mode === 'admin' ? passwordHref : profileHref;
  const accountLabel = mode === 'admin' ? '修改密码' : '个人中心';

  return (
    <div className="xw-avatar" ref={avatarRef}>
      <button
        ref={avatarButtonRef}
        type="button"
        className="xw-avatar__button"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span className="xw-avatar__badge" aria-hidden="true">
          {initial}
        </span>
        <span className="xw-avatar__name">{user.name}</span>
        <Icon name="chevronDown" size={14} className="xw-avatar__chevron" />
      </button>

      {menuOpen && (
        <div className="xw-avatar__menu" role="menu">
          <div className="xw-avatar__meta">
            <span className="xw-avatar__meta-name">{user.name}</span>
            <span className="xw-avatar__meta-email">{user.email}</span>
            <span className="xw-avatar__meta-role">{ROLE_LABELS[user.role]}</span>
          </div>
          <div className="xw-avatar__separator" role="separator" />

          <a
            role="menuitem"
            className="xw-avatar__item"
            href={accountHref}
            onClick={(event) => {
              setMenuOpen(false);
              go(event, accountHref);
            }}
          >
            <Icon name="user" size={16} />
            {accountLabel}
          </a>

          {mode !== 'admin' && (
            <a
              role="menuitem"
              className="xw-avatar__item"
              href={adminHref}
              onClick={(event) => {
                setMenuOpen(false);
                go(event, adminHref);
              }}
            >
              <Icon name="shield" size={16} />
              管理台
            </a>
          )}

          <button
            type="button"
            role="menuitem"
            className="xw-avatar__item xw-avatar__item--danger"
            onClick={handleLogout}
          >
            <Icon name="logout" size={16} />
            退出登录
          </button>
        </div>
      )}
    </div>
  );
}
