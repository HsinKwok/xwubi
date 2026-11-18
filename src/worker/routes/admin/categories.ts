// 统一分类：三层里的两层
//   内容：content_type（内容类型）/ lesson_stage（教学阶段）/ practice_genre（篇目分类）
//   码表：keymap_zone（分区）/ keymap_version（版本）
import { Hono } from 'hono';
import type { AppEnv } from '../../lib/env';
import { categoriesReadRoutes } from './categories-read';
import { categoriesWriteRoutes } from './categories-write';

export const categoriesRoutes = new Hono<AppEnv>();

categoriesRoutes.route('/', categoriesReadRoutes);
categoriesRoutes.route('/', categoriesWriteRoutes);
