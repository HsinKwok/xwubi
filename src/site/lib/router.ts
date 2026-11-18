const NAV_EVENT = 'xwubi:navigate';

export interface RouteMatch {
  pattern: string;
  params: Record<string, string>;
}

/** 支持 /news/:slug、/learn/:stage/:lesson 这类模式 */
export function matchRoute(pattern: string, pathname: string): RouteMatch | null {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = pathname.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i += 1) {
    const expected = patternParts[i];
    const actual = pathParts[i];

    if (expected.startsWith(':')) {
      params[expected.slice(1)] = decodeURIComponent(actual);
    } else if (expected !== actual) {
      return null;
    }
  }

  return { pattern, params };
}

export function navigate(href: string, options: { replace?: boolean } = {}): void {
  const url = new URL(href, window.location.origin);
  if (url.pathname === window.location.pathname && url.search === window.location.search) return;

  const method = options.replace ? 'replaceState' : 'pushState';
  window.history[method]({}, '', url.pathname + url.search + url.hash);
  window.dispatchEvent(new Event(NAV_EVENT));
}

export function subscribeToLocation(handler: (location: Location) => void): () => void {
  const listener = () => handler(window.location);

  window.addEventListener('popstate', listener);
  window.addEventListener(NAV_EVENT, listener);

  return () => {
    window.removeEventListener('popstate', listener);
    window.removeEventListener(NAV_EVENT, listener);
  };
}

export function currentSearch(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

/** 读取地址栏中的单个查询参数，缺失时返回空串 */
export function searchParam(name: string): string {
  return new URLSearchParams(window.location.search).get(name) ?? '';
}

/** 把筛选条件写回地址栏，刷新后可以还原 */
export function replaceSearch(params: Record<string, string>): void {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }

  const query = search.toString();
  const next = `${window.location.pathname}${query ? `?${query}` : ''}`;

  if (next !== `${window.location.pathname}${window.location.search}`) {
    window.history.replaceState({}, '', next);
  }
}
