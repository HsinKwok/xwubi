import { Hono } from 'hono';
import type { AppEnv } from '../lib/env';
import { writeAudit } from '../lib/audit';
import { randomToken, verifyPassword } from '../lib/crypto';
import { asString, fail, readJson } from '../lib/http';
import { consumeRateLimit } from '../lib/rate-limit';
import { createSession, destroySession } from '../lib/session';
import { normalizeTotpCode, verifyTotp } from '../lib/totp';
import {
  clearTotpChallenge,
  findTotpUser,
  findUserByEmail,
  loadTotpChallenge,
  markLogin,
  recordLoginEvent,
  saveTotpChallenge,
  toStaffUser,
} from './auth-helpers';

/** 登录、两步验证、登出与当前用户信息 */
export const authLoginRoutes = new Hono<AppEnv>();

interface LoginBody {
  email?: string;
  password?: string;
}

authLoginRoutes.post('/login', async (c) => {
  const ip = c.req.header('cf-connecting-ip') ?? 'local';
  const allowed = await consumeRateLimit(c.env, `login:${ip}`, 20, 600);
  if (!allowed) return fail(c, 429, 'rate_limited', '尝试次数过多，请稍后再试');

  const body = await readJson<LoginBody>(c);
  const email = asString(body?.email).trim().toLowerCase();
  const password = asString(body?.password);

  if (!email || !password) return fail(c, 400, 'invalid_request', '请填写邮箱和密码');

  const row = await findUserByEmail(c, email);

  const passwordOk = row?.password_hash ? await verifyPassword(password, row.password_hash) : false;

  await recordLoginEvent(c, {
    email,
    ip,
    success: Boolean(row && passwordOk),
    reason: row ? (passwordOk ? null : 'bad_password') : 'unknown_email',
  });

  if (!row || !passwordOk) return fail(c, 401, 'invalid_credentials', '邮箱或密码不正确');
  if (row.status === 'disabled') return fail(c, 403, 'account_disabled', '账号已停用，请联系管理员');
  if (row.status === 'invited') return fail(c, 403, 'account_inactive', '账号尚未激活');

  if (row.totp_enabled) {
    const challenge = randomToken();
    await saveTotpChallenge(c, challenge, { uid: row.id, attempts: 0 });
    return c.json({ totp_required: true, challenge, expires_in: 300 });
  }

  const user = toStaffUser(row);

  await createSession(c, user);
  c.set('user', user);

  await markLogin(c, user.id);

  await writeAudit(c, { action: 'auth.login', targetType: 'user', targetId: user.id, summary: user.name });

  return c.json({ user });
});

authLoginRoutes.post('/totp', async (c) => {
  const ip = c.req.header('cf-connecting-ip') ?? 'local';
  const allowed = await consumeRateLimit(c.env, `totp:${ip}`, 20, 600);
  if (!allowed) return fail(c, 429, 'rate_limited', '尝试次数过多，请稍后再试');

  const body = await readJson<Record<string, unknown>>(c);
  const challenge = asString(body?.challenge).trim();
  const code = normalizeTotpCode(asString(body?.code));

  if (!challenge || code.length !== 6) {
    return fail(c, 400, 'invalid_request', '请输入 6 位验证码');
  }

  const payload = await loadTotpChallenge(c, challenge);
  if (!payload) return fail(c, 400, 'challenge_invalid', '验证已过期，请重新登录');

  const row = await findTotpUser(c, payload.uid);

  if (!row || !row.totp_enabled || !row.totp_secret || row.status !== 'active') {
    await clearTotpChallenge(c, challenge);
    return fail(c, 400, 'challenge_invalid', '验证已失效，请重新登录');
  }

  if (!(await verifyTotp(row.totp_secret, code))) {
    const attempts = payload.attempts + 1;

    await recordLoginEvent(c, {
      email: row.email,
      ip,
      success: false,
      reason: 'bad_totp',
    });

    if (attempts >= 5) {
      await clearTotpChallenge(c, challenge);
      return fail(c, 429, 'totp_locked', '验证失败次数过多，请重新登录');
    }

    await saveTotpChallenge(c, challenge, { uid: payload.uid, attempts });
    return fail(c, 401, 'invalid_totp', '验证码不正确');
  }

  await clearTotpChallenge(c, challenge);

  const user = toStaffUser(row);
  c.set('user', user);
  await createSession(c, user);

  await markLogin(c, user.id);

  await writeAudit(c, {
    action: 'auth.login',
    targetType: 'user',
    targetId: user.id,
    summary: `${user.name}（两步验证）`,
  });

  return c.json({ user });
});

authLoginRoutes.post('/logout', async (c) => {
  const user = c.get('user');
  await destroySession(c);

  if (user) {
    await writeAudit(c, {
      action: 'auth.logout',
      targetType: 'user',
      targetId: user.id,
      summary: user.name,
    });
  }

  return c.json({ ok: true });
});

authLoginRoutes.get('/me', (c) => {
  const user = c.get('user');
  if (!user) return fail(c, 401, 'unauthenticated', '未登录');
  return c.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      must_change_password: user.mustChangePassword === true,
    },
  });
});
