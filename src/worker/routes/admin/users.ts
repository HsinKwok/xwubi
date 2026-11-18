// 后台账号管理：列表查询与邀请、角色调整等写操作分文件维护
import { Hono } from 'hono';
import type { AppEnv } from '../../lib/env';
import { usersActionRoutes } from './users-actions';
import { usersListRoutes } from './users-list';

export const usersRoutes = new Hono<AppEnv>();

usersRoutes.route('/', usersListRoutes);
usersRoutes.route('/', usersActionRoutes);
