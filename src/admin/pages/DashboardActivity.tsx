import { Icon } from '../components/icons';
import type { AdminUser } from '../types';
import type { DashboardActivityItem } from './dashboard-types';
import { createNavigateHandler, formatRelative } from './dashboard-utils';

interface DashboardActivityProps {
  user: AdminUser;
  items: DashboardActivityItem[];
  onNavigate?: (href: string) => void;
}

/** 仪表盘最近动态面板 */
export function DashboardActivity({ user, items, onNavigate }: DashboardActivityProps) {
  const go = createNavigateHandler(onNavigate);

  return (
    <section className="xw-panel" aria-labelledby="xw-dash-activity-title">
      <div className="xw-panel__head">
        <h2 className="xw-panel__title" id="xw-dash-activity-title">
          最近动态
        </h2>
        {user.role === 'admin' && (
          <a
            className="xw-panel__link"
            href="/admin/audit"
            onClick={(event) => go(event, '/admin/audit')}
          >
            审计日志
          </a>
        )}
      </div>

      {items.length > 0 ? (
        <ul className="xw-feed">
          {items.map((item) => (
            <li className="xw-feed__item" key={item.id}>
              <span className="xw-feed__dot" aria-hidden="true" />
              <p className="xw-feed__text">
                <strong>{item.actor}</strong> {item.action}{' '}
                <span className="xw-feed__target">{item.target}</span>
              </p>
              <span className="xw-feed__time">{formatRelative(item.createdAt)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="xw-empty">
          <Icon name="grid" size={22} />
          <p>暂无操作记录</p>
        </div>
      )}
    </section>
  );
}
