import { Hono } from 'hono';
import type { AppEnv } from '../lib/env';
import { writeAudit } from '../lib/audit';
import { hashPassword, verifyPassword } from '../lib/crypto';
import { asString, fail, readJson } from '../lib/http';
import { nowIso } from '../lib/ids';
import { passwordProblem } from '../lib/password';
import { consumeRateLimit } from '../lib/rate-limit';
import { destroySession, revokeUserSessions } from '../lib/session';
import { loadProfile, publicProfile, type SessionListRow } from './profile-helpers';

/** 个人资料、密码修改与登录设备管理 */
export const profileAccountRoutes = new Hono<AppEnv>();

profileAccountRoutes.get('/', async (c) => {
  const user = c.get('user')!;
  const row = await loadProfile(c, user.id);
  if (!row) return fail(c, 404, 'profile_not_found', '账号不存在');

  const stats = await c.env.DB.prepare(
    `SELECT
       (SELECT COUNT(*) FROM content WHERE author_id = ? AND status != 'archived') AS content,
       (SELECT COUNT(*) FROM content WHERE author_id = ? AND status = 'published') AS published`,
  )
    .bind(user.id, user.id)
    .first<{ content: number; published: number }>();

  return c.json({
    profile: publicProfile(row),
    stats: {
      content: stats?.content ?? 0,
      published: stats?.published ?? 0,
    },
  });
});

profileAccountRoutes.patch('/', async (c) => {
  const user = c.get('user')!;
  const body = await readJson<Record<string, unknown>>(c);
  if (!body) return fail(c, 400, 'invalid_request', '请求体必须是 JSON');

  const name = asString(body.name).trim();
  if (name.length < 2 || name.length > 32) {
    return fail(c, 400, 'invalid_name', '昵称长度需为 2-32 个字符');
  }

  await c.env.DB.prepare('UPDATE users SET name = ?, updated_at = ? WHERE id = ?')
    .bind(name, nowIso(), user.id)
    .run();

  const row = await loadProfile(c, user.id);
  if (!row) return fail(c, 404, 'profile_not_found', '账号不存在');

  await writeAudit(c, {
    action: 'profile.update',
    targetType: 'user',
    targetId: user.id,
    summary: name,
    diff: { name },
  });

  return c.json({ profile: publicProfile(row) });
});

profileAccountRoutes.post('/password', async (c) => {
  const user = c.get('user')!;
  const allowed = await consumeRateLimit(c.env, `profile:password:${user.id}`, 10, 3600);
  if (!allowed) return fail(c, 429, 'rate_limited', '操作太频繁，请稍后再试');

  const body = await readJson<Record<string, unknown>>(c);
  if (!body) return fail(c, 400, 'invalid_request', '请求体必须是 JSON');

  const currentPassword = asString(body.current_password);
  const newPassword = asString(body.new_password);
  const problem = passwordProblem(newPassword);
  if (problem) return fail(c, 400, 'weak_password', problem);

  const row = await c.env.DB.prepare('SELECT password_hash, must_change_password FROM users WHERE id = ?')
    .bind(user.id)
    .first<{ password_hash: string | null; must_change_password: number }>();

  if (!row?.password_hash) return fail(c, 400, 'password_unavailable', '当前账号尚未设置密码');
  if (!(await verifyPassword(currentPassword, row.password_hash))) {
    return fail(c, 400, 'invalid_password', '当前密码不正确');
  }
  if (currentPassword === newPassword) {
    return fail(c, 400, 'same_password', '新密码不能与当前密码相同');
  }

  await c.env.DB.prepare(
    'UPDATE users SET password_hash = ?, must_change_password = 0, updated_at = ? WHERE id = ?',
  )
    .bind(await hashPassword(newPassword), nowIso(), user.id)
    .run();

  await revokeUserSessions(c.env, user.id, c.get('sessionId'));

  await writeAudit(c, {
    action: 'profile.password_change',
    targetType: 'user',
    targetId: user.id,
    summary: user.name,
  });

  return c.json({ ok: true, must_change_password: false });
});

/* ---------- 登录设备 ---------- */

profileAccountRoutes.get('/sessions', async (c) => {
  const user = c.get('user')!;
  const rows = await c.env.DB.prepare(
    `SELECT id, ip, user_agent, created_at, expires_at
     FROM sessions
     WHERE user_id = ? AND expires_at > ?
     ORDER BY created_at DESC`,
  )
    .bind(user.id, nowIso())
    .all<SessionListRow>();

  const currentId = c.get('sessionId');

  return c.json({
    items: (rows.results ?? []).map((row) => ({
      id: row.id,
      ip: row.ip,
      user_agent: row.user_agent,
      created_at: row.created_at,
      expires_at: row.expires_at,
      current: row.id === currentId,
    })),
  });
});

profileAccountRoutes.delete('/sessions/:id', async (c) => {
  const user = c.get('user')!;
  const sessionId = c.req.param('id');
  const row = await c.env.DB.prepare('SELECT id FROM sessions WHERE id = ? AND user_id = ?')
    .bind(sessionId, user.id)
    .first<{ id: string }>();

  if (!row) return fail(c, 404, 'session_not_found', '会话不存在或已失效');

  await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(row.id).run();

  if (row.id === c.get('sessionId')) {
    await destroySession(c);
    return c.json({ ok: true, signed_out: true });
  }

  return c.json({ ok: true, signed_out: false });
});

profileAccountRoutes.delete('/sessions', async (c) => {
  const user = c.get('user')!;
  await revokeUserSessions(c.env, user.id, c.get('sessionId'));

  await writeAudit(c, {
    action: 'profile.sessions_revoke',
    targetType: 'user',
    targetId: user.id,
    summary: '吊销其他登录设备',
  });

  return c.json({ ok: true });
});
