import type { ReactNode } from 'react';
import type { SiteConfig } from '../../../shared/site-config';
import { fill, formatDuration } from './practice-utils';

interface PracticeResultProps {
  labels: SiteConfig['labels'];
  articleMode: boolean;
  accuracy: number;
  shownAccuracy: number;
  articleSpeed: number;
  speed: number;
  elapsedSeconds: number;
  onRestart: () => void;
  onReset: () => void;
  stats: ReactNode;
}

export function PracticeResult({
  labels,
  articleMode,
  accuracy,
  shownAccuracy,
  articleSpeed,
  speed,
  elapsedSeconds,
  onRestart,
  onReset,
  stats,
}: PracticeResultProps) {
  return (
    <div className="site-practice__result">
      <p className="site-eyebrow">{labels.practiceDoneEyebrow ?? 'ROUND DONE'}</p>
      <h2 className="site-practice__result-title">
        {articleMode
          ? labels.practiceTextDoneTitle ?? '本篇完成'
          : labels.practiceDoneTitle ?? '本轮完成'}
      </h2>
      <p className="site-practice__result-desc">
        {articleMode
          ? fill(
              labels.practiceTextDoneDescription ??
                '正确率 {accuracy}%，用时 {time}，平均 {speed} 字/分钟。',
              {
                accuracy: shownAccuracy,
                time: formatDuration(elapsedSeconds),
                speed: articleSpeed,
              },
            )
          : fill(
              labels.practiceDoneDescription ??
                '正确率 {accuracy}%，用时 {time}，平均 {speed} 题/分钟。',
              {
                accuracy,
                time: formatDuration(elapsedSeconds),
                speed,
              },
            )}
      </p>
      {stats}
      <div className="site-practice__result-actions">
        <button type="button" className="site-btn site-btn--primary" onClick={onRestart}>
          {articleMode
            ? labels.practiceTextRestart ?? '再练一篇'
            : labels.practiceRestart ?? '再练一轮'}
        </button>
        <button type="button" className="site-btn site-btn--ghost" onClick={onReset}>
          {articleMode
            ? labels.practiceTextChange ?? '换一篇'
            : labels.practiceChangeMode ?? '调整模式'}
        </button>
      </div>
      <p className="site-practice__shortcut">
        {articleMode ? (
          <>
            <kbd>Enter</kbd> 再练一篇 · <kbd>Esc</kbd> 换一篇
          </>
        ) : (
          <>
            <kbd>Enter</kbd> 再练一轮 · <kbd>Esc</kbd> 调整模式
          </>
        )}
      </p>
    </div>
  );
}
