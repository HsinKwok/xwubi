import { connect } from 'cloudflare:sockets';
import type { SmtpSecurity } from '../../shared/mail-config';

/** 通过 Cloudflare Workers TCP Socket 直接与 SMTP 服务器对话（支持 SSL / STARTTLS） */

export interface SmtpEndpoint {
  host: string;
  port: number;
  security: SmtpSecurity;
  username: string;
  password: string;
}

const TIMEOUT_MS = 20000;

class SmtpError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SmtpError';
  }
}

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new SmtpError(`${label}超时`)), TIMEOUT_MS);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function base64Utf8(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

interface SmtpResponse {
  code: number;
  lines: string[];
}

class SmtpSession {
  private socket: Socket;
  private writer: WritableStreamDefaultWriter<Uint8Array>;
  private reader: ReadableStreamDefaultReader<Uint8Array>;
  private decoder = new TextDecoder();
  private buffer = '';

  private constructor(socket: Socket) {
    this.socket = socket;
    this.writer = socket.writable.getWriter();
    this.reader = socket.readable.getReader();
  }

  static async open(endpoint: SmtpEndpoint): Promise<SmtpSession> {
    const secureTransport =
      endpoint.security === 'tls' ? 'on' : endpoint.security === 'starttls' ? 'starttls' : 'off';
    const socket = connect(
      { hostname: endpoint.host, port: endpoint.port },
      { secureTransport, allowHalfOpen: false },
    );

    try {
      await withTimeout(socket.opened, '连接 SMTP 服务器');
    } catch (error) {
      await socket.close().catch(() => undefined);
      throw error;
    }

    return new SmtpSession(socket);
  }

  private async refill(): Promise<void> {
    const chunk = await withTimeout(this.reader.read(), '读取 SMTP 响应');
    if (chunk.done) throw new SmtpError('SMTP 服务器意外关闭连接');
    this.buffer += this.decoder.decode(chunk.value, { stream: true });
  }

  private async readLine(): Promise<string> {
    while (!this.buffer.includes('\n')) await this.refill();
    const index = this.buffer.indexOf('\n');
    const line = this.buffer.slice(0, index).replace(/\r$/, '');
    this.buffer = this.buffer.slice(index + 1);
    return line;
  }

  async readResponse(): Promise<SmtpResponse> {
    const lines: string[] = [];

    while (true) {
      const line = await this.readLine();
      lines.push(line);
      const match = /^(\d{3})([ -]|$)/.exec(line);
      if (!match) throw new SmtpError(`无法解析 SMTP 响应：${line.slice(0, 120)}`);
      if (match[2] !== '-') return { code: Number(match[1]), lines };
    }
  }

  async write(text: string): Promise<void> {
    await withTimeout(this.writer.write(new TextEncoder().encode(text)), '发送 SMTP 命令');
  }

  async command(command: string, expected: number | number[]): Promise<SmtpResponse> {
    await this.write(`${command}\r\n`);
    const response = await this.readResponse();
    const allowed = Array.isArray(expected) ? expected : [expected];

    if (!allowed.includes(response.code)) {
      const name = command.split(' ')[0];
      const detail = response.lines.join(' ').slice(0, 200);
      throw new SmtpError(`SMTP ${name} 失败（${response.code}）：${detail}`);
    }

    return response;
  }

  async startTls(host: string): Promise<void> {
    this.reader.releaseLock();
    this.writer.releaseLock();

    const secure = this.socket.startTls({ expectedServerHostname: host });
    await withTimeout(secure.opened, 'TLS 握手');

    this.socket = secure;
    this.writer = secure.writable.getWriter();
    this.reader = secure.readable.getReader();
    this.decoder = new TextDecoder();
    this.buffer = '';
  }

  async close(): Promise<void> {
    try {
      await this.socket.close();
    } catch {
      // 关闭阶段的异常不影响已完成的投递结果
    }
  }
}

export async function sendSmtpMail(
  endpoint: SmtpEndpoint,
  envelope: { from: string; to: string; data: string },
): Promise<void> {
  const session = await SmtpSession.open(endpoint);

  try {
    const greeting = await session.readResponse();
    if (greeting.code !== 220) {
      throw new SmtpError(`SMTP 服务不可用（${greeting.code}）`);
    }

    const ehloName = envelope.from.split('@')[1] || 'localhost';
    let ehlo = await session.command(`EHLO ${ehloName}`, 250);
    let capabilities = ehlo.lines.join('\n').toUpperCase();

    if (endpoint.security === 'starttls') {
      await session.command('STARTTLS', 220);
      await session.startTls(endpoint.host);
      ehlo = await session.command(`EHLO ${ehloName}`, 250);
      capabilities = ehlo.lines.join('\n').toUpperCase();
    }

    if (endpoint.username) {
      const supportsLogin = /AUTH[^\n]*\bLOGIN\b/.test(capabilities);
      const supportsPlain = /AUTH[^\n]*\bPLAIN\b/.test(capabilities);

      if (supportsLogin) {
        await session.command('AUTH LOGIN', 334);
        await session.command(base64Utf8(endpoint.username), 334);
        await session.command(base64Utf8(endpoint.password), 235);
      } else if (supportsPlain) {
        const token = base64Utf8(`\0${endpoint.username}\0${endpoint.password}`);
        await session.command(`AUTH PLAIN ${token}`, 235);
      } else {
        throw new SmtpError('SMTP 服务器未提供 LOGIN / PLAIN 认证方式');
      }
    }

    await session.command(`MAIL FROM:<${envelope.from}>`, 250);
    await session.command(`RCPT TO:<${envelope.to}>`, [250, 251]);
    await session.command('DATA', 354);
    await session.write(`${envelope.data}\r\n.\r\n`);

    const accepted = await session.readResponse();
    if (accepted.code !== 250) {
      const detail = accepted.lines.join(' ').slice(0, 200);
      throw new SmtpError(`SMTP 拒收邮件（${accepted.code}）：${detail}`);
    }

    try {
      await session.command('QUIT', 221);
    } catch {
      // QUIT 失败不影响投递结果
    }
  } finally {
    await session.close();
  }
}
