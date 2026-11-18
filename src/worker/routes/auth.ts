import { Hono } from 'hono';
import type { AppEnv } from '../lib/env';
import { authInviteRoutes } from './auth-invite';
import { authLoginRoutes } from './auth-login';
import { authPasswordRoutes } from './auth-password';

/**
 * 后台认证入口：登录、邀请激活与密码管理。
 */
export const authRoutes = new Hono<AppEnv>();

authRoutes.route('/', authLoginRoutes);
authRoutes.route('/', authInviteRoutes);
authRoutes.route('/', authPasswordRoutes);
