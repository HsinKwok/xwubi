import type { BootstrapPayload } from '../../shared/site-config';
import { getJson } from './api';

/** 站点配置在浏览器内的复用时长，与公开接口边缘缓存保持一致 */
const BOOTSTRAP_TTL_MS = 300_000;
const STORAGE_PREFIX = 'xwubi.bootstrap:';

interface CacheEntry {
  payload: BootstrapPayload;
  at: number;
}

const cache = new Map<string, CacheEntry>();

function cacheKey(version: string | null): string {
  return version ?? '';
}

function storageKey(version: string | null): string {
  return `${STORAGE_PREFIX}${version ?? 'default'}`;
}

function readStored(version: string | null): CacheEntry | null {
  try {
    const raw = sessionStorage.getItem(storageKey(version));
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (!entry?.payload || Date.now() - entry.at > BOOTSTRAP_TTL_MS) {
      sessionStorage.removeItem(storageKey(version));
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

function writeStored(version: string | null, entry: CacheEntry): void {
  try {
    sessionStorage.setItem(storageKey(version), JSON.stringify(entry));
  } catch {
    // 隐私模式或容量不足时忽略持久化失败
  }
}

/** 读取站点配置：内存优先，刷新页面后回退到 sessionStorage */
export function readCachedBootstrap(version: string | null): BootstrapPayload | null {
  const key = cacheKey(version);
  const memory = cache.get(key);
  if (memory) {
    if (Date.now() - memory.at <= BOOTSTRAP_TTL_MS) return memory.payload;
    cache.delete(key);
  }

  const stored = readStored(version);
  if (!stored) return null;

  cache.set(key, stored);
  cache.set(cacheKey(stored.payload.meta.version), stored);
  return stored.payload;
}

/**
 * 加载站点配置：同一版本在有效期内直接复用。
 * 首次不带 version 的请求结果会同时写入默认版本键，避免版本回填后重复请求。
 */
export async function fetchBootstrap(
  version: string | null,
  signal: AbortSignal,
  force = false,
): Promise<BootstrapPayload> {
  if (!force) {
    const cached = readCachedBootstrap(version);
    if (cached) return cached;
  }

  const query = version ? `?version=${encodeURIComponent(version)}` : '';
  const payload = await getJson<BootstrapPayload>(`/api/site/bootstrap${query}`, signal);
  const entry: CacheEntry = { payload, at: Date.now() };

  cache.set(cacheKey(version), entry);
  cache.set(cacheKey(payload.meta.version), entry);
  writeStored(version, entry);
  writeStored(payload.meta.version, entry);
  return payload;
}
