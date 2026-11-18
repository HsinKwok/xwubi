import type { MouseEvent as ReactMouseEvent } from 'react';
import { Icon } from './icons';
import type { IconName } from './icons';
import { ROLE_LABELS } from '../types';
import type { AdminBadgeCounts, AdminSection, AdminUser, StaffRole } from '../types';

export interface AdminSidebarProps {
  user: AdminUser;
  current: AdminSection;
  counts?: AdminBadgeCounts;
  collapsed?: boolean;
  mobileOpen?: boolean;
  onNavigate?: (section: AdminSection, href: string) => void;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
  /** 返回前台（SPA 跳转用） */
  onBackToSite?: () => void;
}

interface SidebarItem {
  key: AdminSection;
  label: string;
  href: string;
  icon: IconName;
  /** 不配置表示所有角色可见；服务端仍会二次校验 */
  roles?: StaffRole[];
  badgeKey?: keyof AdminBadgeCounts;
}

interface SidebarGroup {
  id: string;
  label: string;
  items: SidebarItem[];
}

const GROUPS: SidebarGroup[] = [
  {
    id: 'daily',
    label: '日常',
    items: [
      { key: 'dashboard', label: '工作台', href: '/admin', icon: 'grid' },
      {
        key: 'review',
        label: '审核中心',
        href: '/admin/review',
        icon: 'checkSquare',
        roles: ['admin', 'reviewer', 'ops'],
        badgeKey: 'review',
      },
      { key: 'content', label: '内容管理', href: '/admin/content', icon: 'file' },
      {
        key: 'users',
        label: '用户与投稿',
        href: '/admin/users',
        icon: 'users',
        roles: ['admin', 'ops'],
        badgeKey: 'users',
      },
    ],
  },
  {
    id: 'resources',
    label: '资源',
    items: [
      { key: 'data', label: '码表数据', href: '/admin/data', icon: 'database', roles: ['admin'] },
      {
        key: 'practice',
        label: '文章跟打',
        href: '/admin/practice',
        icon: 'type',
        roles: ['admin', 'editor'],
      },
      { key: 'media', label: '媒体库', href: '/admin/media', icon: 'image' },
      {
        key: 'categories',
        label: '分类与标签',
        href: '/admin/categories',
        icon: 'layers',
        roles: ['admin'],
      },
    ],
  },
  {
    id: 'system',
    label: '管理',
    items: [{ key: 'settings', label: '系统设置', href: '/admin/settings', icon: 'settings', roles: ['admin'] }],
  },
];

function formatCount(value?: number): string | null {
  if (!value || value <= 0) return null;
  return value > 99 ? '99+' : String(value);
}

export function AdminSidebar({
  user,
  current,
  counts,
  collapsed = false,
  mobileOpen = false,
  onNavigate,
  onToggleCollapse,
  onCloseMobile,
  onBackToSite,
}: AdminSidebarProps) {
  const groups = GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.roles || item.roles.includes(user.role)),
  })).filter((group) => group.items.length > 0);

  function handleItemClick(event: ReactMouseEvent<HTMLAnchorElement>, item: SidebarItem) {
    if (!onNavigate) return;
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
    event.preventDefault();
    onNavigate(item.key, item.href);
    onCloseMobile?.();
  }

  function handleBackToSite(event: ReactMouseEvent<HTMLAnchorElement>) {
    if (!onBackToSite) return;
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
    event.preventDefault();
    onBackToSite();
  }

  return (
    <aside
      id="xw-admin-sidebar"
      className={[
        'xw-sidebar',
        collapsed ? 'is-collapsed' : '',
        mobileOpen ? 'is-open' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="管理台导航"
    >
      <div className="xw-sidebar__head">
        <span className="xw-sidebar__title">管理台</span>
        <button
          type="button"
          className="xw-icon-btn xw-sidebar__collapse"
          onClick={onToggleCollapse}
          aria-label={collapsed ? '展开侧栏' : '收起侧栏'}
          aria-expanded={!collapsed}
          aria-controls="xw-admin-sidebar"
        >
          <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} size={16} />
        </button>
        <button
          type="button"
          className="xw-icon-btn xw-sidebar__close"
          onClick={onCloseMobile}
          aria-label="关闭导航"
        >
          <Icon name="close" size={18} />
        </button>
      </div>

      <nav className="xw-sidebar__nav" aria-label="管理台分区">
        {groups.map((group) => (
          <div className="xw-sidebar__group" key={group.id}>
            <p className="xw-sidebar__group-label">{group.label}</p>
            {group.items.map((item) => {
              const count = item.badgeKey ? formatCount(counts?.[item.badgeKey]) : null;
              const isCurrent = current === item.key;
              return (
                <a
                  key={item.key}
                  className="xw-sidebar__item"
                  href={item.href}
                  aria-current={isCurrent ? 'page' : undefined}
                  title={collapsed ? item.label : undefined}
                  onClick={(event) => handleItemClick(event, item)}
                >
                  <span className="xw-sidebar__icon">
                    <Icon name={item.icon} size={18} />
                  </span>
                  <span className="xw-sidebar__label">{item.label}</span>
                  {count && (
                    <span className="xw-sidebar__badge" title={`${count} 条待处理`}>
                      {count}
                    </span>
                  )}
                </a>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="xw-sidebar__foot">
        <a className="xw-sidebar__back" href="/" onClick={handleBackToSite} title={collapsed ? '返回前台' : undefined}>
          <Icon name="external" size={16} />
          <span className="xw-sidebar__label">返回前台</span>
        </a>
        <p className="xw-sidebar__role" title={collapsed ? ROLE_LABELS[user.role] : undefined}>
          <Icon name="shield" size={14} />
          <span className="xw-sidebar__label">当前角色：{ROLE_LABELS[user.role]}</span>
        </p>
      </div>
    </aside>
  );
}
