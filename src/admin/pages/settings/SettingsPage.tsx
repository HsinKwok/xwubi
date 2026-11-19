import { useState } from 'react';
import { Icon } from '../../components/icons';
import { NoticeBar } from '../../components/NoticeBar';
import { formatDateTime } from '../../lib/format';
import type { AdminUser } from '../../types';
import { BrandSection } from './BrandSection';
import { FooterSection } from './FooterSection';
import { HeaderSection } from './HeaderSection';
import { HomeSectionsSection } from './HomeSectionsSection';
import { LabelsSection } from './LabelsSection';
import { NavSection } from './NavSection';
import { SmtpSection } from './SmtpSection';
import { useSiteSettings } from './use-site-settings';
import '../../styles/settings.css';

export interface SettingsPageProps {
  user: AdminUser;
  onUnauthorized: () => void;
}

type SettingsTab = 'brand' | 'home' | 'footer' | 'mail' | 'advanced';

/** 设置按功能分类，避免所有区块堆在同一页 */
const TABS: Array<{ key: SettingsTab; label: string }> = [
  { key: 'brand', label: '品牌与导航' },
  { key: 'home', label: '首页区块' },
  { key: 'footer', label: '页脚与文案' },
  { key: 'mail', label: '邮件服务' },
  { key: 'advanced', label: '高级 JSON' },
];

export function SettingsPage({ user, onUnauthorized }: SettingsPageProps) {
  const isAdmin = user.role === 'admin';
  const [tab, setTab] = useState<SettingsTab>('brand');
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

  // 邮件服务涉及 SMTP 凭据，仅管理员可见
  const tabs = isAdmin ? TABS : TABS.filter((item) => item.key !== 'mail');

  function changeTab(next: SettingsTab) {
    if (next === tab) return;

    if (next === 'advanced') {
      switchMode('json');
      setTab('advanced');
      return;
    }

    if (mode === 'json' && !switchMode('form')) return;
    setTab(next);
  }

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
            前台展示与邮件服务按功能分类管理，保存后公共接口会立即切换新配置。
          </p>
        </div>

        <div className="xw-editor__actions">
          <a className="xw-btn xw-btn--ghost" href="/" target="_blank" rel="noreferrer">
            查看前台
            <Icon name="external" size={14} />
          </a>
          {isAdmin && tab !== 'mail' && (
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

      <nav className="xw-settings__tabs" role="tablist" aria-label="设置分类">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            className={`xw-settings__tab${tab === item.key ? ' is-active' : ''}`}
            onClick={() => changeTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <NoticeBar notice={notice} />

      {tab === 'brand' && (
        <div className="xw-settings__tab-body">
          <BrandSection config={config} disabled={!isAdmin} update={update} />
          <NavSection config={config} disabled={!isAdmin} update={update} />
          <HeaderSection config={config} disabled={!isAdmin} update={update} />
        </div>
      )}

      {tab === 'home' && (
        <div className="xw-settings__tab-body">
          <HomeSectionsSection
            config={config}
            disabled={!isAdmin}
            update={update}
            contentTypes={contentTypes}
          />
        </div>
      )}

      {tab === 'footer' && (
        <div className="xw-settings__tab-body">
          <FooterSection config={config} disabled={!isAdmin} update={update} />
          <LabelsSection config={config} disabled={!isAdmin} update={update} />
        </div>
      )}

      {tab === 'mail' && <SmtpSection isAdmin={isAdmin} onUnauthorized={onUnauthorized} />}

      {tab === 'advanced' && (
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
      )}

      <p className="xw-settings__meta">
        配置版本 epoch：{epoch} · 最近保存：{formatDateTime(updatedAt, '—')}
      </p>
    </div>
  );
}
