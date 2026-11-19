import type {
  AdminContentItem,
  ContentInput,
  ContentType,
  ContentVersion,
} from '../../lib/content-api';
import { joinList, splitList } from './content-meta';
import { defaultVersion } from '../../lib/versions';

export interface ContentFormState {
  type: ContentType;
  version: ContentVersion;
  title: string;
  slug: string;
  summary: string;
  body_md: string;
  stage: string;
  lesson_no: string;
  sort_order: string;
  examples: string;
  duration_min: string;
  platforms: string;
  license: string;
  official_url: string;
  source_url: string;
  source_name: string;
  format: string;
  tagIds: string[];
}

function text(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
}

export function emptyForm(type: ContentType = 'lesson'): ContentFormState {
  return {
    type,
    version: defaultVersion(),
    title: '',
    slug: '',
    summary: '',
    body_md: '',
    stage: '',
    lesson_no: '',
    sort_order: '0',
    examples: '',
    duration_min: '',
    platforms: '',
    license: '',
    official_url: '',
    source_url: '',
    source_name: '',
    format: '',
    tagIds: [],
  };
}

export function formFromItem(item: AdminContentItem): ContentFormState {
  const meta = item.meta ?? {};

  return {
    type: item.type,
    version: item.version,
    title: item.title,
    slug: item.slug,
    summary: item.summary,
    body_md: item.body_md,
    stage: item.stage ?? '',
    lesson_no: item.lesson_no === null ? '' : String(item.lesson_no),
    sort_order: String(item.sort_order ?? 0),
    examples: joinList(meta.examples),
    duration_min: text(meta.duration_min),
    platforms: joinList(meta.platforms),
    license: text(meta.license),
    official_url: text(meta.official_url),
    source_url: text(meta.source_url),
    source_name: text(meta.source_name),
    format: text(meta.format),
    tagIds: (item.tags ?? []).map((tag) => tag.id),
  };
}

/** 用于判断表单是否有未保存改动 */
export function snapshot(form: ContentFormState): string {
  return JSON.stringify(form);
}

function numberOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

function optional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * 合并扩展字段：保留后端已有的未知键，只覆盖当前类型对应的已知键。
 */
export function buildMeta(
  form: ContentFormState,
  item: AdminContentItem | null,
): Record<string, unknown> {
  const meta: Record<string, unknown> = item?.meta ? { ...item.meta } : {};

  switch (form.type) {
    case 'lesson': {
      meta.examples = splitList(form.examples);
      const duration = numberOrNull(form.duration_min);
      if (duration === null) delete meta.duration_min;
      else meta.duration_min = duration;
      break;
    }
    case 'news': {
      meta.source_url = form.source_url.trim();
      const name = optional(form.source_name);
      if (name) meta.source_name = name;
      else delete meta.source_name;
      break;
    }
    case 'software': {
      meta.platforms = splitList(form.platforms);
      const license = optional(form.license);
      if (license) meta.license = license;
      else delete meta.license;
      const url = optional(form.official_url);
      if (url) meta.official_url = url;
      else delete meta.official_url;
      break;
    }
    case 'tool': {
      const format = optional(form.format);
      if (format) meta.format = format;
      else delete meta.format;
      break;
    }
    default:
      break;
  }

  return meta;
}

export function buildInput(form: ContentFormState, item: AdminContentItem | null): ContentInput {
  const input: ContentInput = {
    type: form.type,
    title: form.title.trim(),
    slug: optional(form.slug),
    version: form.version,
    summary: form.summary,
    body_md: form.body_md,
    meta: buildMeta(form, item),
    stage: optional(form.stage) ?? null,
    lesson_no: numberOrNull(form.lesson_no),
    sort_order: numberOrNull(form.sort_order) ?? 0,
    tag_ids: form.tagIds,
  };

  if (item) {
    input.expected_updated_at = item.updated_at;
  }

  return input;
}
