import { toQueryString } from '../../shared/query';
import { deleteJson, getJson, patchJson, postForm, postJson } from './api';

export interface MediaItem {
  id: string;
  filename: string;
  mime: string;
  size: number;
  version: string | null;
  alt: string;
  uploader: string | null;
  url: string;
  created_at: string;
}

export interface MediaListQuery {
  q?: string;
  version?: string;
  page?: number;
  per_page?: number;
}

export interface MediaListResponse {
  items: MediaItem[];
  total: number;
  page: number;
  per_page: number;
}

export interface MediaItemResponse {
  item: MediaItem;
}

export function listMedia(params: MediaListQuery = {}, signal?: AbortSignal) {
  const query = toQueryString({
    q: params.q,
    version: params.version,
    page: params.page && params.page > 1 ? params.page : undefined,
    per_page: params.per_page,
  });
  return getJson<MediaListResponse>(`/api/admin/media${query}`, signal);
}

export function uploadMedia(file: File, alt = '', version = '') {
  const form = new FormData();
  form.append('file', file);
  if (alt) form.append('alt', alt);
  if (version) form.append('version', version);
  return postForm<MediaItemResponse>('/api/admin/media', form);
}

export function updateMedia(id: string, input: { alt?: string; version?: string }) {
  return patchJson<MediaItemResponse>(`/api/admin/media/${encodeURIComponent(id)}`, input);
}

export function deleteMedia(id: string) {
  return deleteJson<{ ok: true }>(`/api/admin/media/${encodeURIComponent(id)}`);
}

export function deleteMediaBatch(ids: string[]) {
  return postJson<{ ok: true; deleted: number }>('/api/admin/media/batch-delete', { ids });
}
