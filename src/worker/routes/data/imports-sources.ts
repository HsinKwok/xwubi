// CSV 导入的行处理：分别把解析后的数据行写入 wubi_roots 与 wubi_examples
import type { Context } from 'hono';
import type { AppEnv } from '../../lib/env';
import { newId } from '../../lib/ids';
import {
  type ImportError,
  normalizeKey,
  normalizeOrder,
  normalizeText,
} from './shared';

export interface ImportOutcome {
  inserted: number;
  updated: number;
  skipped: number;
  errors: ImportError[];
}

export interface ImportFailure {
  error: { code: string; message: string };
}

/** 字根表导入：key 为 A-Y 单字母，已存在的键位做更新，其余新增 */
export async function importRootRows(
  c: Context<AppEnv>,
  header: string[],
  dataRows: string[][],
  version: string,
  now: string,
): Promise<ImportOutcome | ImportFailure> {
  const keyIndex = header.indexOf('key');
  if (keyIndex === -1) {
    return { error: { code: 'invalid_header', message: 'CSV 缺少 key 列' } };
  }

  const mnemonicIndex = header.indexOf('mnemonic');
  const rootsIndex = header.indexOf('roots');
  const noteIndex = header.indexOf('note');
  const orderIndex = header.indexOf('sort_order');

  const { results: existingRows } = await c.env.DB.prepare(
    'SELECT key FROM wubi_roots WHERE version = ?',
  )
    .bind(version)
    .all<{ key: string }>();
  const existing = new Set((existingRows ?? []).map((row) => row.key));
  const seen = new Set<string>();
  const statements: D1PreparedStatement[] = [];

  const errors: ImportError[] = [];
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  dataRows.forEach((row, index) => {
    const line = index + 2;
    const key = normalizeKey(row[keyIndex]);
    if (!key) {
      errors.push({ line, message: 'key 必须是 A-Y 的单个字母' });
      skipped += 1;
      return;
    }
    if (seen.has(key)) {
      errors.push({ line, message: `键位 ${key} 在文件中重复` });
      skipped += 1;
      return;
    }
    seen.add(key);

    const mnemonic = normalizeText(row[mnemonicIndex] ?? '', 120);
    const roots = normalizeText(row[rootsIndex] ?? '', 300);
    const note = normalizeText(row[noteIndex] ?? '', 500);
    if (mnemonic === null || roots === null || note === null) {
      errors.push({ line, message: '字段超出长度限制' });
      skipped += 1;
      return;
    }

    const sortOrder = normalizeOrder(orderIndex === -1 ? 0 : row[orderIndex]);
    if (existing.has(key)) {
      statements.push(
        c.env.DB.prepare(
          `UPDATE wubi_roots
           SET mnemonic = ?, roots = ?, note = ?, sort_order = ?, updated_at = ?
           WHERE version = ? AND key = ?`,
        ).bind(mnemonic, roots, note || null, sortOrder, now, version, key),
      );
      updated += 1;
    } else {
      statements.push(
        c.env.DB.prepare(
          `INSERT INTO wubi_roots
             (id, version, key, mnemonic, roots, note, sort_order, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).bind(newId('root'), version, key, mnemonic, roots, note || null, sortOrder, now, now),
      );
      inserted += 1;
    }
  });

  for (let offset = 0; offset < statements.length; offset += 50) {
    await c.env.DB.batch(statements.slice(offset, offset + 50));
  }

  return { inserted, updated, skipped, errors };
}

/** 例字表导入：char 为单个汉字，code 为 1-8 位大写字母 */
export async function importExampleRows(
  c: Context<AppEnv>,
  header: string[],
  dataRows: string[][],
  version: string,
  now: string,
): Promise<ImportOutcome | ImportFailure> {
  const charIndex = header.indexOf('char');
  const codeIndex = header.indexOf('code');
  if (charIndex === -1 || codeIndex === -1) {
    return { error: { code: 'invalid_header', message: 'CSV 需要 char 和 code 列' } };
  }

  const rootsIndex = header.indexOf('roots');
  const noteIndex = header.indexOf('note');
  const orderIndex = header.indexOf('sort_order');

  const { results: existingRows } = await c.env.DB.prepare(
    'SELECT char FROM wubi_examples WHERE version = ?',
  )
    .bind(version)
    .all<{ char: string }>();
  const existing = new Set((existingRows ?? []).map((row) => row.char));
  const seen = new Set<string>();
  const statements: D1PreparedStatement[] = [];

  const errors: ImportError[] = [];
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  dataRows.forEach((row, index) => {
    const line = index + 2;
    const char = (row[charIndex] ?? '').trim();
    const code = (row[codeIndex] ?? '').trim().toUpperCase();

    if (char.length !== 1) {
      errors.push({ line, message: 'char 必须是单个汉字' });
      skipped += 1;
      return;
    }
    if (!/^[A-Z]{1,8}$/.test(code)) {
      errors.push({ line, message: 'code 需为 1-8 位大写字母' });
      skipped += 1;
      return;
    }
    if (seen.has(char)) {
      errors.push({ line, message: `例字 ${char} 在文件中重复` });
      skipped += 1;
      return;
    }
    seen.add(char);

    const roots = normalizeText(row[rootsIndex] ?? '', 300);
    const note = normalizeText(row[noteIndex] ?? '', 500);
    if (roots === null || note === null) {
      errors.push({ line, message: '字段超出长度限制' });
      skipped += 1;
      return;
    }

    const sortOrder = normalizeOrder(orderIndex === -1 ? 0 : row[orderIndex]);
    if (existing.has(char)) {
      statements.push(
        c.env.DB.prepare(
          `UPDATE wubi_examples
           SET code = ?, roots = ?, note = ?, sort_order = ?, updated_at = ?
           WHERE version = ? AND char = ?`,
        ).bind(code, roots, note || null, sortOrder, now, version, char),
      );
      updated += 1;
    } else {
      statements.push(
        c.env.DB.prepare(
          `INSERT INTO wubi_examples
             (id, version, char, code, roots, note, sort_order, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).bind(newId('ex'), version, char, code, roots, note || null, sortOrder, now, now),
      );
      inserted += 1;
    }
  });

  for (let offset = 0; offset < statements.length; offset += 50) {
    await c.env.DB.batch(statements.slice(offset, offset + 50));
  }

  return { inserted, updated, skipped, errors };
}
