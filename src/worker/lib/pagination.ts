export const DEFAULT_PAGE_SIZE = 100;
export const MAX_PAGE_SIZE = 200;

/** 页码从 1 开始，非法值回到第一页 */
export function normalizePage(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

/** 每页条数限制在 1-200，避免一次拉回整张表 */
export function normalizePageSize(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_PAGE_SIZE;
  return Math.min(parsed, MAX_PAGE_SIZE);
}
