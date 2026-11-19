import { useEffect, useState } from 'react';
import type { BootstrapPayload, ContentPayload } from '../../shared/site-config';
import { ErrorState, PageSkeleton } from '../components/Bits';
import { FeedbackForm } from '../components/FeedbackForm';
import { formatDate, versionLabel } from '../lib/format';
import { renderMarkdown, stripDuplicateTitle } from '../lib/markdown';
import { useSiteResource } from '../lib/use-site-resource';
import '../styles/article.css';
import '../styles/forms.css';

export interface ContentPageProps {
  boot: BootstrapPayload;
  type: string;
  slug: string;
  version: string;
}

export function ContentPage({ boot, type, slug, version }: ContentPageProps) {
  const { data, error, loading, reload } = useSiteResource<ContentPayload>({
    url: `/api/site/content/${encodeURIComponent(type)}/${encodeURIComponent(slug)}?version=${encodeURIComponent(version)}`,
    ttlMs: 60_000,
    fallback: boot.labels.errorTitle ?? '加载失败',
  });
  const [html, setHtml] = useState('');

  // 正文渲染放在数据到位后执行，换条目/重试时会取消上一次渲染，避免旧内容覆盖新内容
  useEffect(() => {
    setHtml(
      data ? renderMarkdown(stripDuplicateTitle(data.item.body_md, data.item.title)) : '',
    );
  }, [data]);

  // 预渲染已写入条目标题，数据到位后保持一致；离开内容页时由 App 恢复站点标题
  useEffect(() => {
    if (!data) return;
    document.title = `${data.item.title} · ${boot.brand.name}`;
  }, [data, boot.brand.name]);

  const collectionHref = boot.nav.find((item) => item.collection === type)?.href ?? '/';
  const itemVersionLabel = data ? versionLabel(data.item.version, boot.versions, boot.labels) : '';
  const selectedVersionLabel = versionLabel(version, boot.versions, boot.labels);
  // 条目只在部分码表版本下存在时，接口会回退到原版本，这里明确告知当前版本没有对应内容
  const versionMismatch =
    !!data && data.item.version !== 'all' && data.item.version !== version;
  const sourceUrl = typeof data?.item.meta?.source_url === 'string' ? data.item.meta.source_url : '';

  if (loading && !data) return <PageSkeleton rows={5} />;

  if (error && !data) {
    return (
      <ErrorState
        title={boot.labels.errorTitle}
        message={error}
        retryLabel={boot.labels.retry}
        onRetry={reload}
      />
    );
  }

  if (!data) return null;

  return (
    <article className="site-article">
      <header className="site-article__head">
        <a className="site-back" href={collectionHref}>
          <span aria-hidden="true">←</span>
          {data.chrome.backLabel}
        </a>

        <p className="site-eyebrow">{data.chrome.typeLabel}</p>
        <h1 className="site-article__title">{data.item.title}</h1>
        {data.item.summary && <p className="site-article__lead">{data.item.summary}</p>}

        <div className="site-article__meta">
          {itemVersionLabel && (
            <span className="site-article__meta-item">
              {data.chrome.versionLabel}
              <strong>{itemVersionLabel}</strong>
            </span>
          )}
          {data.item.published_at && (
            <span className="site-article__meta-item">
              {data.chrome.updatedLabel}
              <strong>{formatDate(data.item.published_at)}</strong>
            </span>
          )}
          {sourceUrl && (
            <a className="site-article__source" href={sourceUrl} target="_blank" rel="noreferrer">
              {data.chrome.sourceLabel}
              <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>

        {versionMismatch && itemVersionLabel && (
          <p className="site-article__notice">
            <span className="site-article__notice-tag">提示</span>
            {selectedVersionLabel}下暂无这条内容，已按{itemVersionLabel}展示。
          </p>
        )}
      </header>

      <div className="site-prose" dangerouslySetInnerHTML={{ __html: html }} />

      <FeedbackForm
        pageUrl={window.location.pathname}
        version={data.item.version}
        labels={boot.labels}
      />

      <footer className="site-article__foot">
        <a className="site-back" href={collectionHref}>
          <span aria-hidden="true">←</span>
          {data.chrome.backLabel}
        </a>
      </footer>
    </article>
  );
}
