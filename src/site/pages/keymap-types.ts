import type { SiteCategory } from '../../shared/site-config';

export interface KeymapRoot {
  key: string;
  mnemonic: string;
  roots: string;
  note: string | null;
  sort_order: number;
}

export interface KeymapExample {
  char: string;
  code: string;
  roots: string;
  note: string | null;
  sort_order: number;
}

export interface KeymapPayload {
  version: string;
  roots: KeymapRoot[];
  zones?: SiteCategory[];
  /** 每个键位最多 6 条代表例字，按编码首字母分组 */
  related: Record<string, KeymapExample[]>;
  counts: { roots: number; examples: number };
}

export interface ExampleListPayload {
  version: string;
  items: KeymapExample[];
  total: number;
  page: number;
  per_page: number;
}

export const KEYMAP_PAGE_SIZE = 50;
