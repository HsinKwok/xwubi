import { deleteJson, getJson, patchJson, postJson } from './api';

/** 文章跟打篇目：与前台 /api/site/texts 对应 */
/** 篇目分类取值来自后台「分类管理」的文章分类 */
export type PracticeGenre = string;

export interface PracticeTextSummary {
  id: string;
  title: string;
  author: string;
  dynasty: string;
  genre: PracticeGenre | string;
  char_count: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PracticeTextDetail extends PracticeTextSummary {
  body: string;
}

export interface PracticeTextInput {
  title: string;
  author: string;
  dynasty: string;
  genre: PracticeGenre;
  body: string;
  sort_order: number;
}

export interface PracticeTextListPayload {
  items: PracticeTextSummary[];
  total: number;
}

export function listPracticeTexts(signal?: AbortSignal): Promise<PracticeTextListPayload> {
  return getJson<PracticeTextListPayload>('/api/admin/practice-texts', signal);
}

export function getPracticeText(
  id: string,
  signal?: AbortSignal,
): Promise<{ item: PracticeTextDetail }> {
  return getJson<{ item: PracticeTextDetail }>(
    `/api/admin/practice-texts/${encodeURIComponent(id)}`,
    signal,
  );
}

export function createPracticeText(
  input: PracticeTextInput,
): Promise<{ item: PracticeTextDetail }> {
  return postJson<{ item: PracticeTextDetail }>('/api/admin/practice-texts', input);
}

export function updatePracticeText(
  id: string,
  input: Partial<PracticeTextInput>,
): Promise<{ item: PracticeTextDetail }> {
  return patchJson<{ item: PracticeTextDetail }>(
    `/api/admin/practice-texts/${encodeURIComponent(id)}`,
    input,
  );
}

export function deletePracticeText(id: string): Promise<{ ok: boolean }> {
  return deleteJson<{ ok: boolean }>(`/api/admin/practice-texts/${encodeURIComponent(id)}`);
}

export function deletePracticeTexts(ids: string[]): Promise<{ ok: true; deleted: number }> {
  return postJson('/api/admin/practice-texts/batch-delete', { ids });
}
