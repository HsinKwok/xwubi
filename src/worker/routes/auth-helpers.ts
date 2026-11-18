// 认证路由的账号查询、登录事件、两步验证票据与邀请/重置数据读写
import type { Context } from 'hono';
import type { AppEnv, StaffRole, StaffUser } from '../lib/env';
import { hashPassword, randomToken, sha256Hex } from '../lib/crypto';
import { newId, nowIso } from '../lib/ids';
import { passwordResetMail, requestOrigin, sendMail } from '../lib/mailer';

export const RESET_TTL_MS = 30 * 60 * 1000;

const TOTP_CHALLENGE_PREFIX = 'totp_challenge:';
const TOTP_CHALLENGE_TTL = 300;

export interface AuthRow {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  status: string;
  password_hash: string | null;
  totp_enabled: number;
  must_change_password: number;
}

export interface TotpRow extends AuthRow {
  totp_secret: string | null;
}

export interface InviteRow {
  email: string;
  role: StaffRole;
  expires_at: string;
  accepted_at: string | null;
}

export interface TotpChallenge {
  uid: string;
  attempts: number;
}

export interface ResetRow {
  id: string;
  expires_at: string;
  used_at: string | null;
  user_id: string;
  name: string;
  email: string;
  role: StaffRole;
  status: string;
}

export function toStaffUser(row: AuthRow): StaffUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    mustChangePassword: row.must_change_password === 1,
  };
}

export async function findUserByEmail(
  c: Context<AppEnv>,
  email: string,
): Promise<AuthRow | null> {
  return c.env.DB.prepare(
    `SELECT id, name, email, role, status, password_hash, totp_enabled, must_change_password
     FROM users WHERE email = ?`,
  )
    .bind(email)
    .first<AuthRow>();
}

export async function findActiveUserByEmail(
  c: Context<AppEnv>,
  email: string,
): Promise<AuthRow | null> {
  return c.env.DB.prepare(
    `SELECT id, name, email, role, status, password_hash, totp_enabled, must_change_password
     FROM users WHERE email = ? AND status = 'active'`,
  )
    .bind(email)
    .first<AuthRow>();
}

export async function findTotpUser(
  c: Context<AppEnv>,
  id: string,
): Promise<TotpRow | null> {
  return c.env.DB.prepare(
    `SELECT id, name, email, role, status, password_hash, totp_secret, totp_enabled, must_change_password
     FROM users WHERE id = ?`,
  )
    .bind(id)
    .first<TotpRow>();
}

