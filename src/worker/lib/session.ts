import type { Context } from 'hono';
import type { Next } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import type { AppEnv, StaffRole, StaffUser } from './env';
import { randomToken, sha256Hex } from './crypto';
import { newId, nowIso } from './ids';
import { fail } from './http';

export const SESSION_COOKIE = '__Host-xwubi_session';
// 非 HTTPS（本地 http://localhost 等）无法使用带 Secure 的 __Host- Cookie，
// 否则浏览器会直接丢弃，导致登录后立刻变回未登录。
const SESSION_COOKIE_PLAIN = 'xwubi_session';
// 非 HttpOnly 的会话标记：前端据此决定是否需要请求 /api/auth/me，
// 未登录访客因此可以完全跳过会话接口。值本身不含任何凭证。
const SESSION_HINT_COOKIE = 'xwubi_has_session';
const SESSION_TTL_SECONDS = 12 * 60 * 60;

function isSecureRequest(c: Context<AppEnv>): boolean {
  if (new URL(c.req.url).protocol === 'https:') return true;
  const forwarded = (c.req.header('x-forwarded-proto') ?? '').split(',')[0]?.trim().toLowerCase();
  return forwarded === 'https';
}

function sessionCookieName(secure: boolean): string {
  return secure ? SESSION_COOKIE : SESSION_COOKIE_PLAIN;
}

interface SessionRow {
  session_id: string;
  expires_at: string;
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  status: string;
  must_change_password: number;
}

export async function loadSession(c: Context<AppEnv>, next: Next): Promise<void> {
  const secure = isSecureRequest(c);
  const token =
    getCookie(c, sessionCookieName(secure)) ??
    getCookie(c, sessionCookieName(!secure));

  if (token) {
    const tokenHash = await sha256Hex(token);
    const row = await c.env.DB.prepare(
      `SELECT s.id AS session_id, s.expires_at, u.id, u.name, u.email, u.role, u.status,
              u.must_change_password
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?`,
    )
      .bind(tokenHash)
      .first<SessionRow>();

    if (row) {
      if (Date.parse(row.expires_at) <= Date.now()) {
        await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(row.session_id).run();
      } else if (row.status === 'active') {
        c.set('user', {
          id: row.id,
          name: row.name,
          email: row.email,
          role: row.role,
          status: row.status,
          mustChangePassword: row.must_change_password === 1,
        });
        c.set('sessionId', row.session_id);
      }
    }
  }

  await next();
}

export async function createSession(c: Context<AppEnv>, user: StaffUser): Promise<void> {
  const token = randomToken();
  const tokenHash = await sha256Hex(token);
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + SESSION_TTL_SECONDS * 1000);

  await c.env.DB.prepare(
    `INSERT INTO sessions (id, user_id, token_hash, expires_at, ip, user_agent, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      newId('ses'),
      user.id,
      tokenHash,
      expiresAt.toISOString(),
      c.req.header('cf-connecting-ip') ?? null,
      c.req.header('user-agent') ?? null,
      nowIso(),
    )
    .run();

  const secure = isSecureRequest(c);
  setCookie(c, sessionCookieName(secure), token, {
    httpOnly: true,
    secure,
    sameSite: 'Lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
  setCookie(c, SESSION_HINT_COOKIE, '1', {
    httpOnly: false,
    secure,
    sameSite: 'Lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession(c: Context<AppEnv>): Promise<void> {
  const sessionId = c.get('sessionId');
  if (sessionId) {
    await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
  }
  deleteCookie(c, SESSION_COOKIE, { path: '/', secure: true });
  deleteCookie(c, SESSION_COOKIE_PLAIN, { path: '/' });
  deleteCookie(c, SESSION_HINT_COOKIE, { path: '/' });
}

/** 清除某账号的会话；传入 exceptSessionId 时保留当前会话 */
export async function revokeUserSessions(
  env: AppEnv['Bindings'],
  userId: string,
  exceptSessionId?: string,
): Promise<void> {
  if (exceptSessionId) {
    await env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND id != ?')
      .bind(userId, exceptSessionId)
      .run();
    return;
  }
  await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run();
}

export async function requireStaff(c: Context<AppEnv>, next: Next): Promise<Response | void> {
  if (!c.get('user')) return fail(c, 401, 'unauthenticated', '请先登录');
  await next();
}

export function requireRole(...roles: StaffRole[]) {
  return async (c: Context<AppEnv>, next: Next): Promise<Response | void> => {
    const user = c.get('user');
    if (!user) return fail(c, 401, 'unauthenticated', '请先登录');
    if (!roles.includes(user.role)) return fail(c, 403, 'forbidden', '当前角色没有该操作权限');
    await next();
  };
}
