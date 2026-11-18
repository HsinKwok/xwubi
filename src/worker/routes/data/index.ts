import { Hono } from 'hono';
import type { AppEnv } from '../../lib/env';
import { requireStaff } from '../../lib/session';
import { examplesRoutes } from './examples';
import { importRoutes } from './imports';
import { rootsRoutes } from './roots';

export const dataRoutes = new Hono<AppEnv>();

dataRoutes.use('*', requireStaff);

dataRoutes.route('/roots', rootsRoutes);
dataRoutes.route('/examples', examplesRoutes);
dataRoutes.route('/', importRoutes);
