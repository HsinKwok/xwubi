import { useState } from 'react';
import { Icon } from '../../components/icons';
import type { AdminUser } from '../../types';
import { StaffPanel } from './StaffPanel';
import { SubmissionsPanel } from './SubmissionsPanel';
import { FeedbackPanel } from './FeedbackPanel';
import '../../styles/review.css';
import '../../styles/inbox.css';

export interface UsersPageProps {
  user: AdminUser;
  onUnauthorized: () => void;
}

type TabKey = 'submissions' | 'feedback' | 'staff';

const TABS: { key: TabKey; label: string; adminOnly?: boolean }[] = [
  { key: 'submissions', label: '投稿' },
  { key: 'feedback', label: '纠错' },
  { key: 'staff', label: '员工账号', adminOnly: true },
];

export function UsersPage({ user, onUnauthorized }: UsersPageProps) {
  const [tab, setTab] = useState<TabKey>('submissions');
  const canManage = user.role === 'admin' || user.role === 'ops';
  const canManageStaff = user.role === 'admin';
  const visibleTabs = TABS.filter((item) => !item.adminOnly || canManageStaff);

  return (
    <div className="xw-content">
      <header className="xw-content__head">
        <div>
          <p className="xw-content__eyebrow">INBOX</p>
          <h1 className="xw-content__title">用户与投稿</h1>
          <p className="xw-content__desc">
            投稿与页面纠错工单，受理后可继续采纳、修复或标记垃圾；管理员可在此维护员工账号。
          </p>
        </div>
      </header>

      {!canManage ? (
        <div className="xw-panel">
          <div className="xw-empty">
            <Icon name="shield" size={22} />
            <p>当前角色没有处理投稿与纠错的权限。</p>
          </div>
        </div>
      ) : (
        <>
          <div className="xw-inbox__tabs" role="tablist" aria-label="工单类型">
            {visibleTabs.map((item) => (
              <button
                type="button"
                role="tab"
                key={item.key}
                aria-selected={tab === item.key}
                className={`xw-inbox__tab${tab === item.key ? ' is-active' : ''}`}
                onClick={() => setTab(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === 'submissions' && <SubmissionsPanel onUnauthorized={onUnauthorized} />}
          {tab === 'feedback' && <FeedbackPanel onUnauthorized={onUnauthorized} />}
          {tab === 'staff' && canManageStaff && (
            <StaffPanel user={user} onUnauthorized={onUnauthorized} />
          )}
        </>
      )}
    </div>
  );
}
