import { Hono } from 'hono';
import type { AppEnv } from '../lib/env';
import { requireStaff } from '../lib/session';
import { profileAccountRoutes } from './profile-account';
import { profileTotpRoutes } from './profile-totp';

/**
 * 当前登录用户的个人中心：资料、密码、登录设备与两步验证。
 */
export const profileRoutes = new Hono<AppEnv>();

profileRoutes.use('*', requireStaff);

profileRoutes.route('/', profileAccountRoutes);
profileRoutes.route('/', profileTotpRoutes);
