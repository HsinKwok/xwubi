import type { ReactNode } from 'react';
import type { ActionLink } from '../../shared/site-config';

/** 站点分区通用标题：可选眉标、右侧描述或「查看更多」，描述可下移为通栏 */
export function SectionHeader({
  eyebrow,
  title,
  description,
  more,
  stacked,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  more?: ActionLink;
  stacked?: boolean;
}) {
  return (
    <>
      <header className="site-section__head">
        <div>
          {eyebrow && <p className="site-eyebrow">{eyebrow}</p>}
          <h2 className="site-section__title">{title}</h2>
        </div>
        {more ? (
          <a className="site-section__more" href={more.href}>
            {more.label}
            <span aria-hidden="true">→</span>
          </a>
        ) : stacked || !description ? null : (
          <p className="site-section__desc">{description}</p>
        )}
      </header>
      {stacked && description && (
        <p className="site-section__desc site-section__desc--wide">{description}</p>
      )}
    </>
  );
}

export function Badge({ children }: { children: ReactNode }) {
  return <span className="site-badge">{children}</span>;
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="site-empty">
      <span className="site-empty__mark" aria-hidden="true" />
      <p className="site-empty__title">{title}</p>
      {description && <p className="site-empty__desc">{description}</p>}
    </div>
  );
}

export function ErrorState({
  title,
  message,
  retryLabel = '重试',
  onRetry,
}: {
  title: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="site-error" role="alert">
      <p className="site-error__title">{title}</p>
      {message && <p className="site-error__message">{message}</p>}
      {onRetry && (
        <button type="button" className="site-btn site-btn--ghost" onClick={onRetry}>
          {retryLabel}
        </button>
      )}
    </div>
  );
}

export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="site-skeleton" aria-busy="true" aria-label="加载中">
      <span className="site-skeleton__bar site-skeleton__bar--eyebrow" />
      <span className="site-skeleton__bar site-skeleton__bar--title" />
      <span className="site-skeleton__bar site-skeleton__bar--lead" />
      <div className="site-skeleton__rows">
        {Array.from({ length: rows }).map((_, index) => (
          <span className="site-skeleton__bar site-skeleton__bar--row" key={index} />
        ))}
      </div>
    </div>
  );
}

/** 集合页、码表与练习页共用的页头：眉标 + 标题 + 描述 + 计数/版本栏 */
export function PageHeader({
  eyebrow,
  title,
  description,
  count,
  versionLabel,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  count?: string;
  versionLabel?: string;
}) {
  return (
    <header className="site-page__head">
      {eyebrow && <p className="site-eyebrow">{eyebrow}</p>}
      <h1 className="site-page__title">{title}</h1>
      {description && <p className="site-page__desc">{description}</p>}
      {(count !== undefined || versionLabel) && (
        <div className="site-page__bar">
          <span className="site-page__count">{count ?? ''}</span>
          <span className="site-page__version">{versionLabel ?? ''}</span>
        </div>
      )}
    </header>
  );
}

export type PageStatus = 'loading' | 'error' | 'empty' | 'ready';

/** 加载 / 失败 / 空 / 正常四态的单一出口，页面只负责判断当前处于哪一态 */
export function PageState({
  status,
  skeletonRows = 4,
  errorTitle,
  errorMessage,
  retryLabel,
  onRetry,
  emptyTitle,
  emptyDescription,
}: {
  status: PageStatus;
  skeletonRows?: number;
  errorTitle?: string;
  errorMessage?: string;
  retryLabel?: string;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (status === 'loading') return <PageSkeleton rows={skeletonRows} />;
  if (status === 'error') {
    return (
      <ErrorState
        title={errorTitle ?? '加载失败'}
        message={errorMessage}
        retryLabel={retryLabel}
        onRetry={onRetry}
      />
    );
  }
  if (status === 'empty') {
    return <EmptyState title={emptyTitle ?? '暂无内容'} description={emptyDescription} />;
  }
  return null;
}

/** 查询类页面外壳：眉标/标题/描述 + 加载骨架 + 失败重试，就绪后渲染内容 */
export function LookupPage({
  eyebrow,
  title,
  description,
  loading,
  error,
  errorTitle,
  retryLabel,
  onRetry,
  skeletonRows,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  loading: boolean;
  error: string | null;
  errorTitle: string;
  retryLabel?: string;
  onRetry?: () => void;
  skeletonRows?: number;
  children: ReactNode;
}) {
  return (
    <div className="site-form-page">
      <header>
        <p className="site-eyebrow">{eyebrow}</p>
        <h1 className="site-form-page__title">{title}</h1>
        {description && <p className="site-form-page__desc">{description}</p>}
      </header>

      {loading && !error && <PageSkeleton rows={skeletonRows} />}
      {error && (
        <ErrorState
          title={errorTitle}
          message={error}
          retryLabel={retryLabel}
          onRetry={onRetry}
        />
      )}
      {!loading && !error && children}
    </div>
  );
}

export interface StatusRow {
  label: string;
  value: ReactNode;
}

/** 投稿与纠错查询共用的状态卡片，具体字段与文案由页面传入 */
export function StatusPanel({
  title,
  badge,
  tone,
  rows,
  note,
  actions,
}: {
  title: ReactNode;
  badge: ReactNode;
  tone: 'done' | 'warn' | 'muted';
  rows: StatusRow[];
  note?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="site-status">
      <div className="site-status__head">
        <h2 className="site-status__title">{title}</h2>
        <span className={`site-status__badge site-status__badge--${tone}`}>{badge}</span>
      </div>

      <dl className="site-status__list">
        {rows.map((row) => (
          <div className="site-status__row" key={row.label}>
            <dt className="site-status__label">{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>

      {note && <p className="site-status__note">{note}</p>}
      {actions && <div className="site-form__actions">{actions}</div>}
    </div>
  );
}
