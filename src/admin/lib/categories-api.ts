import { deleteJson, patchJson, postJson } from './api';
import { loadCategories, refreshCategories } from './categories-cache';

/** 统一分类：内容类型、教学阶段、篇目分类、码表分区与码表版本 */
export type CategoryDomain =
  | 'content_type'
  | 'lesson_stage'
  | 'practice_genre'
  | 'keymap_zone'
  | 'keymap_version';

export interface CategoryItem {
  id: string;
  domain: CategoryDomain;
  slug: string;
  label: string;
  hint: string;
  key_list: string;
  sort_order: number;
  /** 仅 content_type 使用：前台路径前缀 */
  route: string;
  created_at: string;
  updated_at: string;
  /** 引用数：被内容/篇目/字根等使用的次数 */
  count?: number;
}

export interface CategoryInput {
  domain: CategoryDomain;
  slug: string;
  label: string;
  hint: string;
  key_list: string;
  sort_order: number;
  route?: string;
}

export function listCategories(
  domain?: CategoryDomain,
  signal?: AbortSignal,
): Promise<{ items: CategoryItem[] }> {
  return loadCategories(domain, signal);
}

export async function createCategory(input: CategoryInput): Promise<{ item: CategoryItem }> {
  const result = await postJson<{ item: CategoryItem }>('/api/admin/categories', input);
  await refreshCategories();
  return result;
}

export async function updateCategory(
  id: string,
  input: Partial<Omit<CategoryInput, 'domain'>>,
): Promise<{ item: CategoryItem }> {
  const result = await patchJson<{ item: CategoryItem }>(
    `/api/admin/categories/${encodeURIComponent(id)}`,
    input,
  );
  await refreshCategories();
  return result;
}

export async function deleteCategory(id: string): Promise<{ ok: boolean }> {
  const result = await deleteJson<{ ok: boolean }>(
    `/api/admin/categories/${encodeURIComponent(id)}`,
  );
  await refreshCategories();
  return result;
}
