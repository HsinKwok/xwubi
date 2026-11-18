// 前台表单接口聚合：投稿与页面纠错反馈分文件维护
import { Hono } from 'hono';
import type { AppEnv } from '../../lib/env';
import { feedbackRoutes } from './feedback';
import { submissionRoutes } from './submissions';

export const formRoutes = new Hono<AppEnv>();

formRoutes.route('/', submissionRoutes);
formRoutes.route('/', feedbackRoutes);
