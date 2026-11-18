import { Icon } from '../../components/icons';
import { formatDateTime } from '../../lib/format';
import type { AdminUser } from '../../types';
import { BrandSection } from './BrandSection';
import { FooterSection } from './FooterSection';
import { HeaderSection } from './HeaderSection';
import { HomeSectionsSection } from './HomeSectionsSection';
import { LabelsSection } from './LabelsSection';
import { NavSection } from './NavSection';
import { useSiteSettings } from './use-site-settings';
import '../../styles/settings.css';

export interface SettingsPageProps {
  user: AdminUser;
  onUnauthorized: () => void;
}

export function SettingsPage({ user, onUnauthorized }: SettingsPageProps) {
  const isAdmin = user.role === 'admin';
  const {
    config,
    epoch,
    updatedAt,
    loading,
    loadError,
    mode,
    raw,
    setRaw,
    rawError,
    setRawError,
    saving,
    notice,
    contentTypes,
    update,
    switchMode,
    handleSave,
    reload,
  } = useSiteSettings({ isAdmin, onUnauthorized });

  if (loading) {
    return (
      <div className="xw-content">
        <p className="xw-content__desc">正在加载站点配置…</p>
      </div>
    );
  }

  if (loadError || !config) {
    return (
      <div className="xw-content">
        <div className="xw-panel">
          <div className="xw-empty">
            <Icon name="shield" size={22} />
            <p>{loadError ?? '站点配置不可用'}</p>
            <button
              type="button"
              className="xw-btn xw-btn--ghost xw-btn--sm"
              onClick={reload}
            >
              重新加载
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="xw-content xw-settings">
      <header className="xw-content__head">
        <div>
          <p className="xw-content__eyebrow">SETTINGS</p>
          <h1 className="xw-content__title">系统设置</h1>
          <p className="xw-content__desc">
            前台展示全部由这份配置驱动，保存后公共接口会立即切换新配置。
          </p>
        </div>

        <div className="xw-editor__actions">
          <a className="xw-btn xw-btn--ghost" href="/" target="_blank" rel="noreferrer">
            查看前台
            <Icon name="external" size={14} />
          </a>
          <button
            type="button"
            className="xw-btn xw-btn--ghost"
            onClick={() => switchMode(mode === 'form' ? 'json' : 'form')}
          >
            {mode === 'form' ? '高级 JSON' : '返回表单'}
          </button>
          {isAdmin && (
            <button
              type="button"
              className="xw-btn xw-btn--primary"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? '保存中…' : '保存配置'}
            </button>
          )}
        </div>
      </header>

      {!isAdmin && (
        <div className="xw-notice xw-notice--muted" role="status">
          只有管理员可以修改站点配置，当前为只读视图。
        </div>
      )}

      {notice && (
        <div className={`xw-notice xw-notice--${notice.tone}`} role="status">
          {notice.text}
        </div>
      )}

      {mode === 'json' ? (
        <section className="xw-panel">
          <div className="xw-panel__head">
            <h2 className="xw-panel__title">站点配置 JSON</h2>
            <span className="xw-panel__count">结构校验在保存时执行</span>
          </div>
          <div className="xw-panel__body xw-form">
            <textarea
              className="xw-textarea xw-textarea--code xw-json"
              value={raw}
              disabled={!isAdmin}
              spellCheck={false}
              onChange={(event) => {
                setRaw(event.target.value);
                setRawError(null);
              }}
            />
            {rawError && <p className="xw-settings__error">{rawError}</p>}
            <span className="xw-field__hint">
              包含品牌、主题、导航、首页区块、集合页文案、页脚与界面文案；保存前会做结构校验。
            </span>
          </div>
        </section>
      ) : (
        <>
          <BrandSection config={config} disabled={!isAdmin} update={update} />
          <NavSection config={config} disabled={!isAdmin} update={update} />
          <HeaderSection config={config} disabled={!isAdmin} update={update} />
          <HomeSectionsSection
            config={config}
            disabled={!isAdmin}
            update={update}
            contentTypes={contentTypes}
          />
          <FooterSection config={config} disabled={!isAdmin} update={update} />
          <LabelsSection config={config} disabled={!isAdmin} update={update} />
        </>
      )}

      <p className="xw-settings__meta">
        配置版本 epoch：{epoch} · 最近保存：{formatDateTime(updatedAt, '—')}
      </p>
    </div>
  );
}
