import { Hono } from 'hono';
import type { AppEnv } from '../../lib/env';
import { writeAudit } from '../../lib/audit';
import { fail, readJson } from '../../lib/http';
import {
  emptySmtpView,
  loadSmtpConfig,
  parseSmtpConfig,
  saveSmtpConfig,
  toSmtpView,
} from '../../lib/mail-config';
import { sendMail, testMail } from '../../lib/mailer';
import { requireRole } from '../../lib/session';
import { EMAIL_PATTERN } from '../../lib/validation';

export const mailSettingsRoutes = new Hono<AppEnv>();

const requireAdmin = requireRole('admin');

mailSettingsRoutes.get('/mail-settings', requireAdmin, async (c) => {
  const config = await loadSmtpConfig(c.env);
  const row = await c.env.DB.prepare("SELECT updated_at FROM settings WHERE key = 'mail_smtp'")
    .first<{ updated_at: string }>();

  return c.json({
    config: config ? toSmtpView(config) : emptySmtpView(),
    updated_at: row?.updated_at ?? null,
  });
});

mailSettingsRoutes.put('/mail-settings', requireAdmin, async (c) => {
  const body = await readJson<Record<string, unknown>>(c);
  if (!body) return fail(c, 400, 'invalid_request', '请求体必须是 JSON');

  const previous = await loadSmtpConfig(c.env);
  const parsed = parseSmtpConfig(body, previous);
  if (!parsed.config) return fail(c, 422, 'invalid_smtp', parsed.error ?? 'SMTP 配置不合法');

  const updatedAt = await saveSmtpConfig(c.env, parsed.config, c.get('user')?.id ?? null);

  await writeAudit(c, {
    action: 'settings.update',
    targetType: 'settings',
    targetId: 'mail_smtp',
    summary: 'SMTP 邮件设置',
  });

  return c.json({ config: toSmtpView(parsed.config), updated_at: updatedAt });
});

mailSettingsRoutes.post('/mail-settings/test', requireAdmin, async (c) => {
  const body = await readJson<Record<string, unknown>>(c);
  const to = typeof body?.to === 'string' ? body.to.trim() : '';

  if (!EMAIL_PATTERN.test(to)) return fail(c, 400, 'invalid_request', '请填写合法的收件邮箱');

  const config = await loadSmtpConfig(c.env);
  if (!config || !config.enabled || !config.host) {
    return fail(c, 400, 'mail_not_configured', '请先保存并启用 SMTP 配置');
  }

  const result = await sendMail(c.env, testMail(to));

  if (!result.sent) {
    return fail(c, 502, 'mail_failed', result.error ?? '测试邮件发送失败，请检查 SMTP 配置');
  }

  return c.json({ sent: true, provider: result.provider });
});
