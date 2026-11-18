import { getJson } from './api';
import type { TagItem } from './content-api';
import { createResourceCache } from './resource-cache';

/** 标签与分类同为低频数据，复用同一套快照逻辑 */
const store = createResourceCache<TagItem[]>(
  async () => (await getJson<{ items: TagItem[] }>('/api/admin/tags')).items,
  60_000,
);

/** 读取标签：命中内存快照时不再走网络 */
export async function loadTags(signal?: AbortSignal): Promise<{ items: TagItem[] }> {
  return { items: await store.load(signal) };
}

export function refreshTags(): Promise<TagItem[]> {
  return store.refresh();
}

export function subscribeTags(listener: () => void): () => void {
  return store.subscribe(listener);
}
