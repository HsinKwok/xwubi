import type { ReactNode, RefObject } from 'react';
import type { PracticeTextDetail, SiteConfig } from '../../../shared/site-config';
import { fill } from './practice-utils';
import type { ArticleChar } from './practice-types';

interface ArticleSessionProps {
  labels: SiteConfig['labels'];
  article: PracticeTextDetail;
  articleLines: ArticleChar[][];
  targetChars: string[];
  typedChars: string[];
  showCodes: boolean;
  onShowCodesChange: (value: boolean) => void;
  codeMap: Map<string, string>;
  articleInput: string;
  onArticleInputChange: (value: string) => void;
  articleInputRef: RefObject<HTMLInputElement>;
  stats: ReactNode;
}

export function ArticleSession({
  labels,
  article,
  articleLines,
  targetChars,
  typedChars,
  showCodes,
  onShowCodesChange,
  codeMap,
  articleInput,
  onArticleInputChange,
  articleInputRef,
  stats,
}: ArticleSessionProps) {
  return (
    <div className="site-practice__session site-practice__session--text">
      <div className="site-practice__article-head">
        <div>
          <h2 className="site-practice__article-title">{article.title}</h2>
          <p className="site-practice__article-meta">
            {[article.dynasty, article.author || '佚名', `${article.char_count} 字`]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <label className="site-practice__code-toggle">
          <input
            type="checkbox"
            checked={showCodes}
            onChange={(event) => onShowCodesChange(event.target.checked)}
          />
          {labels.practiceTextCodeToggle ?? '编码提示'}
        </label>
      </div>

      <div className="site-practice__progress">
        <span>
          {fill(labels.practiceTextProgress ?? '已打 {done} / {total} 字', {
            done: typedChars.length,
            total: targetChars.length,
          })}
        </span>
        <div className="site-practice__bar" aria-hidden="true">
          <span
            className="site-practice__bar-fill"
            style={{
              width: `${
                targetChars.length > 0
                  ? Math.round((typedChars.length / targetChars.length) * 100)
                  : 0
              }%`,
            }}
          />
        </div>
      </div>

      <div className="site-practice__article" aria-label="原文">
        {articleLines.map((line, lineIndex) => (
          <p className="site-practice__article-line" key={lineIndex}>
            {line.map((item, charIndex) => {
              let status = '';
              if (item.index !== null) {
                if (item.index < typedChars.length) {
                  status = typedChars[item.index] === item.char ? ' is-ok' : ' is-bad';
                } else if (item.index === typedChars.length) {
                  status = ' is-current';
                }
              }
              const code =
                showCodes && item.index !== null ? codeMap.get(item.char) : undefined;
              return (
                <span className={`site-practice__char${status}`} key={charIndex}>
                  {item.char}
                  {code && <em className="site-practice__char-code">{code}</em>}
                </span>
              );
            })}
          </p>
        ))}
      </div>

      <input
        ref={articleInputRef}
        className="site-practice__article-input"
        type="text"
        value={articleInput}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label={labels.practiceTextInput ?? '跟打输入'}
        placeholder={labels.practiceTextPlaceholder ?? '在这里输入原文，标点可以跳过'}
        onChange={(event) => onArticleInputChange(event.target.value)}
      />

      {stats}

      <p className="site-practice__shortcut site-practice__shortcut--center">
        <kbd>Esc</kbd> 结束本轮
      </p>
    </div>
  );
}