export async function recordLoginEvent(
  c: Context<AppEnv>,
  input: { email: string; ip: string; success: boolean; reason: string | null },
): Promise<void> {
  await c.env.DB.prepare(
    `INSERT INTO login_events (id, email, ip, user_agent, success, reason, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      newId('evt'),
      input.email,
      input.ip,
      c.req.header('user-agent') ?? null,
      input.success ? 1 : 0,
      input.reason,
      nowIso(),
    )
    .run();
}

function totpChallengeKey(challenge: string): string {
  return `${TOTP_CHALLENGE_PREFIX}${challenge}`;
}

export async function loadTotpChallenge(
  c: Context<AppEnv>,
  challenge: string,
): Promise<TotpChallenge | null> {
  const raw = await c.env.CACHE.get(totpChallengeKey(challenge));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TotpChallenge;
  } catch {
    return null;
  }
}

export async function saveTotpChallenge(
  c: Context<AppEnv>,
  challenge: string,
  payload: TotpChallenge,
): Promise<void> {
  await c.env.CACHE.put(totpChallengeKey(challenge), JSON.stringify(payload), {
    expirationTtl: TOTP_CHALLENGE_TTL,
  });
}

export async function clearTotpChallenge(
  c: Context<AppEnv>,
  challenge: string,
): Promise<void> {
  await c.env.CACHE.delete(totpChallengeKey(challenge));
}

export async function findInviteByToken(
  c: Context<AppEnv>,
  tokenHash: string,
): Promise<InviteRow | null> {
  return c.env.DB.prepare(
    `SELECT email, role, expires_at, accepted_at FROM invites WHERE token_hash = ?`,
  )
    .bind(tokenHash)
    .first<InviteRow>();
}

export async function activateInvitedUser(
  c: Context<AppEnv>,
  input: { userId: string; name: string; password: string; tokenHash: string; now: string },
): Promise<void> {
  const passwordHash = await hashPassword(input.password);

  await c.env.DB.batch([
    c.env.DB.prepare(
      'UPDATE users SET name = ?, password_hash = ?, status = ?, must_change_password = 0, updated_at = ? WHERE id = ?',
    ).bind(input.name, passwordHash, 'active', input.now, input.userId),
    c.env.DB.prepare('UPDATE invites SET accepted_at = ? WHERE token_hash = ?').bind(
      input.now,
      input.tokenHash,
    ),
    c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(input.userId),
  ]);
}

export async function markLogin(c: Context<AppEnv>, userId: string): Promise<void> {
  const now = nowIso();
  await c.env.DB.prepare('UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?')
    .bind(now, now, userId)
    .run();
}

export async function markInviteLogin(
  c: Context<AppEnv>,
  userId: string,
  now: string,
): Promise<void> {
  await c.env.DB.prepare('UPDATE users SET last_login_at = ? WHERE id = ?')
    .bind(now, userId)
    .run();
}

export async function issuePasswordReset(
  c: Context<AppEnv>,
  row: AuthRow,
): Promise<void> {
  const token = randomToken();
  const tokenHash = await sha256Hex(token);
  const now = nowIso();
  const expiresAt = new Date(Date.now() + RESET_TTL_MS).toISOString();

  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE password_resets SET used_at = ? WHERE user_id = ? AND used_at IS NULL')
      .bind(now, row.id),
    c.env.DB.prepare(
      `INSERT INTO password_resets (id, user_id, token_hash, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).bind(newId('prs'), row.id, tokenHash, expiresAt, now),
  ]);

  const resetUrl = `${requestOrigin(c.env, c.req.url)}/admin/reset-password?token=${encodeURIComponent(token)}`;
  await sendMail(
    c.env,
    passwordResetMail({ to: row.email, name: row.name, resetUrl, expiresAt }),
  );
}

export async function findPasswordReset(
  c: Context<AppEnv>,
  tokenHash: string,
): Promise<ResetRow | null> {
  return c.env.DB.prepare(
    `SELECT r.id, r.expires_at, r.used_at, u.id AS user_id, u.name, u.email, u.role, u.status
     FROM password_resets r
     JOIN users u ON u.id = r.user_id
     WHERE r.token_hash = ?`,
  )
    .bind(tokenHash)
    .first<ResetRow>();
}

export async function applyPasswordReset(
  c: Context<AppEnv>,
  row: ResetRow,
  password: string,
): Promise<void> {
  const now = nowIso();
  const passwordHash = await hashPassword(password);

  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE users SET password_hash = ?, must_change_password = 0, updated_at = ? WHERE id = ?')
      .bind(passwordHash, now, row.user_id),
    c.env.DB.prepare('UPDATE password_resets SET used_at = ? WHERE id = ?').bind(now, row.id),
    c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(row.user_id),
  ]);
}

export async function loadPasswordHash(
  c: Context<AppEnv>,
  userId: string,
): Promise<{ password_hash: string | null } | null> {
  return c.env.DB.prepare('SELECT password_hash FROM users WHERE id = ?')
    .bind(userId)
    .first<{ password_hash: string | null }>();
}

export async function updateUserPassword(
  c: Context<AppEnv>,
  userId: string,
  password: string,
): Promise<void> {
  const passwordHash = await hashPassword(password);
  await c.env.DB.prepare(
    'UPDATE users SET password_hash = ?, must_change_password = 0, updated_at = ? WHERE id = ?',
  )
    .bind(passwordHash, nowIso(), userId)
    .run();
}
