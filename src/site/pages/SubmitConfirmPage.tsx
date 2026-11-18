import type { SiteConfig } from '../../shared/site-config';
import { LookupPage } from '../components/Bits';
import { searchParam } from '../lib/router';
import { useSiteResource } from '../lib/use-site-resource';
import '../styles/forms.css';

interface ConfirmResponse {
  ok: boolean;
  already: boolean;
  status: string;
}

export function SubmitConfirmPage({ labels }: { labels: SiteConfig['labels'] }) {
  const token = searchParam('token');
  const { data, error, loading, reload } = useSiteResource<ConfirmResponse>({
    url: `/api/site/submit/confirm?token=${encodeURIComponent(token)}`,
    ttlMs: 0,
    fallback: labels.submitConfirmFailed ?? '确认失败，请稍后再试',
  });

  return (
    <LookupPage
      eyebrow={labels.submitConfirmEyebrow ?? 'CONFIRM'}
      title={labels.submitConfirmTitle ?? '确认投稿邮箱'}
      loading={loading}
      error={error}
      errorTitle={labels.submitConfirmErrorTitle ?? '无法确认'}
      onRetry={reload}
      skeletonRows={2}
    >
      {data && (
        <div className="site-done" role="status">
          <p className="site-done__title">{labels.submitConfirmSuccessTitle ?? '确认成功'}</p>
          <p className="site-done__desc">
            {data.already
              ? labels.submitConfirmAlready ?? '这个邮箱已经确认过了，无需重复操作。'
              : labels.submitConfirmDone ?? '邮箱已确认，投稿已经进入人工审核队列。'}
          </p>
          <div className="site-form__actions">
            <a className="site-btn site-btn--primary" href="/">
              {labels.backHome ?? '回到首页'}
            </a>
            <a className="site-btn site-btn--text" href="/submit">
              {labels.submitAgain ?? '再提交一条'} →
            </a>
          </div>
        </div>
      )}
    </LookupPage>
  );
}
