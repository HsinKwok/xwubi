import type { Context } from 'hono';
import type { AppEnv } from '../../lib/env';
import type { MediaRow } from './rows';

export function sanitizeFilename(name: string, ext: string): string {
  const base = name
    .replace(/\.[^.]+$/, '')
    .replace(/[^\w\u4e00-\u9fff.-]+/g, '_')
    .replace(/^[_\-.]+|[_\-.]+$/g, '')
    .slice(0, 80);
  return `${base || 'image'}.${ext}`;
}

export function loadMedia(c: Context<AppEnv>, id: string): Promise<MediaRow | null> {
  return c.env.DB.prepare(
    `SELECT m.*, u.name AS uploader_name
     FROM media m LEFT JOIN users u ON u.id = m.uploaded_by
     WHERE m.id = ?`,
  )
    .bind(id)
    .first<MediaRow>();
}
