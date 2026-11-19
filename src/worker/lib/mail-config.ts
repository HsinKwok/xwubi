import {
  SMTP_DEFAULTS,
  type SmtpConfigView,
  type SmtpSecurity,
} from '../../shared/mail-config';
import type { Env } from './env';
import { EMAIL_PATTERN } from './validation';

/** 存储在 settings 表中的键名 */
const SETTINGS_KEY = 'mail_smtp';
const SECURITY_VALUES: SmtpSecurity[] = ['tls', 'starttls', 'none'];

/** 服务端完整配置，含明文密码，不要直接返回给前端 */
export interface StoredSmtpConfig {
  enabled: boolean;
  host: string;
  port: number;
  security: SmtpSecurity;
  username: string;
  password: string;
  from: string;
  fromName: string;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function pickSecurity(value: unknown): SmtpSecurity {
  return SECURITY_VALUES.includes(value as SmtpSecurity)
    ? (value as SmtpSecurity)
    : SMTP_DEFAULTS.security;
}

export async function loadSmtpConfig(env: Env): Promise<StoredSmtpConfig | null> {
  const fallbackFrom = (env.MAIL_FROM ?? '').trim();
  let row: { value: string } | null = null;

  try {
    row = await env.DB.prepare('SELECT value FROM settings WHERE key = ?')
      .bind(SETTINGS_KEY)
      .first<{ value: string }>();
  } catch (error) {
    console.error('[mail] 读取 SMTP 设置失败', error);
    return null;
  }

  if (!row) {
    if (!fallbackFrom) return null;
    return { ...SMTP_DEFAULTS, from: fallbackFrom, password: '' };
  }

  try {
    const parsed = JSON.parse(row.value) as Partial<StoredSmtpConfig>;
    return {
      enabled: parsed.enabled === true,
      host: text(parsed.host),
      port: Number.isInteger(parsed.port) ? Number(parsed.port) : SMTP_DEFAULTS.port,
      security: pickSecurity(parsed.security),
      username: text(parsed.username),
      password: typeof parsed.password === 'string' ? parsed.password : '',
      from: text(parsed.from) || fallbackFrom,
      fromName: text(parsed.fromName) || SMTP_DEFAULTS.fromName,
    };
  } catch {
    return null;
  }
}

export function toSmtpView(config: StoredSmtpConfig): SmtpConfigView {
  return {
    enabled: config.enabled,
    host: config.host,
    port: config.port,
    security: config.security,
    username: config.username,
    from: config.from,
    fromName: config.fromName,
    password_set: config.password.length > 0,
  };
}

export function emptySmtpView(): SmtpConfigView {
  return { ...SMTP_DEFAULTS, password_set: false };
}

/** 校验管理台提交的 SMTP 配置；密码留空表示沿用已保存的密码 */
export function parseSmtpConfig(
  body: Record<string, unknown>,
  previous: StoredSmtpConfig | null,
): { config?: StoredSmtpConfig; error?: string } {
  const enabled = body.enabled === true;
  const host = text(body.host);
  const port = Number(body.port);
  const security = pickSecurity(body.security);
  const username = text(body.username);
  const from = text(body.from);
  const fromName = text(body.fromName) || SMTP_DEFAULTS.fromName;
  const submittedPassword = typeof body.password === 'string' ? body.password : '';
  const password = submittedPassword.length > 0 ? submittedPassword : previous?.password ?? '';

  if (!SECURITY_VALUES.includes(body.security as SmtpSecurity)) {
    return { error: '加密方式不合法' };
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return { error: '端口需为 1-65535 的整数' };
  }
  if (host.length > 190 || /[\s/]/.test(host)) {
    return { error: '服务器地址不合法，只填写域名或 IP' };
  }
  if (username.length > 190) return { error: 'SMTP 账号过长' };
  if (fromName.length > 64) return { error: '发件人名称不能超过 64 个字符' };

  if (enabled) {
    if (!host) return { error: '启用发信前请填写 SMTP 服务器地址' };
    if (!EMAIL_PATTERN.test(from)) return { error: '请填写合法的发件人邮箱' };
    if (username && !password) return { error: '请填写 SMTP 密码' };
  }

  return {
    config: { enabled, host, port, security, username, password, from, fromName },
  };
}

export async function saveSmtpConfig(
  env: Env,
  config: StoredSmtpConfig,
  updatedBy: string | null,
): Promise<string> {
  const updatedAt = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO settings (key, value, updated_by, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET
       value = excluded.value,
       updated_by = excluded.updated_by,
       updated_at = excluded.updated_at`,
  )
    .bind(SETTINGS_KEY, JSON.stringify(config), updatedBy, updatedAt)
    .run();

  return updatedAt;
}
