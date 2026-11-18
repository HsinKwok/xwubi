// 文章跟打篇目管理：前台「文章跟打」使用的 practice_texts 表
import { Hono } from 'hono';
import type { AppEnv } from '../../lib/env';
import { practiceReadRoutes } from './practice-read';
import { practiceWriteRoutes } from './practice-write';

export const practiceRoutes = new Hono<AppEnv>();

practiceRoutes.route('/', practiceReadRoutes);
practiceRoutes.route('/', practiceWriteRoutes);
