import type { Context } from 'hono';
import type { AppEnv, StaffRole } from '../../lib/env';
import { randomToken, sha256Hex } from '../../lib/crypto';
import { newId, nowIso } from '../../lib/ids';
import { inviteMail, requestOrigin, sendMail } from '../../lib/mailer';
import { INVITE_TTL_MS, STAFF_ROLE_LABELS } from './constants';
import type { CountRow, StaffRow } from './rows';

export function loadStaff(c: Context<AppEnv>, id: string): Promise<StaffRow | null> {
  return c.env.DB.prepare(
    `SELECT id, name, email, role, status, must_change_password, password_hash, last_login_at, created_at, updated_at
     FROM users WHERE id = ?`,
  )
    .bind(id)
    .first<StaffRow>();
}

export async function countOtherActiveAdmins(c: Context<AppEnv>, excludeId: string): Promise<number> {
  const row = await c.env.DB.prepare(
    `SELECT COUNT(*) AS total FROM users
     WHERE role = 'admin' AND status = 'active' AND id != ?`,
  )
    .bind(excludeId)
    .first<CountRow>();
  return row?.total ?? 0;
}

export async function issueInvite(
  c: Context<AppEnv>,
  target: { name: string; email: string; role: StaffRole },
) {
  const token = randomToken();
  const tokenHash = await sha256Hex(token);
  const now = nowIso();
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS).toISOString();

  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM invites WHERE email = ? AND accepted_at IS NULL').bind(target.email),
    c.env.DB.prepare(
      `INSERT INTO invites (id, email, role, token_hash, invited_by, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).bind(newId('inv'), target.email, target.role, tokenHash, c.get('user')?.id ?? null, expiresAt, now),
  ]);

  const inviteUrl = `${requestOrigin(c.env, c.req.url)}/admin/accept-invite?token=${encodeURIComponent(token)}`;
  const mail = await sendMail(
    c.env,
    inviteMail({
      to: target.email,
      name: target.name,
      roleLabel: STAFF_ROLE_LABELS[target.role],
      inviteUrl,
      expiresAt,
    }),
  );

  return { inviteUrl, mail, expiresAt };
}
