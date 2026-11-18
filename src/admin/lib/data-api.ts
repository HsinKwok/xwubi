import { toQueryString } from '../../shared/query';
import { deleteJson, getJson, patchJson, postJson } from './api';
import type { WubiVersion } from '../types';

export type KeymapKind = 'roots' | 'examples';

export interface WubiRootItem {
  id: string;
  version: WubiVersion;
  key: string;
  mnemonic: string;
  roots: string;
  note: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface WubiExampleItem {
  id: string;
  version: WubiVersion;
  char: string;
  code: string;
  roots: string;
  note: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** 字根表单的可编辑字段，表格内联编辑与新增共用 */
export interface RootDraft {
  key: string;
  mnemonic: string;
  roots: string;
  note: string;
}

/** 例字表单的可编辑字段，表格内联编辑与新增共用 */
export interface ExampleDraft {
  char: string;
  code: string;
  roots: string;
  note: string;
}

export interface RootInput extends RootDraft {
  version: WubiVersion;
  sort_order: number;
}

export interface ExampleInput extends ExampleDraft {
  version: WubiVersion;
  sort_order: number;
}

export interface ExampleListResponse {
  version: WubiVersion;
  items: WubiExampleItem[];
  total: number;
  page: number;
  per_page: number;
}

export interface ImportReport {
  kind: KeymapKind;
  version: WubiVersion;
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: Array<{ line: number; message: string }>;
}

export interface MatrixVersion {
  version: WubiVersion;
  roots: {
    count: number;
    updated_at: string | null;
    missing_keys: string[];
  };
  examples: {
    count: number;
    updated_at: string | null;
  };
}

export function listRoots(
  version: WubiVersion,
  q: string,
  signal?: AbortSignal,
): Promise<{ version: WubiVersion; items: WubiRootItem[] }> {
  return getJson(`/api/admin/data/roots${toQueryString({ version, q })}`, signal);
}

export function createRoot(input: RootInput): Promise<{ item: WubiRootItem }> {
  return postJson('/api/admin/data/roots', input);
}

export function updateRoot(
  id: string,
  input: Partial<RootInput>,
): Promise<{ item: WubiRootItem }> {
  return patchJson(`/api/admin/data/roots/${encodeURIComponent(id)}`, input);
}

export function deleteRoot(id: string): Promise<{ ok: true }> {
  return deleteJson(`/api/admin/data/roots/${encodeURIComponent(id)}`);
}

export function listExamples(
  version: WubiVersion,
  q: string,
  page: number,
  perPage: number,
  signal?: AbortSignal,
): Promise<ExampleListResponse> {
  return getJson(
    `/api/admin/data/examples${toQueryString({
      version,
      q,
      page,
      per_page: perPage,
    })}`,
    signal,
  );
}

export function createExample(input: ExampleInput): Promise<{ item: WubiExampleItem }> {
  return postJson('/api/admin/data/examples', input);
}

export function updateExample(
  id: string,
  input: Partial<ExampleInput>,
): Promise<{ item: WubiExampleItem }> {
  return patchJson(`/api/admin/data/examples/${encodeURIComponent(id)}`, input);
}

export function deleteExample(id: string): Promise<{ ok: true }> {
  return deleteJson(`/api/admin/data/examples/${encodeURIComponent(id)}`);
}

export function importKeymap(input: {
  kind: KeymapKind;
  version: WubiVersion;
  csv: string;
}): Promise<ImportReport> {
  return postJson('/api/admin/data/import', input);
}

export function getMatrix(signal?: AbortSignal): Promise<{ versions: MatrixVersion[] }> {
  return getJson('/api/admin/data/matrix', signal);
}
