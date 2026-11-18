// 投稿页共用类型与文案兜底：投稿类型、提示信息与各类型的默认名称
import type { SiteConfig } from '../../../shared/site-config';

export type SubmissionKind = 'news' | 'correction' | 'software';

export interface Notice {
  tone: 'ok' | 'error';
  text: string;
}

export const KIND_FALLBACKS: Record<SubmissionKind, string> = {
  news: '资讯投稿',
  software: '软件推荐',
  correction: '页面纠错',
};

export const KIND_LABEL_KEYS: Record<SubmissionKind, string> = {
  news: 'submitKindNews',
  software: 'submitKindSoftware',
  correction: 'submitKindCorrection',
};

/** 投稿类型展示名：优先取后台文案，其次默认名称，未知类型原样返回 */
export function submissionKindLabel(labels: SiteConfig['labels'], kind: string): string {
  const key = KIND_LABEL_KEYS[kind as SubmissionKind];
  return (key ? labels[key] : undefined) ?? KIND_FALLBACKS[kind as SubmissionKind] ?? kind;
}
