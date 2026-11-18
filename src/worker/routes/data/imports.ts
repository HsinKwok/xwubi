// CSV 导入入口：通用校验后按类型分派到字根表或例字表的行处理
import { Hono } from 'hono';
import type { AppEnv } from '../../lib/env';
import { writeAudit } from '../../lib/audit';
import { asString, fail, readJson } from '../../lib/http';
import { nowIso } from '../../lib/ids';
import { requireRole } from '../../lib/session';
import { bumpEpoch } from '../../lib/settings';
import { importMatrixRoutes } from './imports-matrix';
import { importExampleRows, importRootRows } from './imports-sources';
import { MAX_CSV_BYTES, MAX_IMPORT_ROWS, normalizeVersion, parseCsv } from './shared';

export const importRoutes = new Hono<AppEnv>();

const requireAdmin = requireRole('admin');

importRoutes.route('/', importMatrixRoutes);

importRoutes.post('/', requireAdmin, async (c) => {
  const body = await readJson<Record<string, unknown>>(c);
  if (!body) return fail(c, 400, 'invalid_request', '请求体必须是 JSON');

  const kind = asString(body.kind);
  const version = await normalizeVersion(body.version, c);
  const csv = asString(body.csv);

  if (kind !== 'roots' && kind !== 'examples') {
    return fail(c, 400, 'invalid_kind', '导入类型必须是 roots 或 examples');
  }
  if (!version) return fail(c, 400, 'invalid_version', '码表版本不合法');
  if (!csv.trim()) return fail(c, 400, 'empty_csv', 'CSV 内容为空');
  if (new TextEncoder().encode(csv).length > MAX_CSV_BYTES) {
    return fail(c, 413, 'csv_too_large', 'CSV 不能超过 200KB');
  }

  const rows = parseCsv(csv);
  if (rows.length < 2) return fail(c, 400, 'empty_csv', 'CSV 需要表头和数据行');

  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  const dataRows = rows.slice(1);
  if (dataRows.length > MAX_IMPORT_ROWS) {
    return fail(c, 413, 'too_many_rows', `单次最多导入 ${MAX_IMPORT_ROWS} 行`);
  }

  const now = nowIso();
  const outcome =
    kind === 'roots'
      ? await importRootRows(c, header, dataRows, version, now)
      : await importExampleRows(c, header, dataRows, version, now);

  if ('error' in outcome) {
    return fail(c, 400, outcome.error.code, outcome.error.message);
  }

  const { inserted, updated, skipped, errors } = outcome;
  if (inserted + updated > 0) await bumpEpoch(c.env);

  await writeAudit(c, {
    action: 'data.import',
    targetType: kind === 'roots' ? 'wubi_roots' : 'wubi_examples',
    targetId: version,
    summary: `${version} · 新增 ${inserted} / 更新 ${updated} / 跳过 ${skipped}`,
  });

  return c.json({
    kind,
    version,
    total: dataRows.length,
    inserted,
    updated,
    skipped,
    errors: errors.slice(0, 100),
  });
});
