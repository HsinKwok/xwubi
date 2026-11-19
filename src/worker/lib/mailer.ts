import type { Env } from './env';
import { loadSmtpConfig } from './mail-config';
import { sendSmtpMail } from './smtp';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface MailResult {
  sent: boolean;
  provider: 'smtp' | 'console';
  error?: string;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}

function encodeBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** 按 RFC 2045 每 76 字符折行，避免长行被邮件网关截断 */
function wrapBase64(value: string): string {
  return encodeBase64(value).replace(/(.{76})/g, '$1\r\n');
}

/** 非 ASCII 头部使用 RFC 2047 base64 编码，并清理换行防止头部注入 */
function encodeHeader(value: string): string {
  const cleaned = value.replace(/[\r\n]+/g, ' ').trim();
  if (/^[\x20-\x7e]*$/.test(cleaned)) return cleaned;
  return `=?UTF-8?B?${encodeBase64(cleaned)}?=`;
}

function buildMimeMessage(
  sender: { from: string; fromName: string },
  message: MailMessage,
): string {
  const to = message.to.replace(/[\r\n]+/g, '').trim();
  const fromHeader = sender.fromName
    ? `${encodeHeader(sender.fromName)} <${sender.from}>`
    : `<${sender.from}>`;
  const domain = sender.from.split('@')[1] || 'xwubi.com';
  const headers = [
    `From: ${fromHeader}`,
    `To: <${to}>`,
    `Subject: ${encodeHeader(message.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@${domain}>`,
    'MIME-Version: 1.0',
  ];

  if (!message.html) {
    return [
      ...headers,
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      wrapBase64(message.text),
    ].join('\r\n');
  }

  const boundary = `xwubi-${crypto.randomUUID()}`;
  return [
    ...headers,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    wrapBase64(message.text),
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    wrapBase64(message.html),
    `--${boundary}--`,
  ].join('\r\n');
}

/** 生成邮件里的站内链接前缀：优先 SITE_ORIGIN，其次当前请求来源 */
export function requestOrigin(env: Env, requestUrl: string): string {
  const configured = (env.SITE_ORIGIN ?? '').trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // 配置不合法时退回请求来源
    }
  }
  return new URL(requestUrl).origin;
}

function wrapHtml(title: string, paragraphs: string[], action?: { label: string; href: string }): string {
  const body = paragraphs.map((text) => `<p style="margin:0 0 16px">${text}</p>`).join('');
  const button = action
    ? `<p style="margin:24px 0"><a href="${escapeHtml(action.href)}" style="display:inline-block;padding:10px 20px;border-radius:6px;background:#1a1a1a;color:#fff;text-decoration:none">${escapeHtml(action.label)}</a></p>
       <p style="margin:0;font-size:12px;color:#666;word-break:break-all">如果按钮无法点击，请复制此链接到浏览器打开：<br>${escapeHtml(action.href)}</p>`
    : '';
  return `<!doctype html><html lang="zh-CN"><body style="margin:0;padding:24px;background:#f5f5f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a1a">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:10px;padding:32px">
    <p style="margin:0 0 24px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#888">xwubi 管理台</p>
    <h1 style="margin:0 0 20px;font-size:20px;line-height:1.4">${escapeHtml(title)}</h1>
    ${body}
    ${button}
  </div>
</body></html>`;
}

/** 使用系统设置中的 SMTP 配置发信；未配置时打印到日志，避免阻断业务流程 */
export async function sendMail(env: Env, message: MailMessage): Promise<MailResult> {
  const config = await loadSmtpConfig(env);

  if (!config || !config.enabled || !config.host) {
    console.log(`[mail:console] to=${message.to} subject=${message.subject}\n${message.text}`);
    return { sent: false, provider: 'console' };
  }

  try {
    await sendSmtpMail(
      {
        host: config.host,
        port: config.port,
        security: config.security,
        username: config.username,
        password: config.password,
      },
      {
        from: config.from,
        to: message.to,
        data: buildMimeMessage({ from: config.from, fromName: config.fromName }, message),
      },
    );

    return { sent: true, provider: 'smtp' };
  } catch (error) {
    console.error('[mail:smtp]', error);
    const detail = error instanceof Error ? error.message : '未知错误';
    return { sent: false, provider: 'smtp', error: detail.slice(0, 200) };
  }
}

