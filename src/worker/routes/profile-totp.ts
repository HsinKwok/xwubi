import { Hono } from 'hono';
import type { AppEnv } from '../lib/env';
import { writeAudit } from '../lib/audit';
import { verifyPassword } from '../lib/crypto';
import { asString, fail, readJson } from '../lib/http';
import { nowIso } from '../lib/ids';
import { consumeRateLimit } from '../lib/rate-limit';
import { generateTotpSecret, normalizeTotpCode, otpauthUrl, verifyTotp } from '../lib/totp';
import { setupKey, type TotpPending } from './profile-helpers';

/** 两步验证（TOTP）的开启与关闭 */
export const profileTotpRoutes = new Hono<AppEnv>();

const TOTP_ISSUER = 'xwubi';
const TOTP_SETUP_TTL_SECONDS = 10 * 60;

profileTotpRoutes.post('/totp/setup', async (c) => {
  const user = c.get('user')!;
  const allowed = await consumeRateLimit(c.env, `profile:totp:${user.id}`, 10, 3600);
  if (!allowed) return fail(c, 429, 'rate_limited', '操作太频繁，请稍后再试');

  const body = await readJson<Record<string, unknown>>(c);
  if (!body) return fail(c, 400, 'invalid_request', '请求体必须是 JSON');

  const password = asString(body.password);
  const row = await c.env.DB.prepare('SELECT password_hash, totp_enabled FROM users WHERE id = ?')
    .bind(user.id)
    .first<{ password_hash: string | null; totp_enabled: number }>();

  if (!row?.password_hash) return fail(c, 400, 'password_unavailable', '当前账号尚未设置密码');
  if (!(await verifyPassword(password, row.password_hash))) {
    return fail(c, 400, 'invalid_password', '密码不正确');
  }
  if (row.totp_enabled) return fail(c, 409, 'totp_enabled', '两步验证已开启');

  const secret = generateTotpSecret();
  const pending: TotpPending = { secret, created_at: nowIso() };

  await c.env.CACHE.put(setupKey(user.id), JSON.stringify(pending), {
    expirationTtl: TOTP_SETUP_TTL_SECONDS,
  });

  return c.json({
    secret,
    account: user.email,
    issuer: TOTP_ISSUER,
    otpauth_url: otpauthUrl({ secret, account: user.email, issuer: TOTP_ISSUER }),
    expires_in: TOTP_SETUP_TTL_SECONDS,
  });
});

profileTotpRoutes.post('/totp/enable', async (c) => {
  const user = c.get('user')!;
  const body = await readJson<Record<string, unknown>>(c);
  if (!body) return fail(c, 400, 'invalid_request', '请求体必须是 JSON');

  const code = normalizeTotpCode(asString(body.code));
  if (code.length !== 6) return fail(c, 400, 'invalid_code', '请输入 6 位验证码');

  const raw = await c.env.CACHE.get(setupKey(user.id));
  if (!raw) return fail(c, 400, 'setup_expired', '设置已过期，请重新开始');

  let pending: TotpPending;
  try {
    pending = JSON.parse(raw) as TotpPending;
  } catch {
    return fail(c, 400, 'setup_expired', '设置已过期，请重新开始');
  }

  if (!(await verifyTotp(pending.secret, code))) {
    return fail(c, 400, 'invalid_code', '验证码不正确，请确认设备时间后重试');
  }

  await c.env.DB.prepare(
    'UPDATE users SET totp_secret = ?, totp_enabled = 1, updated_at = ? WHERE id = ?',
  )
    .bind(pending.secret, nowIso(), user.id)
    .run();

  await c.env.CACHE.delete(setupKey(user.id));

  await writeAudit(c, {
    action: 'profile.totp_enable',
    targetType: 'user',
    targetId: user.id,
    summary: user.name,
  });

  return c.json({ ok: true, totp_enabled: true });
});

profileTotpRoutes.post('/totp/disable', async (c) => {
  const user = c.get('user')!;
  const body = await readJson<Record<string, unknown>>(c);
  if (!body) return fail(c, 400, 'invalid_request', '请求体必须是 JSON');

  const password = asString(body.password);
  const row = await c.env.DB.prepare('SELECT password_hash, totp_enabled FROM users WHERE id = ?')
    .bind(user.id)
    .first<{ password_hash: string | null; totp_enabled: number }>();

  if (!row?.password_hash) return fail(c, 400, 'password_unavailable', '当前账号尚未设置密码');
  if (!(await verifyPassword(password, row.password_hash))) {
    return fail(c, 400, 'invalid_password', '密码不正确');
  }
  if (!row.totp_enabled) return c.json({ ok: true, totp_enabled: false });

  await c.env.DB.prepare(
    'UPDATE users SET totp_secret = NULL, totp_enabled = 0, updated_at = ? WHERE id = ?',
  )
    .bind(nowIso(), user.id)
    .run();

  await c.env.CACHE.delete(setupKey(user.id));

  await writeAudit(c, {
    action: 'profile.totp_disable',
    targetType: 'user',
    targetId: user.id,
    summary: user.name,
  });

  return c.json({ ok: true, totp_enabled: false });
});
