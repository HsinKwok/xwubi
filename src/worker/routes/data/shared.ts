import type { Context } from 'hono';
import type { AppEnv } from '../../lib/env';
import { asString } from '../../lib/http';
import { loadSiteSettings, normalizeVersion as defaultSiteVersion } from '../../lib/settings';

export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXY'.split('');
export const MAX_CSV_BYTES = 200 * 1024;
export const MAX_IMPORT_ROWS = 1000;

export interface RootRow {
  id: string;
  version: string;
  key: string;
  mnemonic: string;
  roots: string;
  note: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ExampleRow {
  id: string;
  version: string;
  char: string;
  code: string;
  roots: string;
  note: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ImportError {
  line: number;
  message: string;
}

/** 站点配置中启用的码表版本（顺序与配置一致） */
export async function codeVersions(c: Context<AppEnv>): Promise<string[]> {
  const { config } = await loadSiteSettings(c.env);
  return config.versions.map((item) => item.value);
}

/** 站点配置中的默认码表版本 */
export async function defaultVersion(c: Context<AppEnv>): Promise<string> {
  const { config } = await loadSiteSettings(c.env);
  return defaultSiteVersion(undefined, config);
}

export async function normalizeVersion(
  value: unknown,
  c: Context<AppEnv>,
): Promise<string | null> {
  const version = asString(value).trim();
  if (!version) return null;
  return (await codeVersions(c)).includes(version) ? version : null;
}

/** 查询参数里的版本：缺省时取站点默认版本，非法值返回 null */
export async function resolveQueryVersion(
  value: string | undefined,
  c: Context<AppEnv>,
): Promise<string | null> {
  if (!asString(value).trim()) return defaultVersion(c);
  return normalizeVersion(value, c);
}

export function normalizeKey(value: unknown): string | null {
  const key = asString(value).trim().toUpperCase();
  return LETTERS.includes(key) ? key : null;
}

export function normalizeText(value: unknown, maxLength: number): string | null {
  const text = asString(value).trim();
  return text.length <= maxLength ? text : null;
}

/** 排序值限制在 0-9999 */
export function normalizeOrder(value: unknown): number {
  const parsed =
    typeof value === 'number' ? Math.trunc(value) : Number.parseInt(asString(value), 10);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(Math.max(parsed, 0), 9999);
}

export function parseCsv(text: string): string[][] {
  const source = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];

    if (quoted) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[index + 1] === '\n') index += 1;
      row.push(field);
      field = '';
      if (row.some((cell) => cell.trim() !== '')) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }

  row.push(field);
  if (row.some((cell) => cell.trim() !== '')) rows.push(row);

  return rows;
}
