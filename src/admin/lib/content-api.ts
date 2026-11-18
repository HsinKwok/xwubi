import { toQueryString } from '../../shared/query';
import { deleteJson, getJson, patchJson, postJson } from './api';
import { loadTags, refreshTags } from './tags-cache';

/** 内容类型由后台分类表维护，这里是字符串标识，不在前端枚举 */
export type ContentType = string;
/** 版本取值来自站点配置（GET /api/admin/versions），all 表示通用 */
export type ContentVersion = string;
export type ContentStatus = 'draft' | 'pending' | 'published' | 'needs_review' | 'archived';

export interface TagItem {
  id: string;
  name: string;
  count?: number;
}

export interface AdminContentItem {
  id: string;
  type: ContentType;
  slug: string;
  version: ContentVersion;
  title: string;
  summary: string;
  body_md: string;
  meta: Record<string, unknown>;
  stage: string | null;
  lesson_no: number | null;
  sort_order: number;
  status: ContentStatus;
  author: string | null;
  assignee_id: string | null;
  verified_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  tags?: TagItem[];
}

export interface ContentListQuery {
  q?: string;
  type?: string;
  version?: string;
  status?: string;
  page?: number;
  per_page?: number;
}

export interface ContentListResponse {
  items: AdminContentItem[];
  total: number;
  page: number;
  per_page: number;
}

export interface ContentItemResponse {
  item: AdminContentItem;
}

export interface RevisionItem {
  id: number;
  revision_no: number;
  title: string;
  note: string | null;
  created_at: string;
  editor: string | null;
}

export interface ReviewQueueItem {
  id: string;
  title: string;
  type: ContentType;
  version: ContentVersion;
  stage: string | null;
  status: ContentStatus;
  author: string | null;
  updated_at: string;
  problems: string[];
  ready: boolean;
}

export interface ReviewQueueResponse {
  items: ReviewQueueItem[];
  counts: {
    pending: number;
    needs_review: number;
    ready: number;
    blocked: number;
  };
  generated_at: string;
}

/** 新建与更新共用的可写字段（更新时只识别后端白名单内的字段） */
export interface ContentInput {
  type?: ContentType;
  title: string;
  slug?: string;
  version: ContentVersion;
  summary: string;
  body_md: string;
  meta: Record<string, unknown>;
  stage: string | null;
  lesson_no: number | null;
  sort_order: number;
  verified_at?: string;
  expected_updated_at?: string;
  tag_ids?: string[];
}

export function listContent(params: ContentListQuery, signal?: AbortSignal) {
  const query = toQueryString({
    q: params.q,
    type: params.type,
    version: params.version,
    status: params.status,
    page: params.page && params.page > 1 ? params.page : undefined,
    per_page: params.per_page,
  });
  return getJson<ContentListResponse>(`/api/admin/content${query}`, signal);
}

export function getContent(id: string, signal?: AbortSignal) {
  return getJson<ContentItemResponse>(`/api/admin/content/${encodeURIComponent(id)}`, signal);
}

export function createContent(input: ContentInput) {
  return postJson<ContentItemResponse>('/api/admin/content', input);
}

export function updateContent(id: string, input: Partial<ContentInput>) {
  return patchJson<ContentItemResponse>(`/api/admin/content/${encodeURIComponent(id)}`, input);
}

export function submitContent(id: string) {
  return postJson<{ ok: true; status: ContentStatus }>(
    `/api/admin/content/${encodeURIComponent(id)}/submit`,
  );
}

export function publishContent(id: string) {
  return postJson<{ ok: true; status: ContentStatus; published_at: string }>(
    `/api/admin/content/${encodeURIComponent(id)}/publish`,
  );
}

export function unpublishContent(id: string) {
  return postJson<{ ok: true; status: ContentStatus }>(
    `/api/admin/content/${encodeURIComponent(id)}/unpublish`,
  );
}

export function archiveContent(id: string) {
  return postJson<{ ok: true; status: ContentStatus }>(
    `/api/admin/content/${encodeURIComponent(id)}/archive`,
  );
}

export function rejectContent(id: string, note?: string) {
  return postJson<{ ok: true; status: ContentStatus }>(
    `/api/admin/content/${encodeURIComponent(id)}/reject`,
    { note: note ?? '' },
  );
}

export function listReviewQueue(
  params: { type?: string; version?: string },
  signal?: AbortSignal,
) {
  return getJson<ReviewQueueResponse>(
    `/api/admin/review${toQueryString({ type: params.type, version: params.version })}`,
    signal,
  );
}

export function listRevisions(id: string, signal?: AbortSignal) {
  return getJson<{ items: RevisionItem[] }>(
    `/api/admin/content/${encodeURIComponent(id)}/revisions`,
    signal,
  );
}

export function restoreRevision(
  contentId: string,
  revisionId: number,
  expectedUpdatedAt?: string,
) {
  return postJson<{ item: AdminContentItem | null; revision_no: number }>(
    `/api/admin/content/${encodeURIComponent(contentId)}/revisions/${revisionId}/restore`,
    expectedUpdatedAt ? { expected_updated_at: expectedUpdatedAt } : {},
  );
}

export function listTags(signal?: AbortSignal) {
  return loadTags(signal);
}

export async function createTag(input: { name: string }) {
  const result = await postJson<{ item: TagItem }>('/api/admin/tags', input);
  await refreshTags();
  return result;
}

export async function updateTag(id: string, input: { name: string }) {
  const result = await patchJson<{ item: TagItem }>(
    `/api/admin/tags/${encodeURIComponent(id)}`,
    input,
  );
  await refreshTags();
  return result;
}

export async function deleteTag(id: string) {
  const result = await deleteJson<{ ok: true }>(`/api/admin/tags/${encodeURIComponent(id)}`);
  await refreshTags();
  return result;
}
