import { Hono } from 'hono';
import type { AppEnv, StaffUser } from '../lib/env';
import { writeAudit } from '../lib/audit';
import { sha256Hex, verifyPassword } from '../lib/crypto';
import { asString, fail, readJson } from '../lib/http';
import { passwordProblem } from '../lib/password';
import { consumeRateLimit } from '../lib/rate-limit';
import { createSession, revokeUserSessions } from '../lib/session';
import { EMAIL_PATTERN } from '../lib/validation';
import {
  applyPasswordReset,
  findActiveUserByEmail,
  findPasswordReset,
  issuePasswordReset,
  loadPasswordHash,
  updateUserPassword,
} from './auth-helpers';

/** 密码找回、重置与修改 */
export const authPasswordRoutes = new Hono<AppEnv>();

authPasswordRoutes.post('/password/reset-request', async (c) => {
  const ip = c.req.header('cf-connecting-ip') ?? 'local';
  const allowed = await consumeRateLimit(c.env, `reset:${ip}`, 5, 3600);
  if (!allowed) return fail(c, 429, 'rate_limited', '请求过于频繁，请稍后再试');

  const body = await readJson<{ email?: string }>(c);
  const email = asString(body?.email).trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email)) return fail(c, 400, 'invalid_email', '请输入有效的邮箱地址');

  const row = await findActiveUserByEmail(c, email);

  // 无论邮箱是否存在都返回成功，避免账号探测
  if (row) await issuePasswordReset(c, row);

  return c.json({ ok: true });
});

authPasswordRoutes.post('/password/reset', async (c) => {
  const body = await readJson<Record<string, unknown>>(c);
  if (!body) return fail(c, 400, 'invalid_request', '请求体必须是 JSON');

  const token = asString(body.token).trim();
  const password = asString(body.password);
  if (!token) return fail(c, 400, 'reset_invalid', '重置链接无效');

  const problem = passwordProblem(password);
  if (problem) return fail(c, 400, 'weak_password', problem);

  const tokenHash = await sha256Hex(token);
  const row = await findPasswordReset(c, tokenHash);

  if (!row || row.used_at) return fail(c, 400, 'reset_invalid', '重置链接无效或已使用');
  if (Date.parse(row.expires_at) <= Date.now()) {
    return fail(c, 410, 'reset_expired', '重置链接已过期，请重新申请');
  }
  if (row.status !== 'active') return fail(c, 403, 'account_disabled', '账号不可用，请联系管理员');

  await applyPasswordReset(c, row, password);

  const user: StaffUser = {
    id: row.user_id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    mustChangePassword: false,
  };

  c.set('user', user);
  await createSession(c, user);

  await writeAudit(c, {
    action: 'auth.password_reset',
    targetType: 'user',
    targetId: user.id,
    summary: `${user.name}（${user.email}）`,
  });

  return c.json({ user });
});

authPasswordRoutes.post('/password/change', async (c) => {
  const user = c.get('user');
  if (!user) return fail(c, 401, 'unauthenticated', '请先登录');

  const body = await readJson<Record<string, unknown>>(c);
  if (!body) return fail(c, 400, 'invalid_request', '请求体必须是 JSON');

  const currentPassword = asString(body.current_password);
  const newPassword = asString(body.new_password);
  const problem = passwordProblem(newPassword);
  if (problem) return fail(c, 400, 'weak_password', problem);

  const row = await loadPasswordHash(c, user.id);

  if (!row?.password_hash) return fail(c, 400, 'password_unavailable', '当前账号尚未设置密码');
  if (!(await verifyPassword(currentPassword, row.password_hash))) {
    return fail(c, 400, 'invalid_password', '当前密码不正确');
  }
  if (currentPassword === newPassword) {
    return fail(c, 400, 'same_password', '新密码不能与当前密码相同');
  }

  await updateUserPassword(c, user.id, newPassword);

  await revokeUserSessions(c.env, user.id, c.get('sessionId'));

  await writeAudit(c, {
    action: 'auth.password_change',
    targetType: 'user',
    targetId: user.id,
    summary: user.name,
  });

  return c.json({ ok: true });
});
