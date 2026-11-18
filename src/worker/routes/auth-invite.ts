import { Hono } from 'hono';
import type { AppEnv, StaffUser } from '../lib/env';
import { writeAudit } from '../lib/audit';
import { sha256Hex } from '../lib/crypto';
import { asString, fail, readJson } from '../lib/http';
import { nowIso } from '../lib/ids';
import { passwordProblem } from '../lib/password';
import { createSession } from '../lib/session';
import {
  activateInvitedUser,
  findInviteByToken,
  findUserByEmail,
  markInviteLogin,
} from './auth-helpers';

/** 邀请链接激活账号 */
export const authInviteRoutes = new Hono<AppEnv>();

authInviteRoutes.post('/invite/accept', async (c) => {
  const body = await readJson<Record<string, unknown>>(c);
  if (!body) return fail(c, 400, 'invalid_request', '请求体必须是 JSON');

  const token = asString(body.token).trim();
  const password = asString(body.password);
  if (!token) return fail(c, 400, 'invite_invalid', '邀请链接无效');

  const problem = passwordProblem(password);
  if (problem) return fail(c, 400, 'weak_password', problem);

  const tokenHash = await sha256Hex(token);
  const invite = await findInviteByToken(c, tokenHash);

  if (!invite || invite.accepted_at) {
    return fail(c, 400, 'invite_invalid', '邀请链接无效或已使用，请联系管理员重新发送');
  }
  if (Date.parse(invite.expires_at) <= Date.now()) {
    return fail(c, 410, 'invite_expired', '邀请链接已过期，请联系管理员重新发送');
  }

  const row = await findUserByEmail(c, invite.email);

  if (!row) return fail(c, 404, 'invite_invalid', '邀请对应的账号不存在');
  if (row.status === 'disabled') return fail(c, 403, 'account_disabled', '账号已停用，请联系管理员');
  if (row.status !== 'invited') {
    return fail(c, 409, 'invite_used', '账号已激活，请直接登录或在登录页找回密码');
  }

  const name = asString(body.name).trim();
  if (name && (name.length < 2 || name.length > 32)) {
    return fail(c, 400, 'invalid_name', '昵称长度需为 2-32 个字符');
  }

  const now = nowIso();
  const nextName = name || row.name;

  await activateInvitedUser(c, {
    userId: row.id,
    name: nextName,
    password,
    tokenHash,
    now,
  });

  const user: StaffUser = {
    id: row.id,
    name: nextName,
    email: row.email,
    role: row.role,
    status: 'active',
    mustChangePassword: false,
  };

  c.set('user', user);
  await createSession(c, user);
  await markInviteLogin(c, user.id, now);

  await writeAudit(c, {
    action: 'auth.invite_accept',
    targetType: 'user',
    targetId: user.id,
    summary: `${user.name}（${user.email}）`,
  });

  return c.json({ user });
});
