import { Hono } from 'hono';
import type { AppEnv } from '../../lib/env';
import { fail } from '../../lib/http';
import { categoriesRoutes } from './categories';
import { contentRoutes } from './content';
import { dashboardRoutes } from './dashboard';
import { inboxRoutes } from './inbox';
import { mailSettingsRoutes } from './mail-settings';
import { mediaRoutes } from './media';
import { practiceRoutes } from './practice';
import { reviewRoutes } from './review';
import { settingsAdminRoutes } from './settings';
import { tagsRoutes } from './tags';
import { usersRoutes } from './users';

export const adminRoutes = new Hono<AppEnv>();

adminRoutes.use('*', async (c, next) => {
  const user = c.get('user');
  if (!user) return fail(c, 401, 'unauthorized', '请先登录');
  if (user.mustChangePassword) {
    return fail(c, 403, 'password_change_required', '请先完成密码修改');
  }
  await next();
});

adminRoutes.route('/', dashboardRoutes);
adminRoutes.route('/', reviewRoutes);
adminRoutes.route('/content', contentRoutes);
adminRoutes.route('/tags', tagsRoutes);
adminRoutes.route('/categories', categoriesRoutes);
adminRoutes.route('/', inboxRoutes);
adminRoutes.route('/users', usersRoutes);
adminRoutes.route('/media', mediaRoutes);
adminRoutes.route('/practice-texts', practiceRoutes);
adminRoutes.route('/', settingsAdminRoutes);
adminRoutes.route('/', mailSettingsRoutes);
