// 后台账号邀请、角色状态调整与密码重置
import { Hono } from 'hono';
import type { AppEnv, StaffRole } from '../../lib/env';
import { writeAudit } from '../../lib/audit';
import { hashPassword } from '../../lib/crypto';
import { asString, fail, readJson } from '../../lib/http';
import { newId, nowIso } from '../../lib/ids';
import { passwordProblem } from '../../lib/password';
import { requireRole } from '../../lib/session';
import { EMAIL_PATTERN } from '../../lib/validation';
import { STAFF_ROLES, STAFF_STATUSES } from './constants';
import { mapStaff } from './rows';
import { countOtherActiveAdmins, issueInvite, loadStaff } from './staff-helpers';

export const usersActionRoutes = new Hono<AppEnv>();

const requireAdmin = requireRole('admin');

usersActionRoutes.post('/invite', requireAdmin, async (c) => {
  const body = await readJson<Record<string, unknown>>(c);
  if (!body) return fail(c, 400, 'invalid_request', '请求体必须是 JSON');

  const name = asString(body.name).trim();
  const email = asString(body.email).trim().toLowerCase();
  const role = asString(body.role);

  if (name.length < 2 || name.length > 32) {
    return fail(c, 400, 'invalid_name', '请填写 2-32 个字符的姓名');
  }
  if (!EMAIL_PATTERN.test(email)) return fail(c, 400, 'invalid_email', '邮箱格式不正确');
  if (!STAFF_ROLES.includes(role as StaffRole)) {
    return fail(c, 400, 'invalid_role', '角色不合法');
  }

  const existing = await c.env.DB.prepare('SELECT id, status FROM users WHERE email = ?')
    .bind(email)
    .first<{ id: string; status: string }>();

  if (existing && existing.status !== 'invited') {
    return fail(c, 409, 'email_taken', '该邮箱已被其他账号使用');
  }

  const now = nowIso();
  let id = existing?.id;

  if (id) {
    await c.env.DB.prepare('UPDATE users SET name = ?, role = ?, updated_at = ? WHERE id = ?')
      .bind(name, role, now, id)
      .run();
  } else {
    id = newId('usr');
    await c.env.DB.prepare(
      `INSERT INTO users (id, name, email, role, password_hash, status, must_change_password, created_at, updated_at)
       VALUES (?, ?, ?, ?, NULL, 'invited', 1, ?, ?)`,
    )
      .bind(id, name, email, role, now, now)
      .run();
  }

  const { inviteUrl, mail } = await issueInvite(c, { name, email, role: role as StaffRole });
  const row = await loadStaff(c, id);

  await writeAudit(c, {
    action: 'user.invite',
    targetType: 'user',
    targetId: id,
    summary: `${name}（${email}）`,
    diff: { role },
  });

  return c.json(
    {
      item: row ? mapStaff(row) : null,
      invite_url: inviteUrl,
      mail: { sent: mail.sent, provider: mail.provider },
    },
    existing ? 200 : 201,
  );
});

usersActionRoutes.post('/:id/invite', requireAdmin, async (c) => {
  const id = c.req.param('id') ?? '';
  const row = await loadStaff(c, id);
  if (!row) return fail(c, 404, 'user_not_found', '账号不存在');
  if (row.status !== 'invited') {
    return fail(c, 409, 'not_invited', '只有待激活账号可以重发邀请');
  }

  const { inviteUrl, mail } = await issueInvite(c, {
    name: row.name,
    email: row.email,
    role: row.role,
  });

  await writeAudit(c, {
    action: 'user.invite_resend',
    targetType: 'user',
    targetId: id,
    summary: `${row.name}（${row.email}）`,
  });

  return c.json({
    item: mapStaff(row),
    invite_url: inviteUrl,
    mail: { sent: mail.sent, provider: mail.provider },
  });
});

usersActionRoutes.patch('/:id', requireAdmin, async (c) => {
  const id = c.req.param('id') ?? '';
  const row = await loadStaff(c, id);
  if (!row) return fail(c, 404, 'user_not_found', '账号不存在');

  const body = await readJson<Record<string, unknown>>(c);
  if (!body) return fail(c, 400, 'invalid_request', '请求体必须是 JSON');

  const actor = c.get('user')!;
  const nextRole = body.role === undefined ? row.role : asString(body.role);
  const nextStatus = body.status === undefined ? row.status : asString(body.status);

  if (!STAFF_ROLES.includes(nextRole as StaffRole)) {
    return fail(c, 400, 'invalid_role', '角色不合法');
  }
  if (!STAFF_STATUSES.includes(nextStatus)) {
    return fail(c, 400, 'invalid_status', '账号状态不合法');
  }
  if (row.status === 'invited' && nextStatus === 'active') {
    return fail(c, 409, 'invite_pending', '待激活账号需要通过邀请链接设置密码后才能启用');
  }
  if (nextStatus === 'active' && row.status !== 'active' && !row.password_hash) {
    return fail(c, 409, 'invite_pending', '该账号尚未设置密码，请先发送邀请或重置密码');
  }
  if (id === actor.id && nextRole !== row.role) {
    return fail(c, 400, 'cannot_change_own_role', '不能修改自己的角色');
  }
  if (id === actor.id && nextStatus === 'disabled') {
    return fail(c, 400, 'cannot_disable_self', '不能停用自己的账号');
  }

  const losesAdmin =
    row.role === 'admin' && row.status === 'active' && (nextRole !== 'admin' || nextStatus !== 'active');
  if (losesAdmin) {
    const others = await countOtherActiveAdmins(c, id);
    if (others === 0) return fail(c, 400, 'last_admin', '至少需要保留一个启用中的管理员');
  }

  if (nextRole === row.role && nextStatus === row.status) {
    return c.json({ item: mapStaff(row) });
  }

  await c.env.DB.prepare('UPDATE users SET role = ?, status = ?, updated_at = ? WHERE id = ?')
    .bind(nextRole, nextStatus, nowIso(), id)
    .run();

  if (nextStatus === 'disabled') {
    await c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id).run();
  }

  await writeAudit(c, {
    action: 'user.update',
    targetType: 'user',
    targetId: id,
    summary: `${row.name}（${row.email}）`,
    diff: {
      from: { role: row.role, status: row.status },
      to: { role: nextRole, status: nextStatus },
    },
  });

  const updated = await loadStaff(c, id);
  return c.json({ item: updated ? mapStaff(updated) : null });
});

usersActionRoutes.post('/:id/password', requireAdmin, async (c) => {
  const id = c.req.param('id') ?? '';
  const row = await loadStaff(c, id);
  if (!row) return fail(c, 404, 'user_not_found', '账号不存在');

  const body = await readJson<Record<string, unknown>>(c);
  if (!body) return fail(c, 400, 'invalid_request', '请求体必须是 JSON');

  const password = asString(body.password);
  const problem = passwordProblem(password);
  if (problem) return fail(c, 400, 'weak_password', problem);

  await c.env.DB.prepare(
    'UPDATE users SET password_hash = ?, must_change_password = 1, updated_at = ? WHERE id = ?',
  )
    .bind(await hashPassword(password), nowIso(), id)
    .run();

  const actor = c.get('user')!;
  if (id === actor.id) {
    await c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND id != ?')
      .bind(id, c.get('sessionId') ?? '')
      .run();
  } else {
    await c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id).run();
  }

  await writeAudit(c, {
    action: 'user.reset_password',
    targetType: 'user',
    targetId: id,
    summary: `${row.name}（${row.email}）`,
  });

  return c.json({ ok: true });
});
