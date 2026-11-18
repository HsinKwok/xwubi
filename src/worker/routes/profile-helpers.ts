import type { Context } from 'hono';
import type { AppEnv } from '../lib/env';

export interface ProfileRow {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  totp_enabled: number;
  must_change_password: number;
  last_login_at: string | null;
  created_at: string;
}

export interface SessionListRow {
  id: string;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
  expires_at: string;
}

export interface TotpPending {
  secret: string;
  created_at: string;
}

/** 两步验证待确认密钥在 KV 中的键名 */
export function setupKey(userId: string): string {
  return `totp_setup:${userId}`;
}

export async function loadProfile(
  c: Context<AppEnv>,
  userId: string,
): Promise<ProfileRow | null> {
  return c.env.DB.prepare(
    `SELECT id, name, email, role, status, totp_enabled, must_change_password,
            last_login_at, created_at
     FROM users WHERE id = ?`,
  )
    .bind(userId)
    .first<ProfileRow>();
}

/** 输出给前端的账号资料结构 */
export function publicProfile(row: ProfileRow) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    totp_enabled: row.totp_enabled === 1,
    must_change_password: row.must_change_password === 1,
    last_login_at: row.last_login_at,
    created_at: row.created_at,
  };
}
