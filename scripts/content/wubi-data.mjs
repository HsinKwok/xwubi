// 从 migrations 中抽取字根与例字，供内容生成脚本使用。
// 只读取 INSERT 行，不改数据库；生成结果写入 seeds/ 下的 SQL。
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());
const VERSIONS = ['86', '98', 'xsj'];

export const VERSION_LABEL = { '86': '86 版', '98': '98 版', xsj: '新世纪版' };

function readMigrationSql() {
  const dir = path.join(ROOT, 'migrations');
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.sql'))
    .sort()
    .map((name) => fs.readFileSync(path.join(dir, name), 'utf8'))
    .join('\n');
}

/** 25 键口诀与代表字根：roots[version][key] = { mnemonic, roots } */
export function loadRoots() {
  const sql = readMigrationSql();
  const roots = Object.fromEntries(VERSIONS.map((version) => [version, {}]));
  const pattern = /'root_(86|98|xsj)_([A-Z])',\s*'(86|98|xsj)',\s*'([A-Z])',\s*'([^']*)',\s*'([^']*)'/g;
  let match;
  while ((match = pattern.exec(sql)) !== null) {
    const [, , , version, key, mnemonic, rootList] = match;
    roots[version][key] = { mnemonic, roots: rootList.split(',') };
  }
  return roots;
}

/** 例字编码：examples[version] = Map<char, code> */
export function loadExamples() {
  const sql = readMigrationSql();
  const examples = Object.fromEntries(VERSIONS.map((version) => [version, new Map()]));
  const pattern = /'ex_(86|98|xsj)_[^']*',\s*'(86|98|xsj)',\s*'([^']+)',\s*'([A-Za-z]+)'/g;
  let match;
  while ((match = pattern.exec(sql)) !== null) {
    const [, , version, char, code] = match;
    const map = examples[version];
    if (!map.has(char)) map.set(char, code.toUpperCase());
  }
  return examples;
}

export function sqlText(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

export function isoDate(dayOffset, base = Date.UTC(2026, 0, 5)) {
  return new Date(base + dayOffset * 86_400_000).toISOString();
}

/** 词组编码规则：二词各取两码，三词首字取一码，四词各取首码，多词取前三末一 */
export function wordCode(word, charCodes) {
  const codes = [...word].map((char) => charCodes.get(char)).filter(Boolean);
  if (codes.length !== [...word].length) return '';
  if (codes.length === 2) return `${codes[0].slice(0, 2)}${codes[1].slice(0, 2)}`;
  if (codes.length === 3) return `${codes[0][0]}${codes[1][0]}${codes[2].slice(0, 2)}`;
  if (codes.length === 4) return codes.map((code) => code[0]).join('');
  return `${codes[0][0]}${codes[1][0]}${codes[2][0]}${codes[codes.length - 1][0]}`;
}

/** 从例字库按首码键筛选，保证每个版本都有可用例字 */
export function pickChars(examples, chars, letters, limit = 8) {
  const map = examples;
  const pool = [];
  const seen = new Set();
  for (const char of chars) {
    if (seen.has(char)) continue;
    const code = map.get(char);
    if (!code) continue;
    if (letters.length > 0 && !letters.includes(code[0])) continue;
    seen.add(char);
    pool.push({ char, code });
    if (pool.length >= limit) return pool;
  }
  // 指定字不够时，从全库补足，仍按首码键过滤
  if (letters.length > 0) {
    for (const [char, code] of map) {
      if (seen.has(char) || !letters.includes(code[0])) continue;
      seen.add(char);
      pool.push({ char, code });
      if (pool.length >= limit) break;
    }
  }
  return pool;
}

export function examplesForVersion(examples, version) {
  return examples[version];
}

/** 按条数切分 SQL 文件，避免单次 d1 execute 请求体过大 */
export function writeSqlChunks(dir, prefix, resetLines, statements, size = 50) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${prefix}-00-reset.sql`), `${resetLines.join('\n')}\n`, 'utf8');
  let part = 0;
  for (let index = 0; index < statements.length; index += size) {
    part += 1;
    const name = `${prefix}-${String(part).padStart(2, '0')}.sql`;
    fs.writeFileSync(path.join(dir, name), `${statements.slice(index, index + size).join('\n')}\n`, 'utf8');
  }
  return part;
}
