import { toQueryString } from '../../shared/query';
import { getJson, patchJson } from './api';

export const SUBMISSION_KINDS = ['news', 'correction', 'software'] as const;
export type SubmissionKind = (typeof SUBMISSION_KINDS)[number];

export const SUBMISSION_STATUSES = [
  'new',
  'confirmed',
  'claimed',
  'accepted',
  'rejected',
  'spam',
] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const FEEDBACK_STATUSES = ['open', 'assigned', 'fixed', 'closed', 'spam'] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export interface SubmissionItem {
  id: string;
  kind: SubmissionKind;
  title: string;
  url: string | null;
  page_url: string | null;
  version: string | null;
  note: string;
  email: string;
  display_name: string | null;
  status: SubmissionStatus;
  reject_reason: string | null;
  content_id: string | null;
  assignee_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeedbackItem {
  id: string;
  page_url: string;
  version: string | null;
  body: string;
  email: string | null;
  status: FeedbackStatus;
  assignee_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface InboxListResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  counts: Record<string, number>;
}

export interface InboxQuery {
  status?: string;
  kind?: string;
  q?: string;
  page?: number;
  per_page?: number;
}

function toQuery(params: InboxQuery): string {
  return toQueryString({
    status: params.status,
    kind: params.kind,
    q: params.q,
    page: params.page && params.page > 1 ? params.page : undefined,
    per_page: params.per_page,
  });
}

export function listSubmissions(params: InboxQuery, signal?: AbortSignal) {
  return getJson<InboxListResponse<SubmissionItem>>(
    `/api/admin/submissions${toQuery(params)}`,
    signal,
  );
}

export function updateSubmission(
  id: string,
  input: { status: SubmissionStatus; reject_reason?: string },
) {
  return patchJson<{ ok: true; status: SubmissionStatus }>(
    `/api/admin/submissions/${encodeURIComponent(id)}`,
    input,
  );
}

export function listFeedback(params: InboxQuery, signal?: AbortSignal) {
  return getJson<InboxListResponse<FeedbackItem>>(`/api/admin/feedback${toQuery(params)}`, signal);
}

export function updateFeedback(id: string, input: { status: FeedbackStatus }) {
  return patchJson<{ ok: true; status: FeedbackStatus }>(
    `/api/admin/feedback/${encodeURIComponent(id)}`,
    input,
  );
}
