import type { SiteConfig } from '../../shared/site-config';
import { LookupPage, StatusPanel } from '../components/Bits';
import { formatTime } from '../lib/format';
import { searchParam } from '../lib/router';
import { useSiteResource } from '../lib/use-site-resource';
import { submissionKindLabel } from './submit/submit-types';
import '../styles/forms.css';

interface SubmissionStatus {
  id: string;
  kind: string;
  title: string;
  status: string;
  reject_reason: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_FALLBACKS: Record<string, string> = {
  new: '等待邮箱确认',
  confirmed: '已确认，等待处理',
  claimed: '正在处理',
  accepted: '已采纳',
  rejected: '未采纳',
  spam: '已忽略',
};

const STATUS_TONE: Record<string, 'done' | 'warn' | 'muted'> = {
  confirmed: 'done',
  claimed: 'done',
  accepted: 'done',
  rejected: 'warn',
  spam: 'muted',
};

export function SubmitStatusPage({ labels }: { labels: SiteConfig['labels'] }) {
  const token = searchParam('token');
  const { data, error, loading, reload } = useSiteResource<{ submission: SubmissionStatus }>({
    url: `/api/site/submit/status?token=${encodeURIComponent(token)}`,
    ttlMs: 0,
    fallback: labels.submitStatusFailed ?? '查询失败，请稍后再试',
  });
  const item = data?.submission ?? null;

  const statusLabel = item
    ? labels[`submitStatus_${item.status}`] ?? STATUS_FALLBACKS[item.status] ?? item.status
    : '';

  return (
    <LookupPage
      eyebrow={labels.submitStatusEyebrow ?? 'STATUS'}
      title={labels.submitStatusTitle ?? '投稿进度'}
      description={
        labels.submitStatusDescription ??
        '凭邮件里的查询链接查看处理状态，链接 30 天内有效，请勿转发。'
      }
      loading={loading}
      error={error}
      errorTitle={labels.submitStatusErrorTitle ?? '无法查询'}
      onRetry={reload}
      skeletonRows={3}
    >
      {item && (
        <StatusPanel
          title={item.title}
          badge={statusLabel}
          tone={STATUS_TONE[item.status] ?? 'muted'}
          rows={[
            {
              label: labels.submitStatusType ?? '类型',
              value: submissionKindLabel(labels, item.kind),
            },
            {
              label: labels.submitStatusSubmittedAt ?? '提交时间',
              value: formatTime(item.created_at),
            },
            {
              label: labels.submitStatusConfirmedAt ?? '确认时间',
              value: formatTime(item.confirmed_at) || '—',
            },
            {
              label: labels.updatedLabel ?? '更新于',
              value: formatTime(item.updated_at),
            },
          ]}
          note={
            item.status === 'rejected' && item.reject_reason
              ? `${labels.submitStatusRejectReason ?? '未采纳原因'}：${item.reject_reason}`
              : undefined
          }
          actions={
            <>
              <a className="site-btn site-btn--text" href="/submit">
                {labels.submitAgain ?? '再提交一条'} →
              </a>
              <a className="site-btn site-btn--text" href="/">
                {labels.backHome ?? '回到首页'} →
              </a>
            </>
          }
        />
      )}
    </LookupPage>
  );
}
