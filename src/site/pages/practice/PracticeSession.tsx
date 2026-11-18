import type { ChangeEvent, ReactNode, RefObject } from 'react';
import type { SiteConfig } from '../../../shared/site-config';
import { fill } from './practice-utils';
import type { PracticeMode, Question } from './practice-types';

interface PracticeSessionProps {
  labels: SiteConfig['labels'];
  question: Question;
  mode: PracticeMode;
  index: number;
  total: number;
  input: string;
  feedback: 'correct' | 'wrong' | null;
  lastAnswer: string;
  inputRef: RefObject<HTMLInputElement>;
  onInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  stats: ReactNode;
}

export function PracticeSession({
  labels,
  question,
  mode,
  index,
  total,
  input,
  feedback,
  lastAnswer,
  inputRef,
  onInputChange,
  stats,
}: PracticeSessionProps) {
  return (
    <div className="site-practice__session">
      <div className="site-practice__progress">
        <span>
          {fill(labels.practiceProgress ?? '第 {index} / {total} 题', {
            index: index + 1,
            total,
          })}
        </span>
        <div className="site-practice__bar" aria-hidden="true">
          <span
            className="site-practice__bar-fill"
            style={{ width: `${Math.round((index / total) * 100)}%` }}
          />
        </div>
      </div>

      <div className={`site-practice__prompt${feedback ? ` is-${feedback}` : ''}`}>
        <span className="site-practice__prompt-label">
          {mode === 'root'
            ? labels.practiceRootLabel ?? '这个字根在哪个键？'
            : labels.practiceCharLabel ?? '打出这个字的编码'}
        </span>
        <strong className="site-practice__prompt-text">{question.prompt}</strong>
        {question.hint && <span className="site-practice__hint">{question.hint}</span>}
      </div>

      <div className="site-practice__slots" aria-hidden="true">
        {Array.from({ length: question.answer.length }).map((_, slot) => (
          <span className={`site-practice__slot${input[slot] ? ' is-filled' : ''}`} key={slot}>
            {input[slot] ?? ''}
          </span>
        ))}
      </div>

      <input
        ref={inputRef}
        className="site-practice__input"
        type="text"
        value={input}
        disabled={feedback !== null}
        maxLength={question.answer.length}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label={labels.practiceInputPlaceholder ?? '输入五笔编码'}
        placeholder={labels.practiceInputPlaceholder ?? '直接输入编码，输满自动判定'}
        onChange={onInputChange}
      />

      <p
        className={`site-practice__feedback${feedback ? ` is-${feedback}` : ''}`}
        aria-live="polite"
      >
        {feedback === 'correct' && (labels.practiceCorrect ?? '正确')}
        {feedback === 'wrong' &&
          fill(labels.practiceWrong ?? '正确编码：{answer}', {
            answer: lastAnswer.toUpperCase(),
          })}
      </p>

      {stats}

      <p className="site-practice__shortcut site-practice__shortcut--center">
        <kbd>Esc</kbd> 结束本轮
      </p>
    </div>
  );
}
