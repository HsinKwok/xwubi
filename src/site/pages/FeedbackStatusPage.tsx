import type { SiteConfig } from '../../shared/site-config';
import { LookupPage, StatusPanel } from '../components/Bits';
import { formatTime } from '../lib/format';
import { searchParam } from '../lib/router';
import { useSiteResource } from '../lib/use-site-resource';
import '../styles/forms.css';

interface FeedbackStatus {
  id: string;
  page_url: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const STATUS_FALLBACKS: Record<string, string> = {
  open: '已收到，等待处理',
  assigned: '正在处理',
  fixed: '已修复',
  closed: '已关闭',
  spam: '已忽略',
};

const STATUS_TONE: Record<string, 'done' | 'warn' | 'muted'> = {
  assigned: 'done',
  fixed: 'done',
  closed: 'muted',
  spam: 'muted',
};

export function FeedbackStatusPage({ labels }: { labels: SiteConfig['labels'] }) {
  const token = searchParam('token');
  const { data, error, loading, reload } = useSiteResource<{ feedback: FeedbackStatus }>({
    url: `/api/site/feedback/status?token=${encodeURIComponent(token)}`,
    ttlMs: 0,
    fallback: labels.feedbackStatusFailed ?? '查询失败，请稍后再试',
  });
  const item = data?.feedback ?? null;

  return (
    <LookupPage
      eyebrow={labels.feedbackStatusEyebrow ?? 'FEEDBACK STATUS'}
      title={labels.feedbackStatusTitle ?? '纠错进度'}
      description={
        labels.feedbackStatusDescription ??
        '凭提交后返回的查询链接查看处理状态，链接 30 天内有效，请勿转发。'
      }
      loading={loading}
      error={error}
      errorTitle={labels.feedbackStatusErrorTitle ?? '无法查询'}
      onRetry={reload}
      skeletonRows={2}
    >
      {item && (
        <StatusPanel
          title={item.page_url}
          badge={
            labels[`feedbackStatus_${item.status}`] ?? STATUS_FALLBACKS[item.status] ?? item.status
          }
          tone={STATUS_TONE[item.status] ?? 'warn'}
          rows={[
            {
              label: labels.submitStatusSubmittedAt ?? '提交时间',
              value: formatTime(item.created_at),
            },
            {
              label: labels.updatedLabel ?? '更新于',
              value: formatTime(item.updated_at),
            },
          ]}
          actions={
            <a className="site-btn site-btn--text" href="/">
              {labels.backHome ?? '回到首页'} →
            </a>
          }
        />
      )}
    </LookupPage>
  );
}
