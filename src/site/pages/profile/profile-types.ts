export interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  totp_enabled: boolean;
  must_change_password: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface SessionItem {
  id: string;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
  expires_at: string;
  current: boolean;
}

export interface TotpSetup {
  secret: string;
  account: string;
  issuer: string;
  otpauth_url: string;
  expires_in: number;
}

export interface ProfilePayload {
  profile: Profile;
  stats: { content: number; published: number };
}

export interface Notice {
  tone: 'ok' | 'error';
  text: string;
}

export const ROLE_FALLBACKS: Record<string, string> = {
  admin: '管理员',
  editor: '编辑',
  reviewer: '审校',
  ops: '运营',
};

export function deviceLabel(userAgent: string | null): string {
  if (!userAgent) return '未知设备';
  const os = /Windows/i.test(userAgent)
    ? 'Windows'
    : /Mac OS X|Macintosh/i.test(userAgent)
      ? 'macOS'
      : /Android/i.test(userAgent)
        ? 'Android'
        : /iPhone|iPad|iPod/i.test(userAgent)
          ? 'iOS'
          : /Linux/i.test(userAgent)
            ? 'Linux'
            : '其他系统';
  const browser = /Edg\//i.test(userAgent)
    ? 'Edge'
    : /Chrome\//i.test(userAgent)
      ? 'Chrome'
      : /Firefox\//i.test(userAgent)
        ? 'Firefox'
        : /Safari\//i.test(userAgent)
          ? 'Safari'
          : '浏览器';
  return `${os} · ${browser}`;
}

export function spacedSecret(secret: string): string {
  return secret.replace(/(.{4})/g, '$1 ').trim();
}
