import { useEffect, useState } from 'react';
import type { SmtpSecurity } from '../../../shared/mail-config';
import { resolveAdminError } from '../../lib/api';
import {
  getMailSettings,
  saveMailSettings,
  sendTestMail,
} from '../../lib/mail-settings-api';
import { NoticeBar } from '../../components/NoticeBar';
import type { NoticeLike } from '../../components/NoticeBar';

interface SmtpSectionProps {
  isAdmin: boolean;
  onUnauthorized: () => void;
}

interface SmtpFormState {
  enabled: boolean;
  host: string;
  port: string;
  security: SmtpSecurity;
  username: string;
  password: string;
  from: string;
  fromName: string;
}

const EMPTY_FORM: SmtpFormState = {
  enabled: false,
  host: '',
  port: '465',
  security: 'tls',
  username: '',
  password: '',
  from: '',
  fromName: 'xwubi 管理台',
};

const SECURITY_OPTIONS: Array<{ value: SmtpSecurity; label: string }> = [
  { value: 'tls', label: 'SSL / TLS（常用 465）' },
  { value: 'starttls', label: 'STARTTLS（常用 587）' },
  { value: 'none', label: '不加密（仅内网调试）' },
];

/** 系统设置 → 邮件服务：SMTP 发信配置与测试 */
export function SmtpSection({ isAdmin, onUnauthorized }: SmtpSectionProps) {
  const [form, setForm] = useState<SmtpFormState>(EMPTY_FORM);
  const [passwordSet, setPasswordSet] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<NoticeLike | null>(null);

  const [testTo, setTestTo] = useState('');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    getMailSettings(controller.signal)
      .then((payload) => {
        if (controller.signal.aborted) return;
        setForm({
          enabled: payload.config.enabled,
          host: payload.config.host,
          port: String(payload.config.port),
          security: payload.config.security,
          username: payload.config.username,
          password: '',
          from: payload.config.from,
          fromName: payload.config.fromName,
        });
        setPasswordSet(payload.config.password_set);
        setUpdatedAt(payload.updated_at);
        setLoading(false);
      })
      .catch((caught) => {
        if (controller.signal.aborted) return;
        const message = resolveAdminError(caught, 'SMTP 配置加载失败', onUnauthorized);
        if (message) setNotice({ tone: 'error', text: message });
        setLoading(false);
      });

    return () => controller.abort();
  }, [onUnauthorized]);

  function update(patch: Partial<SmtpFormState>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  async function handleSave() {
    if (!isAdmin || saving) return;
    setSaving(true);
    setNotice(null);

    try {
      const payload = await saveMailSettings({
        enabled: form.enabled,
        host: form.host.trim(),
        port: Number(form.port),
        security: form.security,
        username: form.username.trim(),
        from: form.from.trim(),
        fromName: form.fromName.trim(),
        password: form.password,
      });

      setForm((current) => ({ ...current, enabled: payload.config.enabled, password: '' }));
      setPasswordSet(payload.config.password_set);
      setUpdatedAt(payload.updated_at);
      setNotice({ tone: 'ok', text: 'SMTP 设置已保存。' });
    } catch (caught) {
      const message = resolveAdminError(caught, '保存失败，请检查配置', onUnauthorized);
      if (message) setNotice({ tone: 'error', text: message });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    if (!isAdmin || testing) return;
    setTesting(true);
    setNotice(null);

    try {
      const result = await sendTestMail(testTo.trim());
      setNotice({
        tone: 'ok',
        text: `测试邮件已通过 ${result.provider} 发送，请到收件箱确认。`,
      });
    } catch (caught) {
      const message = resolveAdminError(caught, '测试邮件发送失败', onUnauthorized);
      if (message) setNotice({ tone: 'error', text: message });
    } finally {
      setTesting(false);
    }
  }

  return (
    <section className="xw-panel">
      <div className="xw-panel__head">
        <h2 className="xw-panel__title">SMTP 发信服务</h2>
        <span className="xw-field__hint">
          {loading
            ? '加载中…'
            : updatedAt
              ? `最后更新：${new Date(updatedAt).toLocaleString('zh-CN')}`
              : '尚未配置'}
        </span>
      </div>

      <div className="xw-panel__body xw-form">
        <NoticeBar notice={notice} />

        <label className="xw-check-line">
          <input
            type="checkbox"
            className="xw-check"
            checked={form.enabled}
            disabled={!isAdmin || loading}
            onChange={(event) => update({ enabled: event.target.checked })}
          />
          启用 SMTP 发信（邀请员工、找回密码等通知邮件）
        </label>

        <div className="xw-form__row">
          <label className="xw-field">
            <span className="xw-field__label">SMTP 服务器</span>
            <input
              className="xw-input"
              value={form.host}
              disabled={!isAdmin || loading}
              placeholder="smtp.example.com"
              onChange={(event) => update({ host: event.target.value })}
            />
          </label>
          <label className="xw-field">
            <span className="xw-field__label">端口</span>
            <input
              className="xw-input"
              type="number"
              min={1}
              max={65535}
              value={form.port}
              disabled={!isAdmin || loading}
              onChange={(event) => update({ port: event.target.value })}
            />
          </label>
        </div>

        <div className="xw-form__row">
          <label className="xw-field">
            <span className="xw-field__label">加密方式</span>
            <select
              className="xw-select xw-select--block"
              value={form.security}
              disabled={!isAdmin || loading}
              onChange={(event) => update({ security: event.target.value as SmtpSecurity })}
            >
              {SECURITY_OPTIONS.map((item) => (
                <option value={item.value} key={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="xw-field">
            <span className="xw-field__label">SMTP 账号</span>
            <input
              className="xw-input"
              value={form.username}
              disabled={!isAdmin || loading}
              placeholder="通常与发件邮箱相同"
              autoComplete="off"
              onChange={(event) => update({ username: event.target.value })}
            />
          </label>
        </div>

        <div className="xw-form__row">
          <label className="xw-field">
            <span className="xw-field__label">SMTP 密码 / 授权码</span>
            <input
              className="xw-input"
              type="password"
              value={form.password}
              disabled={!isAdmin || loading}
              placeholder={passwordSet ? '已保存，留空则不修改' : '请输入密码或授权码'}
              autoComplete="new-password"
              onChange={(event) => update({ password: event.target.value })}
            />
          </label>
          <label className="xw-field">
            <span className="xw-field__label">发件人名称</span>
            <input
              className="xw-input"
              value={form.fromName}
              disabled={!isAdmin || loading}
              maxLength={64}
              onChange={(event) => update({ fromName: event.target.value })}
            />
          </label>
        </div>

        <label className="xw-field">
          <span className="xw-field__label">发件人邮箱</span>
          <input
            className="xw-input"
            type="email"
            value={form.from}
            disabled={!isAdmin || loading}
            placeholder="noreply@xwubi.com"
            onChange={(event) => update({ from: event.target.value })}
          />
          <span className="xw-field__hint">
            Workers 无法使用 25 端口，推荐 465（SSL）或 587（STARTTLS）；多数邮箱需填写「授权码」而非登录密码。
          </span>
        </label>

        <div className="xw-form__actions">
          <button
            type="button"
            className="xw-btn xw-btn--primary xw-btn--sm"
            disabled={!isAdmin || loading || saving}
            onClick={() => void handleSave()}
          >
            {saving ? '保存中…' : '保存 SMTP 设置'}
          </button>
        </div>

        <div className="xw-settings__divider" />

        <div className="xw-inline-form">
          <input
            className="xw-input"
            type="email"
            value={testTo}
            disabled={!isAdmin || loading}
            placeholder="填写收件邮箱后发送测试邮件"
            aria-label="测试邮件收件邮箱"
            onChange={(event) => setTestTo(event.target.value)}
          />
          <button
            type="button"
            className="xw-btn xw-btn--ghost xw-btn--sm"
            disabled={!isAdmin || loading || testing || !testTo.trim()}
            onClick={() => void handleTest()}
          >
            {testing ? '发送中…' : '发送测试邮件'}
          </button>
        </div>
      </div>
    </section>
  );
}
