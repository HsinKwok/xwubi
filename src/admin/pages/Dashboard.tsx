import { Icon } from '../components/icons';
import { DashboardActivity } from './DashboardActivity';
import { DashboardDistribution } from './DashboardDistribution';
import { DashboardQueue } from './DashboardQueue';
import { createNavigateHandler, formatCount, greetingOf } from './dashboard-utils';
import type { DashboardProps, DashboardStat } from './dashboard-types';

export type {
  DashboardActivityItem,
  DashboardDistributionItem,
  DashboardProps,
  DashboardQueueItem,
  DashboardStat,
} from './dashboard-types';

export function Dashboard({
  user,
  counts,
  stats,
  queue = [],
  distribution = [],
  activities = [],
  onNavigate,
}: DashboardProps) {
  const pendingReview = counts?.review ?? 0;
  const pendingSubmissions = counts?.users ?? 0;
  const canReview = user.role === 'admin' || user.role === 'reviewer' || user.role === 'ops';
  const canHandleSubmissions = user.role === 'admin' || user.role === 'ops';

  const now = new Date();
  const dateText = now.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const resolvedStats: DashboardStat[] = stats ?? [
    {
      key: 'published',
      label: '已发布内容',
      value: 0,
      hint: '全部类型与码表版本',
      icon: 'file',
    },
    {
      key: 'review',
      label: '待审核',
      value: pendingReview,
      hint: '含投稿与内容修订',
      icon: 'checkSquare',
    },
    {
      key: 'submissions',
      label: '待处理投稿',
      value: pendingSubmissions,
      hint: '来自投稿入口',
      icon: 'users',
    },
    {
      key: 'feedback',
      label: '未处理纠错',
      value: 0,
      hint: '来自页面反馈',
      icon: 'shield',
    },
  ];

  const hasPending = pendingReview + pendingSubmissions > 0;
  const go = createNavigateHandler(onNavigate);

  return (
    <div className="xw-dash">
      <header className="xw-dash__intro">
        <div>
          <p className="xw-dash__eyebrow">{dateText}</p>
          <h1 className="xw-dash__title">
            {greetingOf(now.getHours())}，{user.name}
          </h1>
          <p className="xw-dash__subtitle">
            {hasPending
              ? `今天有 ${pendingReview} 条内容等待审核，${pendingSubmissions} 条投稿需要处理。`
              : '目前没有待处理事项，可以开始整理新的内容。'}
          </p>
        </div>

        <div className="xw-dash__actions">
          <a
            className="xw-btn xw-btn--primary"
            href="/admin/content/new"
            onClick={(event) => go(event, '/admin/content/new')}
          >
            <Icon name="file" size={16} />
            新建内容
          </a>
          {canReview && (
            <a
              className="xw-btn xw-btn--ghost"
              href="/admin/review"
              onClick={(event) => go(event, '/admin/review')}
            >
              <Icon name="checkSquare" size={16} />
              审核中心
              {pendingReview > 0 && <span className="xw-btn__count">{formatCount(pendingReview)}</span>}
            </a>
          )}
          {canHandleSubmissions && (
            <a
              className="xw-btn xw-btn--ghost"
              href="/admin/users"
              onClick={(event) => go(event, '/admin/users')}
            >
              <Icon name="users" size={16} />
              处理投稿
            </a>
          )}
        </div>
      </header>

      <section className="xw-dash__stats" aria-label="数据概览">
        {resolvedStats.map((item) => (
          <article className="xw-stat" key={item.key}>
            <div className="xw-stat__top">
              <span className="xw-stat__label">{item.label}</span>
              {item.icon && (
                <span className="xw-stat__icon">
                  <Icon name={item.icon} size={16} />
                </span>
              )}
            </div>
            <p className="xw-stat__value">{item.value}</p>
            {item.hint && <p className="xw-stat__hint">{item.hint}</p>}
          </article>
        ))}
      </section>

      <div className="xw-dash__grid">
        <DashboardQueue items={queue} onNavigate={onNavigate} />

        <div className="xw-dash__col">
          <DashboardDistribution items={distribution} onNavigate={onNavigate} />
          <DashboardActivity user={user} items={activities} onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  );
}
