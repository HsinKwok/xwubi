import { STAFF_ROLES, ROLE_LABELS } from '../../types';
import type { StaffRole } from '../../types';
import type { StaffCreateForm } from './staff-utils';

interface StaffCreatePanelProps {
  open: boolean;
  form: StaffCreateForm;
  saving: boolean;
  onChange: (patch: Partial<StaffCreateForm>) => void;
  onGeneratePassword: () => void;
  onSubmit: () => void;
  onCancel: () => void;
}

/** 管理员直接创建员工账号：设定初始密码，首次登录强制修改 */
export function StaffCreatePanel({
  open,
  form,
  saving,
  onChange,
  onGeneratePassword,
  onSubmit,
  onCancel,
}: StaffCreatePanelProps) {
  if (!open) return null;

  return (
    <div className="xw-panel xw-panel--form">
      <div className="xw-form">
        <div className="xw-form__row">
          <label className="xw-field">
            <span className="xw-field__label">姓名</span>
            <input
              className="xw-input"
              value={form.name}
              maxLength={32}
              placeholder="例如：李四"
              onChange={(event) => onChange({ name: event.target.value })}
            />
          </label>
          <label className="xw-field">
            <span className="xw-field__label">邮箱</span>
            <input
              className="xw-input"
              type="email"
              value={form.email}
              placeholder="name@example.com"
              onChange={(event) => onChange({ email: event.target.value })}
            />
          </label>
        </div>

        <div className="xw-form__row">
          <label className="xw-field">
            <span className="xw-field__label">角色</span>
            <select
              className="xw-select xw-select--block"
              value={form.role}
              onChange={(event) => onChange({ role: event.target.value as StaffRole })}
            >
              {STAFF_ROLES.map((item) => (
                <option value={item} key={item}>
                  {ROLE_LABELS[item]}
                </option>
              ))}
            </select>
          </label>
          <label className="xw-field">
            <span className="xw-field__label">初始密码</span>
            <span className="xw-inline-form">
              <input
                className="xw-input"
                value={form.password}
                maxLength={128}
                placeholder="8-128 位，需含字母和数字"
                autoComplete="new-password"
                onChange={(event) => onChange({ password: event.target.value })}
              />
              <button
                type="button"
                className="xw-btn xw-btn--ghost xw-btn--sm"
                onClick={onGeneratePassword}
              >
                随机生成
              </button>
            </span>
          </label>
        </div>

        <span className="xw-field__hint">
          账号创建后立即启用，对方首次登录时必须修改密码；请把初始密码通过安全渠道转交。
        </span>

        <div className="xw-form__actions">
          <button type="button" className="xw-btn xw-btn--ghost xw-btn--sm" onClick={onCancel}>
            取消
          </button>
          <button
            type="button"
            className="xw-btn xw-btn--primary xw-btn--sm"
            disabled={
              saving ||
              form.name.trim().length < 2 ||
              !form.email.trim() ||
              form.password.length < 8
            }
            onClick={onSubmit}
          >
            {saving ? '创建中…' : '创建账号'}
          </button>
        </div>
      </div>
    </div>
  );
}
