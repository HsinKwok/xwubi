import type { Context } from 'hono';
import type { AppEnv } from './env';
import { newId, nowIso } from './ids';

export interface AuditInput {
  action: string;
  targetType: string;
  targetId?: string | null;
  summary?: string;
  diff?: unknown;
}

export async function writeAudit(c: Context<AppEnv>, input: AuditInput): Promise<void> {
  const actor = c.get('user');

  await c.env.DB.prepare(
    `INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, summary, diff_json, ip, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      newId('aud'),
      actor?.id ?? null,
      input.action,
      input.targetType,
      input.targetId ?? null,
      input.summary ?? '',
      input.diff ? JSON.stringify(input.diff) : null,
      c.req.header('cf-connecting-ip') ?? null,
      nowIso(),
    )
    .run();
}
