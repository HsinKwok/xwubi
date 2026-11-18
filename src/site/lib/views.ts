import type { BootstrapPayload } from '../../shared/site-config';

/** 前台路由视图：由路径与后台配置共同解析 */
export type View =
  | { name: 'home' }
  | { name: 'collection'; type: string }
  | { name: 'content'; type: string; slug: string }
  | { name: 'about' }
  | { name: 'login' }
  | { name: 'submit' }
  | { name: 'submit-confirm' }
  | { name: 'submit-status' }
  | { name: 'feedback-status' }
  | { name: 'profile' }
  | { name: 'keymap' }
  | { name: 'practice' }
  | { name: 'notfound' };

/** 把路径解析为视图；固定工具页优先于内容类型前缀 */
export function resolveView(boot: BootstrapPayload, pathname: string): View {
  if (pathname === '/' || pathname === '') return { name: 'home' };
  if (pathname === '/about') return { name: 'about' };
  if (pathname === '/login') return { name: 'login' };
  if (pathname === '/submit') return { name: 'submit' };
  if (pathname === '/submit/confirm') return { name: 'submit-confirm' };
  if (pathname === '/submit/status') return { name: 'submit-status' };
  if (pathname === '/feedback/status') return { name: 'feedback-status' };
  if (pathname === '/profile') return { name: 'profile' };
  // 固定工具页优先于内容类型前缀，避免 /tools/keymap 被当成工具条目
  if (pathname === '/tools/keymap') return { name: 'keymap' };
  if (pathname === '/practice') return { name: 'practice' };

  // 内容类型由后台维护：路径前缀即列表页，前缀后接 slug 即详情页
  const types = boot.types ?? [];
  const typeMatch = types.find((type) => type.route && pathname.startsWith(`${type.route}/`));
  if (typeMatch) {
    const slug = pathname
      .slice(typeMatch.route.length + 1)
      .split('/')
      .filter(Boolean)
      .pop();
    if (slug) return { name: 'content', type: typeMatch.slug, slug };
  }

  const collectionMatch = types.find((type) => type.route === pathname);
  if (collectionMatch) return { name: 'collection', type: collectionMatch.slug };

  // 兼容尚未迁移到 types 的旧配置
  const navMatch = boot.nav.find((item) => item.collection && item.href === pathname);
  if (navMatch?.collection) return { name: 'collection', type: navMatch.collection };

  return { name: 'notfound' };
}
