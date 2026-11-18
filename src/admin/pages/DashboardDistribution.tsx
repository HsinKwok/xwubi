import { Icon } from '../components/icons';
import type { DashboardDistributionItem } from './dashboard-types';
import { createNavigateHandler } from './dashboard-utils';

interface DashboardDistributionProps {
  items: DashboardDistributionItem[];
  onNavigate?: (href: string) => void;
}

/** 仪表盘内容分布面板：按类型展示占比条 */
export function DashboardDistribution({ items, onNavigate }: DashboardDistributionProps) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  const go = createNavigateHandler(onNavigate);

  return (
    <section className="xw-panel" aria-labelledby="xw-dash-dist-title">
      <div className="xw-panel__head">
        <h2 className="xw-panel__title" id="xw-dash-dist-title">
          内容分布
        </h2>
        <a
          className="xw-panel__link"
          href="/admin/content"
          onClick={(event) => go(event, '/admin/content')}
        >
          内容管理
        </a>
      </div>

      <div className="xw-panel__body">
        {items.length > 0 ? (
          <ul className="xw-bars">
            {items.map((item) => {
              const percent = total > 0 ? (item.count / total) * 100 : 0;
              return (
                <li className="xw-bars__row" key={item.label}>
                  <div className="xw-bars__head">
                    <span>{item.label}</span>
                    <span className="xw-bars__count">{item.count}</span>
                  </div>
                  <div
                    className="xw-bars__track"
                    role="progressbar"
                    aria-label={item.label}
                    aria-valuenow={item.count}
                    aria-valuemin={0}
                    aria-valuemax={total}
                  >
                    <span
                      className="xw-bars__fill"
                      style={{ width: `${total > 0 ? Math.max(percent, 2) : 0}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="xw-empty">
            <Icon name="file" size={22} />
            <p>暂无内容数据</p>
          </div>
        )}
      </div>
    </section>
  );
}
