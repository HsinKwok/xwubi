import type { SiteTheme, ThemeMode } from '../../shared/site-config';

const MODE_KEY = 'xwubi.theme';
const VERSION_KEY = 'xwubi.version';

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // 隐私模式下忽略
  }
}

export function readStoredMode(): ThemeMode | null {
  const value = readStorage(MODE_KEY);
  return value === 'light' || value === 'dark' ? value : null;
}

export function storeMode(mode: ThemeMode): void {
  writeStorage(MODE_KEY, mode);
}

export function readStoredVersion(): string | null {
  return readStorage(VERSION_KEY);
}

export function storeVersion(version: string): void {
  writeStorage(VERSION_KEY, version);
}

/** 把后端下发的主题 token 写到根元素，组件只消费变量 */
export function applyTheme(root: HTMLElement, theme: SiteTheme, mode: ThemeMode): void {
  const palette = theme[mode];

  root.style.setProperty('--brand', palette.brand);
  root.style.setProperty('--brand-strong', palette.brandStrong);
  root.style.setProperty('--ink', palette.ink);
  root.style.setProperty('--ink-muted', palette.inkMuted);
  root.style.setProperty('--line', palette.line);
  root.style.setProperty('--surface', palette.surface);
  root.style.setProperty('--surface-muted', palette.surfaceMuted);
  root.style.setProperty('--on-brand', palette.onBrand);
  root.style.setProperty('--font-sans', theme.fonts.sans);
  root.style.setProperty('--font-mono', theme.fonts.mono);
  root.style.setProperty('--radius', theme.radius);
  root.style.setProperty('--max-w', theme.maxWidth);

  root.dataset.theme = mode;
  root.style.colorScheme = mode;
}
