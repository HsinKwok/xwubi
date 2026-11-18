import { Hono } from 'hono';
import type { AppEnv } from '../../lib/env';
import { bootstrapRoutes } from './bootstrap';
import { collectionRoutes } from './collection';
import { contentRoutes } from './content';
import { formRoutes } from './forms';
import { keymapRoutes } from './keymap';
import { pageRoutes } from './pages';
import { practiceTextRoutes } from './practice-texts';

export const siteRoutes = new Hono<AppEnv>();

siteRoutes.route('/', bootstrapRoutes);
siteRoutes.route('/', collectionRoutes);
siteRoutes.route('/', contentRoutes);
siteRoutes.route('/', keymapRoutes);
siteRoutes.route('/', practiceTextRoutes);
siteRoutes.route('/', pageRoutes);
siteRoutes.route('/', formRoutes);
