import type { SiteConfig } from '../../shared/site-config';

export function NotFoundPage({ labels }: { labels: SiteConfig['labels'] }) {
  return (
    <div className="site-page site-page--notfound">
      <p className="site-eyebrow">404</p>
      <h1 className="site-page__title">{labels.notFoundTitle}</h1>
      <p className="site-page__desc">{labels.notFoundDescription}</p>
      <a className="site-btn site-btn--ghost" href="/">
        {labels.backHome}
        <span className="site-btn__arrow" aria-hidden="true">
          →
        </span>
      </a>
    </div>
  );
}
