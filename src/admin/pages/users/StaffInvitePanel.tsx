import { STAFF_ROLES, ROLE_LABELS } from '../../types';
import type { StaffRole } from '../../types';
import type { StaffForm } from './staff-utils';

interface StaffInvitePanelProps {
  creating: boolean;
  form: StaffForm;
  saving: boolean;
  inviteLink: string;
  onChange: (patch: Partial<StaffForm>) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onCopyLink: () => void;
}

/** 邀请表单与邀请链接展示 */
export function StaffInvitePanel({
  creating,
  form,
  saving,
  inviteLink,
  onChange,
  onSubmit,
  onCancel,
  onCopyLink,
}: StaffInvitePanelProps) {
  return (
    <>
      {inviteLink && (
        <div className="xw-panel xw-panel--form">
          <div className="xw-inline-form">
            <input
              className="xw-input"
              readOnly
              value={inviteLink}
              aria-label="邀请链接"
              onFocus={(event) => event.currentTarget.select()}
            />
            <button
              type="button"
              className="xw-btn xw-btn--ghost xw-btn--sm"
              onClick={onCopyLink}
            >
              复制链接
            </button>
          </div>
        </div>
      )}

      {creating && (
        <div className="xw-panel xw-panel--form">
          <div className="xw-form">
            <div className="xw-form__row">
              <label className="xw-field">
                <span className="xw-field__label">姓名</span>
                <input
                  className="xw-input"
                  value={form.name}
                  maxLength={32}
                  placeholder="例如：张三"
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
                <span className="xw-field__label">邀请方式</span>
                <span className="xw-field__hint">
                  系统会发送设置密码的邀请邮件，对方激活后账号才会启用。
                </span>
              </label>
            </div>

            <div className="xw-form__actions">
              <button
                type="button"
                className="xw-btn xw-btn--ghost xw-btn--sm"
                onClick={onCancel}
              >
                取消
              </button>
              <button
                type="button"
                className="xw-btn xw-btn--primary xw-btn--sm"
                disabled={saving || form.name.trim().length < 2 || !form.email.trim()}
                onClick={onSubmit}
              >
                {saving ? '发送中…' : '发送邀请'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
