import { useEffect, useRef } from 'react';
import type { PracticeMode } from './practice-types';

interface Options {
  startedAt: number | null;
  finishedAt: number | null;
  articleMode: boolean;
  onModeChange: (mode: PracticeMode) => void;
  onStartRound: () => void;
  onStartArticle: () => void;
  onReset: () => void;
}

/**
 * 练习页键盘快捷键：未开始时 1/2/3 切换模式、Enter 开始；
 * 进行中 Esc 重置；结束后 Enter 重新开始。
 */
export function usePracticeShortcuts({
  startedAt,
  finishedAt,
  articleMode,
  onModeChange,
  onStartRound,
  onStartArticle,
  onReset,
}: Options) {
  const handlersRef = useRef({ onModeChange, onStartRound, onStartArticle, onReset });
  handlersRef.current = { onModeChange, onStartRound, onStartArticle, onReset };

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const tag = target?.tagName ?? '';
      const typing =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target?.isContentEditable === true;

      if (event.key === 'Escape') {
        if (startedAt !== null) {
          event.preventDefault();
          handlersRef.current.onReset();
        }
        return;
      }

      // 输入框内只响应 Esc，其余按键交给输入逻辑
      if (typing) return;

      const start = () => {
        if (articleMode) handlersRef.current.onStartArticle();
        else handlersRef.current.onStartRound();
      };

      if (startedAt === null) {
        if (event.key === '1') {
          event.preventDefault();
          handlersRef.current.onModeChange('root');
        } else if (event.key === '2') {
          event.preventDefault();
          handlersRef.current.onModeChange('char');
        } else if (event.key === '3') {
          event.preventDefault();
          handlersRef.current.onModeChange('text');
        } else if (event.key === 'Enter' && tag !== 'BUTTON') {
          event.preventDefault();
          start();
        }
        return;
      }

      if (finishedAt !== null && event.key === 'Enter' && tag !== 'BUTTON') {
        event.preventDefault();
        start();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startedAt, finishedAt, articleMode]);
}
