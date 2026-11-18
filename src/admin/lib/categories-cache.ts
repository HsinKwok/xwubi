import { getJson } from './api';
import type { CategoryDomain, CategoryItem } from './categories-api';
import { createResourceCache } from './resource-cache';

/** 分类变动不频繁：60 秒内复用内存快照，写入后主动刷新 */
const store = createResourceCache<CategoryItem[]>(
  async () => (await getJson<{ items: CategoryItem[] }>('/api/admin/categories')).items,
  60_000,
);

/** 读取分类：命中内存快照时不再走网络，可按 domain 过滤 */
export async function loadCategories(
  domain?: CategoryDomain,
  signal?: AbortSignal,
): Promise<{ items: CategoryItem[] }> {
  const items = await store.load(signal);
  return { items: domain ? items.filter((item) => item.domain === domain) : items };
}

/** 分类写入成功后强制刷新，并通知订阅者 */
export function refreshCategories(): Promise<CategoryItem[]> {
  return store.refresh();
}

export function subscribeCategories(listener: () => void): () => void {
  return store.subscribe(listener);
}
