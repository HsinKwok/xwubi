// 分类查询接口：按分类类型筛选并附带使用量统计
import { Hono } from 'hono';
import type { AppEnv } from '../../lib/env';
import { isCategoryDomain, listCategoriesWithUsage } from '../../lib/categories';

export const categoriesReadRoutes = new Hono<AppEnv>();

categoriesReadRoutes.get('/', async (c) => {
  const domain = c.req.query('domain');
  const rows = await listCategoriesWithUsage(
    c.env,
    isCategoryDomain(domain) ? domain : undefined,
  );
  return c.json({ items: rows });
});
