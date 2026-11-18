import { Icon } from '../components/icons';
import { versionLabel } from '../lib/versions';
import type { DashboardQueueItem } from './dashboard-types';
import { TYPE_LABELS, createNavigateHandler, formatRelative } from './dashboard-utils';

interface DashboardQueueProps {
  items: DashboardQueueItem[];
  onNavigate?: (href: string) => void;
}

/** 仪表盘待审核队列面板 */
export function DashboardQueue({ items, onNavigate }: DashboardQueueProps) {
  const go = createNavigateHandler(onNavigate);

  return (
    <section className="xw-panel" aria-labelledby="xw-dash-queue-title">
      <div className="xw-panel__head">
        <h2 className="xw-panel__title" id="xw-dash-queue-title">
          待审核队列
          {items.length > 0 && <span className="xw-panel__count">{items.length}</span>}
        </h2>
        {items.length > 0 && (
          <a
            className="xw-panel__link"
            href="/admin/review"
            onClick={(event) => go(event, '/admin/review')}
          >
            查看全部
          </a>
        )}
      </div>

      {items.length > 0 ? (
        <ul className="xw-queue">
          {items.map((item) => (
            <li className="xw-queue__item" key={item.id}>
              <div className="xw-queue__main">
                <div className="xw-queue__title-row">
                  <span className="xw-tag">{TYPE_LABELS[item.type]}</span>
                  {item.version && (
                    <span className="xw-queue__version">{versionLabel(item.version)}</span>
                  )}
                </div>
                <p className="xw-queue__title">{item.title}</p>
                <p className="xw-queue__meta">
                  {item.submitter ?? '站内编辑'} · {formatRelative(item.updatedAt)}
                </p>
              </div>
              <a
                className="xw-btn xw-btn--ghost xw-btn--sm"
                href={item.href ?? '/admin/review'}
                onClick={(event) => go(event, item.href ?? '/admin/review')}
              >
                去审核
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <div className="xw-empty">
          <Icon name="checkSquare" size={22} />
          <p>审核队列已清空</p>
        </div>
      )}
    </section>
  );
}
