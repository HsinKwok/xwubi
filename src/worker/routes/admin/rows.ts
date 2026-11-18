import type { StaffRole } from '../../lib/env';
import type { ContentRow } from '../../lib/content';
import { parseMeta } from '../../lib/content';

export interface SubmissionRow {
  id: string;
  kind: string;
  title: string;
  url: string | null;
  page_url: string | null;
  version: string | null;
  note: string;
  email: string;
  display_name: string | null;
  status: string;
  reject_reason: string | null;
  content_id: string | null;
  assignee_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeedbackRow {
  id: string;
  page_url: string;
  version: string | null;
  body: string;
  email: string | null;
  status: string;
  assignee_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface StaffRow {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  status: string;
  must_change_password: number;
  password_hash?: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CountRow {
  total: number;
}

export interface TagRow {
  id: string;
  name: string;
}

export interface SummaryRow {
  published: number;
  pending: number;
  submissions: number;
  feedback: number;
}

export interface QueueRow {
  id: string;
  title: string;
  type: string;
  version: string;
  updated_at: string;
  author_name: string | null;
}

export interface DistributionRow {
  type: string;
  count: number;
}

export interface ActivityRow {
  id: string;
  action: string;
  summary: string;
  created_at: string;
  actor: string | null;
}

export interface MediaRow {
  id: string;
  r2_key: string;
  filename: string;
  mime: string;
  size: number;
  version: string | null;
  alt: string;
  uploaded_by: string | null;
  created_at: string;
  uploader_name?: string | null;
}

/** 管理台列表行：不包含正文，减少 D1 读取与响应体积 */
export interface AdminContentSummaryRow {
  id: string;
  type: string;
  slug: string;
  version: string;
  title: string;
  summary: string;
  meta_json: string;
  stage: string | null;
  lesson_no: number | null;
  sort_order: number;
  status: string;
  author_name: string | null;
  assignee_id: string | null;
  verified_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export function mapSubmission(row: SubmissionRow) {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    url: row.url,
    page_url: row.page_url,
    version: row.version,
    note: row.note,
    email: row.email,
    display_name: row.display_name,
    status: row.status,
    reject_reason: row.reject_reason,
    content_id: row.content_id,
    assignee_id: row.assignee_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function mapFeedback(row: FeedbackRow) {
  return {
    id: row.id,
    page_url: row.page_url,
    version: row.version,
    body: row.body,
    email: row.email,
    status: row.status,
    assignee_id: row.assignee_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function mapAdminContentSummary(row: AdminContentSummaryRow) {
  return {
    id: row.id,
    type: row.type,
    slug: row.slug,
    version: row.version,
    title: row.title,
    summary: row.summary,
    body_md: '',
    meta: parseMeta(row.meta_json),
    stage: row.stage,
    lesson_no: row.lesson_no,
    sort_order: row.sort_order,
    status: row.status,
    author: row.author_name ?? null,
    assignee_id: row.assignee_id,
    verified_at: row.verified_at,
    published_at: row.published_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function mapAdminContent(row: ContentRow) {
  return {
    id: row.id,
    type: row.type,
    slug: row.slug,
    version: row.version,
    title: row.title,
    summary: row.summary,
    body_md: row.body_md,
    meta: parseMeta(row.meta_json),
    stage: row.stage,
    lesson_no: row.lesson_no,
    sort_order: row.sort_order,
    status: row.status,
    author: row.author_name ?? null,
    assignee_id: row.assignee_id,
    verified_at: row.verified_at,
    published_at: row.published_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function mapStaff(row: StaffRow) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    must_change_password: row.must_change_password === 1,
    last_login_at: row.last_login_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function mapMedia(row: MediaRow) {
  return {
    id: row.id,
    filename: row.filename,
    mime: row.mime,
    size: row.size,
    version: row.version,
    alt: row.alt,
    uploader: row.uploader_name ?? null,
    url: `/${row.r2_key}`,
    created_at: row.created_at,
  };
}
