import type { AdminSection, WubiVersion } from '../types';

export const VERSION_KEY = 'xwubi.admin.version';

/** 管理台页面视图：由 URL 路径解析得到 */
export type AdminPage =
  | { kind: 'dashboard' }
  | { kind: 'review' }
  | { kind: 'settings' }
  | { kind: 'users' }
  | { kind: 'data' }
  | { kind: 'media' }
  | { kind: 'practice' }
  | { kind: 'categories' }
  | { kind: 'password' }
  | { kind: 'content-list' }
  | { kind: 'content-new' }
  | { kind: 'content-edit'; id: string };

export type AuthRoute = 'accept-invite' | 'reset-password' | 'forgot-password';

export function readVersion(): WubiVersion {
  try {
    return window.localStorage.getItem(VERSION_KEY) ?? '';
  } catch {
    return '';
  }
}

export function storeVersion(version: string): void {
  try {
    window.localStorage.setItem(VERSION_KEY, version);
  } catch {
    // 忽略隐私模式下的写入失败
  }
}

export function sectionFromPath(pathname: string): AdminSection {
  const segment = pathname.split('/')[2] ?? '';

  switch (segment) {
    case 'review':
      return 'review';
    case 'content':
      return 'content';
    case 'users':
      return 'users';
    case 'data':
      return 'data';
    case 'media':
      return 'media';
    case 'practice':
      return 'practice';
    case 'categories':
      return 'categories';
    case 'settings':
      return 'settings';
    default:
      return 'dashboard';
  }
}

export function resolvePage(pathname: string): AdminPage {
  const segments = pathname.split('/').filter(Boolean);

  if (segments[1] === 'content') {
    if (segments[2] === 'new') return { kind: 'content-new' };
    if (segments[2]) return { kind: 'content-edit', id: decodeURIComponent(segments[2]) };
    return { kind: 'content-list' };
  }

  if (segments[1] === 'review') return { kind: 'review' };
  if (segments[1] === 'settings') return { kind: 'settings' };
  if (segments[1] === 'users') return { kind: 'users' };
  if (segments[1] === 'data') return { kind: 'data' };
  if (segments[1] === 'media') return { kind: 'media' };
  if (segments[1] === 'practice') return { kind: 'practice' };
  // 标签已合并进「分类与标签」，旧链接统一跳转
  if (segments[1] === 'tags') return { kind: 'categories' };
  if (segments[1] === 'categories') return { kind: 'categories' };
  if (segments[1] === 'password') return { kind: 'password' };

  return { kind: 'dashboard' };
}

/** 免登录的认证页路径：邀请、找回与重置密码 */
export function resolveAuthRoute(pathname: string): AuthRoute | null {
  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] !== 'admin') return null;
  if (segments[1] === 'accept-invite') return 'accept-invite';
  if (segments[1] === 'reset-password') return 'reset-password';
  if (segments[1] === 'forgot-password') return 'forgot-password';
  return null;
}
