import type { SiteConfig } from '../../../shared/site-config';
import { formatDuration } from './practice-utils';

export function PracticeStats({
  labels,
  articleMode,
  progressValue,
  progressTotal,
  accuracy,
  elapsedSeconds,
  speed,
}: {
  labels: SiteConfig['labels'];
  articleMode: boolean;
  progressValue: number;
  progressTotal: number;
  accuracy: number;
  elapsedSeconds: number;
  speed: number;
}) {
  return (
    <div className="site-practice__stats">
      <div className="site-practice__stat">
        <span className="site-practice__stat-label">
          {articleMode
            ? labels.practiceTextTyped ?? '已打'
            : labels.practiceCompleted ?? '已完成'}
        </span>
        <strong className="site-practice__stat-value">
          {progressValue}
          <small> / {progressTotal}</small>
        </strong>
      </div>
      <div className="site-practice__stat">
        <span className="site-practice__stat-label">{labels.practiceAccuracy ?? '正确率'}</span>
        <strong className="site-practice__stat-value">{accuracy}%</strong>
      </div>
      <div className="site-practice__stat">
        <span className="site-practice__stat-label">{labels.practiceTime ?? '用时'}</span>
        <strong className="site-practice__stat-value">{formatDuration(elapsedSeconds)}</strong>
      </div>
      <div className="site-practice__stat">
        <span className="site-practice__stat-label">{labels.practiceSpeed ?? '速度'}</span>
        <strong className="site-practice__stat-value">
          {speed}
          <small> {articleMode ? '字/分' : '题/分'}</small>
        </strong>
      </div>
    </div>
  );
}