/** 系统设置页「发送测试邮件」使用 */
export function testMail(to: string): MailMessage {
  const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  return {
    to,
    subject: 'xwubi 邮件服务测试',
    text: `这是一封来自 xwubi 管理台的测试邮件。

发送时间：${now}

如果收到这封邮件，说明 SMTP 配置可用。`,
    html: wrapHtml('SMTP 测试邮件', [
      '这是一封来自 xwubi 管理台的测试邮件。',
      `发送时间：${escapeHtml(now)}`,
      '如果收到这封邮件，说明 SMTP 配置可用。',
    ]),
  };
}

export function inviteMail(input: {
  to: string;
  name: string;
  roleLabel: string;
  inviteUrl: string;
  expiresAt: string;
}): MailMessage {
  const deadline = new Date(input.expiresAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  const text = `你好 ${input.name}：

管理员邀请你以「${input.roleLabel}」身份加入 xwubi 管理台。

请在 ${deadline} 前通过下面的链接设置密码并激活账号：
${input.inviteUrl}

如果这不是你本人的邀请，请忽略这封邮件。`;

  return {
    to: input.to,
    subject: '邀请你加入 xwubi 管理台',
    text,
    html: wrapHtml(
      `你被邀请以「${escapeHtml(input.roleLabel)}」身份加入 xwubi 管理台`,
      [
        `你好 ${escapeHtml(input.name)}：`,
        `管理员邀请你加入 xwubi 管理台，请点击下方按钮设置密码并激活账号。链接有效期至 ${escapeHtml(deadline)}。`,
        '如果这不是你本人的邀请，请忽略这封邮件。',
      ],
      { label: '设置密码并激活', href: input.inviteUrl },
    ),
  };
}

export function submissionConfirmMail(input: {
  to: string;
  title: string;
  confirmUrl: string;
  statusUrl: string;
  expiresAt: string;
}): MailMessage {
  const deadline = new Date(input.expiresAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  const text = `你好：

我们收到了你在 xwubi 提交的内容「${input.title}」。

请先确认邮箱，确认后才会进入人工审核：
${input.confirmUrl}

之后可以凭下面的链接随时查看处理进度（请妥善保存，不要转发）：
${input.statusUrl}

链接有效期至 ${deadline}。如果不是你提交的，请忽略这封邮件。`;

  return {
    to: input.to,
    subject: '确认你的 xwubi 投稿',
    text,
    html: wrapHtml(
      '确认你的投稿',
      [
        `我们收到了你提交的内容「${escapeHtml(input.title)}」，请先确认邮箱，确认后才会进入人工审核。`,
        `链接有效期至 ${escapeHtml(deadline)}。如果不是你提交的，请忽略这封邮件。`,
      ],
      { label: '确认邮箱', href: input.confirmUrl },
    ),
  };
}

export function passwordResetMail(input: {
  to: string;
  name: string;
  resetUrl: string;
  expiresAt: string;
}): MailMessage {
  const deadline = new Date(input.expiresAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  const text = `你好 ${input.name}：

我们收到了重置 xwubi 管理台密码的请求。请在 ${deadline} 前通过下面的链接重新设置密码：
${input.resetUrl}

如果这不是你本人的操作，请忽略这封邮件，密码不会发生变化。`;

  return {
    to: input.to,
    subject: '重置 xwubi 管理台密码',
    text,
    html: wrapHtml(
      '重置管理台密码',
      [
        `你好 ${escapeHtml(input.name)}：`,
        `我们收到了重置密码的请求，请点击下方按钮重新设置密码。链接有效期至 ${escapeHtml(deadline)}。`,
        '如果这不是你本人的操作，请忽略这封邮件，密码不会发生变化。',
      ],
      { label: '设置新密码', href: input.resetUrl },
    ),
  };
}
