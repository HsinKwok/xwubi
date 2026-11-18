import { useEffect, useRef, useState } from 'react';
import { Icon } from '../components/icons';
import { getJson, resolveAdminError } from '../lib/api';
import { Dashboard } from './Dashboard';
import type {
  DashboardActivityItem,
  DashboardDistributionItem,
  DashboardQueueItem,
  DashboardStat,
} from './Dashboard';
import type { AdminBadgeCounts, AdminUser } from '../types';

/** GET /api/admin/dashboard 的响应体 */
export interface DashboardApiPayload {
  counts?: AdminBadgeCounts;
  stats?: DashboardStat[];
  queue?: DashboardQueueItem[];
  distribution?: DashboardDistributionItem[];
  activities?: DashboardActivityItem[];
  generated_at?: string;
}

export interface DashboardPageProps {
  user: AdminUser;
  onNavigate?: (href: string) => void;
  /** 会话失效时的处理，默认跳转登录页 */
  onUnauthorized?: () => void;
  /** 覆盖默认请求，便于测试或接入其他数据源 */
  loadDashboard?: (signal: AbortSignal) => Promise<DashboardApiPayload>;
}

type DashboardLoader = (signal: AbortSignal) => Promise<DashboardApiPayload>;

interface DashboardData {
  counts?: AdminBadgeCounts;
  stats?: DashboardStat[];
  queue: DashboardQueueItem[];
  distribution: DashboardDistributionItem[];
  activities: DashboardActivityItem[];
}

function fetchDashboard(signal: AbortSignal): Promise<DashboardApiPayload> {
  return getJson<DashboardApiPayload>('/api/admin/dashboard', signal);
}

function normalize(payload: DashboardApiPayload): DashboardData {
  return {
    counts: payload.counts,
    // 空数组留给 Dashboard 走内置的 counts 兜底
    stats: payload.stats && payload.stats.length > 0 ? payload.stats : undefined,
    queue: payload.queue ?? [],
    distribution: payload.distribution ?? [],
    activities: payload.activities ?? [],
  };
}

function redirectToLogin() {
  window.location.assign('/login?next=%2Fadmin');
}

export function DashboardPage({
  user,
  onNavigate,
  onUnauthorized,
  loadDashboard,
}: DashboardPageProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  // 用 ref 持有回调，避免父组件内联函数导致重复请求
  const loaderRef = useRef<DashboardLoader>(loadDashboard ?? fetchDashboard);
  loaderRef.current = loadDashboard ?? fetchDashboard;
  const unauthorizedRef = useRef(onUnauthorized);
  unauthorizedRef.current = onUnauthorized;

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setLoading(true);
    setError(null);

    loaderRef
      .current(controller.signal)
      .then((payload) => {
        if (!active) return;
        setData(normalize(payload));
        setLoading(false);
      })
      .catch((caught: unknown) => {
        if (!active || controller.signal.aborted) return;

        const message = resolveAdminError(caught, '加载工作台数据失败', () => {
          setError('登录状态已失效，正在返回登录页…');
          setLoading(false);
          (unauthorizedRef.current ?? redirectToLogin)();
        });
        if (!message) return;
        setError(message);
        setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [reloadKey]);

  if (error) {
    return (
      <div className="xw-dash-error" role="alert">
        <span className="xw-dash-error__icon">
          <Icon name="shield" size={22} />
        </span>
        <h2>无法加载工作台</h2>
        <p>{error}</p>
        <button
          type="button"
          className="xw-btn xw-btn--primary"
          onClick={() => setReloadKey((key) => key + 1)}
        >
          重新加载
        </button>
      </div>
    );
  }

  if (loading || !data) {
    return <DashboardSkeleton />;
  }

  return (
    <Dashboard
      user={user}
      counts={data.counts}
      stats={data.stats}
      queue={data.queue}
      distribution={data.distribution}
      activities={data.activities}
      onNavigate={onNavigate}
    />
  );
}

function DashboardSkeleton() {
  return (
    <div className="xw-dash" aria-busy="true" aria-label="工作台数据加载中">
      <div className="xw-dash__intro">
        <div className="xw-dash-skeleton__copy">
          <span className="xw-skeleton xw-skeleton--eyebrow" />
          <span className="xw-skeleton xw-skeleton--heading" />
          <span className="xw-skeleton xw-skeleton--sub" />
        </div>
      </div>

      <div className="xw-dash__stats">
        {[0, 1, 2, 3].map((index) => (
          <div className="xw-stat" key={index}>
            <span className="xw-skeleton xw-skeleton--sm" />
            <span className="xw-skeleton xw-skeleton--lg" />
          </div>
        ))}
      </div>

      <div className="xw-dash__grid">
        <div className="xw-panel">
          <div className="xw-panel__head">
            <span className="xw-skeleton xw-skeleton--label" />
          </div>
          <div className="xw-panel__body">
            <div className="xw-skeleton-stack">
              {[0, 1, 2, 3].map((index) => (
                <span className="xw-skeleton xw-skeleton--row" key={index} />
              ))}
            </div>
          </div>
        </div>

        <div className="xw-dash__col">
          <div className="xw-panel">
            <div className="xw-panel__head">
              <span className="xw-skeleton xw-skeleton--label" />
            </div>
            <div className="xw-panel__body">
              <div className="xw-skeleton-stack">
                {[0, 1, 2, 3].map((index) => (
                  <span className="xw-skeleton xw-skeleton--bar" key={index} />
                ))}
              </div>
            </div>
          </div>

          <div className="xw-panel">
            <div className="xw-panel__head">
              <span className="xw-skeleton xw-skeleton--label" />
            </div>
            <div className="xw-panel__body">
              <div className="xw-skeleton-stack">
                {[0, 1, 2].map((index) => (
                  <span className="xw-skeleton xw-skeleton--row" key={index} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
