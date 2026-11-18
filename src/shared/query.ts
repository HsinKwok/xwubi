type QueryValue = string | number | boolean | null | undefined;

/**
 * 把筛选参数拼成查询串：跳过空值，其余统一转字符串。
 * 没有有效字段时返回空串，调用方可直接拼在路径后面。
 */
export function toQueryString(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}
