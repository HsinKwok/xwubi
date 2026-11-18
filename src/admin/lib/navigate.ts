import type { MouseEvent as ReactMouseEvent } from 'react';

/** 站内链接拦截：保留新标签页、组合键等浏览器原生行为 */
export function createNavigateHandler(onNavigate?: (href: string) => void) {
  return (event: ReactMouseEvent<HTMLAnchorElement>, href: string) => {
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
    onNavigate(href);
  };
}
