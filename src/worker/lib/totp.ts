/**
 * TOTP（RFC 6238）：base32 密钥 + HMAC-SHA1 + 6 位验证码，30 秒一步。
 * 兼容常见的身份验证器（Google Authenticator、1Password、微软 Authenticator 等）。
 */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const SECRET_BYTES = 20;
const DIGITS = 6;
const STEP_SECONDS = 30;

export function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let buffer = 0;
  let output = '';

  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(buffer >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) output += BASE32_ALPHABET[(buffer << (5 - bits)) & 31];
  return output;
}

export function base32Decode(value: string): Uint8Array {
  const cleaned = value.toUpperCase().replace(/[^A-Z2-7]/g, '');
  const bytes: number[] = [];
  let bits = 0;
  let buffer = 0;

  for (const char of cleaned) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) continue;

    buffer = (buffer << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((buffer >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return new Uint8Array(bytes);
}

export function generateTotpSecret(): string {
  return base32Encode(crypto.getRandomValues(new Uint8Array(SECRET_BYTES)));
}

async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, message);
  return new Uint8Array(signature);
}

async function hotp(secret: string, counter: number): Promise<string> {
  const key = base32Decode(secret);
  if (key.length === 0) throw new Error('TOTP 密钥不合法');

  const message = new Uint8Array(8);
  const view = new DataView(message.buffer);
  view.setUint32(0, Math.floor(counter / 2 ** 32));
  view.setUint32(4, counter % 2 ** 32);

  const digest = await hmacSha1(key, message);
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  return String(binary % 10 ** DIGITS).padStart(DIGITS, '0');
}

export function normalizeTotpCode(value: string): string {
  return value.replace(/\s+/g, '').replace(/[^0-9]/g, '').slice(0, DIGITS);
}

export function currentTotpCounter(now = Date.now()): number {
  return Math.floor(now / 1000 / STEP_SECONDS);
}

export async function totpCode(secret: string, now = Date.now()): Promise<string> {
  return hotp(secret, currentTotpCounter(now));
}

/** 允许前后各一个时间窗口，抵消时钟偏差 */
export async function verifyTotp(
  secret: string,
  code: string,
  window = 1,
  now = Date.now(),
): Promise<boolean> {
  const expected = normalizeTotpCode(code);
  if (expected.length !== DIGITS) return false;

  const counter = currentTotpCounter(now);

  for (let offset = -window; offset <= window; offset += 1) {
    if ((await hotp(secret, counter + offset)) === expected) return true;
  }

  return false;
}

export function otpauthUrl(input: { secret: string; account: string; issuer: string }): string {
  const label = encodeURIComponent(`${input.issuer}:${input.account}`);
  const params = new URLSearchParams({
    secret: input.secret,
    issuer: input.issuer,
    algorithm: 'SHA1',
    digits: String(DIGITS),
    period: String(STEP_SECONDS),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/** 兼容部分客户端只接受纯密钥字符串的场景 */
export function totpSecretForManualEntry(secret: string): string {
  return secret.replace(/(.{4})/g, '$1 ').trim();
}
