// 投稿成功面板：展示确认提示、处理进度链接与再次提交入口
import type { BootstrapPayload } from '../../../shared/site-config';

interface SubmitDoneProps {
  boot: BootstrapPayload;
  statusUrl: string | null;
  onReset: () => void;
}

export function SubmitDone({ boot, statusUrl, onReset }: SubmitDoneProps) {
  const labels = boot.labels;

  return (
    <div className="site-done" role="status">
      <p className="site-done__title">{labels.submitSuccessTitle ?? '已收到，谢谢！'}</p>
      <p className="site-done__desc">
        {labels.submitSuccessDescription ??
          '确认邮件已发送，请点击邮件中的链接完成确认；确认后投稿才会进入人工审核。'}
      </p>
      <div className="site-form__actions">
        {statusUrl && (
          <a className="site-btn site-btn--primary" href={statusUrl}>
            {labels.submitViewStatus ?? '查看处理进度'}
          </a>
        )}
        <button type="button" className="site-btn site-btn--ghost" onClick={onReset}>
          {labels.submitAgain ?? '再提交一条'}
        </button>
        <a className="site-btn site-btn--text" href="/">
          {labels.backHome ?? '回到首页'} →
        </a>
      </div>
    </div>
  );
}
