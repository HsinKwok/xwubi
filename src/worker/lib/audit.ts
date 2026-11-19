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

  const write = c.env.DB.prepare(
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

  // 审计写入不参与响应关键路径：交给 waitUntil 在响应后完成，
  // 省掉一次 D1 写往返；非 Worker 环境（测试脚本）退化为同步等待。
  try {
    c.executionCtx.waitUntil(write);
  } catch {
    await write;
  }
}
