import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, MutableRefObject } from 'react';
import type { PracticeMode, Question } from './practice-types';

interface Options {
  mode: PracticeMode;
  count: number;
  questions: Question[];
  /** 开始新一轮前触发重新洗牌 */
  onShuffle: () => void;
  canStartArticle: boolean;
  inputRef: MutableRefObject<HTMLInputElement | null>;
  articleInputRef: MutableRefObject<HTMLInputElement | null>;
}

/**
 * 练习会话：答题进度、计时、对错统计与输入判定。
 * 跟打模式的正文比对交由 useArticleProgress 处理，这里只负责会话状态。
 */
export function usePracticeSession({
  mode,
  count,
  questions,
  onShuffle,
  canStartArticle,
  inputRef,
  articleInputRef,
}: Options) {
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [lastAnswer, setLastAnswer] = useState('');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [articleInput, setArticleInput] = useState('');

  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setStartedAt(null);
    setFinishedAt(null);
    setIndex(0);
    setInput('');
    setCorrect(0);
    setWrong(0);
    setFeedback(null);
    setLastAnswer('');
    setArticleInput('');
  }, [mode, count]);

  useEffect(() => {
    if (startedAt === null || finishedAt !== null) return;
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [startedAt, finishedAt]);

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    },
    [],
  );

  function resetSession() {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setStartedAt(null);
    setFinishedAt(null);
    setIndex(0);
    setInput('');
    setCorrect(0);
    setWrong(0);
    setFeedback(null);
    setLastAnswer('');
    setArticleInput('');
  }

  function startRound() {
    if (questions.length === 0) return;
    resetSession();
    onShuffle();
    const started = Date.now();
    setStartedAt(started);
    setNow(started);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  function startArticle() {
    if (!canStartArticle) return;
    resetSession();
    const started = Date.now();
    setStartedAt(started);
    setNow(started);
    window.requestAnimationFrame(() => articleInputRef.current?.focus());
  }

  function moveNext() {
    const next = index + 1;
    setIndex(next);
    setInput('');
    setFeedback(null);
    setLastAnswer('');
    if (next >= questions.length) {
      setFinishedAt(Date.now());
      return;
    }
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  function submitAnswer(value: string) {
    const question = questions[index];
    if (!question) return;

    if (value === question.answer) {
      setFeedback('correct');
      setCorrect((current) => current + 1);
      timeoutRef.current = window.setTimeout(moveNext, 240);
    } else {
      setFeedback('wrong');
      setLastAnswer(question.answer);
      setWrong((current) => current + 1);
      timeoutRef.current = window.setTimeout(moveNext, 900);
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const question = questions[index];
    if (!question || feedback !== null) return;

    const value = event.target.value
      .toLowerCase()
      .replace(/[^a-z]/g, '')
      .slice(0, question.answer.length);
    setInput(value);
    if (value.length === question.answer.length) submitAnswer(value);
  }

  const articleMode = mode === 'text';
  const running = startedAt !== null && finishedAt === null;
  const finished = startedAt !== null && finishedAt !== null;
  const question: Question | null = questions[index] ?? null;
  const completed = correct + wrong;
  const accuracy = completed > 0 ? Math.round((correct / completed) * 100) : 100;
  const elapsedSeconds =
    startedAt === null ? 0 : Math.max(0, ((finishedAt ?? now) - startedAt) / 1000);
  const speed = elapsedSeconds > 0 ? Math.round((completed / elapsedSeconds) * 60) : 0;

  return {
    index,
    input,
    correct,
    wrong,
    feedback,
    lastAnswer,
    startedAt,
    finishedAt,
    setFinishedAt,
    articleInput,
    setArticleInput,
    articleMode,
    running,
    finished,
    question,
    completed,
    accuracy,
    elapsedSeconds,
    speed,
    resetSession,
    startRound,
    startArticle,
    handleInputChange,
  };
}
