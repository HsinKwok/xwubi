import type {
  PracticeTextDetail,
  PracticeTextSummary,
  SiteConfig,
} from '../../../shared/site-config';
import { fill } from './practice-utils';
import { QUESTION_COUNTS, type PracticeMode, type QuestionCount } from './practice-types';

interface PracticeSetupProps {
  labels: SiteConfig['labels'];
  mode: PracticeMode;
  onModeChange: (mode: PracticeMode) => void;
  articleMode: boolean;
  count: QuestionCount;
  onCountChange: (count: QuestionCount) => void;
  genreOptions: Array<{ value: string; label: string }>;
  genre: string;
  onGenreChange: (value: string) => void;
  textQuery: string;
  onTextQueryChange: (value: string) => void;
  textListLoading: boolean;
  textListError: string | null;
  onRetryTextList: () => void;
  visibleTexts: PracticeTextSummary[];
  textId: string;
  onTextIdChange: (id: string) => void;
  articleLoading: boolean;
  articleError: string | null;
  onRetryArticle: () => void;
  article: PracticeTextDetail | null;
  onStart: () => void;
}

export function PracticeSetup({
  labels,
  mode,
  onModeChange,
  articleMode,
  count,
  onCountChange,
  genreOptions,
  genre,
  onGenreChange,
  textQuery,
  onTextQueryChange,
  textListLoading,
  textListError,
  onRetryTextList,
  visibleTexts,
  textId,
  onTextIdChange,
  articleLoading,
  articleError,
  onRetryArticle,
  article,
  onStart,
}: PracticeSetupProps) {
  return (
    <div className="site-practice__setup">
      <div className="site-practice__field">
        <span className="site-practice__label">{labels.practiceModeLabel ?? '练习模式'}</span>
        <div className="site-practice__options site-practice__options--modes">
          <button
            type="button"
            className={`site-practice__option${mode === 'root' ? ' is-active' : ''}`}
            aria-pressed={mode === 'root'}
            onClick={() => onModeChange('root')}
          >
            <strong>{labels.practiceModeRoot ?? '字根找键位'}</strong>
            <span>看到字根，按下它所在的键。</span>
          </button>
          <button
            type="button"
            className={`site-practice__option${mode === 'char' ? ' is-active' : ''}`}
            aria-pressed={mode === 'char'}
            onClick={() => onModeChange('char')}
          >
            <strong>{labels.practiceModeChar ?? '单字打编码'}</strong>
            <span>看到汉字，输入完整五笔编码。</span>
          </button>
          <button
            type="button"
            className={`site-practice__option${mode === 'text' ? ' is-active' : ''}`}
            aria-pressed={mode === 'text'}
            onClick={() => onModeChange('text')}
          >
            <strong>{labels.practiceModeText ?? '文章跟打'}</strong>
            <span>照着古文原文打字，逐字判定对错。</span>
          </button>
        </div>
      </div>

      {!articleMode && (
        <div className="site-practice__field">
          <span className="site-practice__label">{labels.practiceCountLabel ?? '本轮题量'}</span>
          <div className="site-practice__options site-practice__options--inline">
            {QUESTION_COUNTS.map((size) => (
              <button
                key={size}
                type="button"
                className={`site-practice__chip${count === size ? ' is-active' : ''}`}
                aria-pressed={count === size}
                onClick={() => onCountChange(size)}
              >
                {size} 题
              </button>
            ))}
          </div>
        </div>
      )}

      {articleMode && (
        <>
          <div className="site-practice__field">
            <span className="site-practice__label">
              {labels.practiceTextGenreLabel ?? '篇目分类'}
            </span>
            <div className="site-practice__options site-practice__options--inline">
              {genreOptions.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={`site-practice__chip${genre === item.value ? ' is-active' : ''}`}
                  aria-pressed={genre === item.value}
                  onClick={() => onGenreChange(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="site-practice__field">
            <span className="site-practice__label">
              {labels.practiceTextPickLabel ?? '选择篇目'}
            </span>
            <input
              className="site-practice__search"
              type="search"
              value={textQuery}
              placeholder={labels.practiceTextSearchPlaceholder ?? '搜索篇名、作者或朝代'}
              onChange={(event) => onTextQueryChange(event.target.value)}
            />

            {textListLoading && <p className="site-practice__picker-note">篇目加载中…</p>}

            {textListError && !textListLoading && (
              <p className="site-practice__picker-note is-error">
                {textListError}
                <button
                  type="button"
                  className="site-practice__picker-retry"
                  onClick={onRetryTextList}
                >
                  {labels.retry ?? '重试'}
                </button>
              </p>
            )}

            {!textListLoading && !textListError && (
              <div
                className="site-practice__text-list"
                role="listbox"
                aria-label={labels.practiceTextPickLabel ?? '选择篇目'}
              >
                {visibleTexts.length === 0 && (
                  <p className="site-practice__picker-note">
                    {labels.practiceTextEmpty ?? '没有匹配的篇目。'}
                  </p>
                )}
                {visibleTexts.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={textId === item.id}
                    className={`site-practice__text-item${textId === item.id ? ' is-active' : ''}`}
                    onClick={() => onTextIdChange(item.id)}
                  >
                    <span className="site-practice__text-title">{item.title}</span>
                    <span className="site-practice__text-meta">
                      {item.dynasty} · {item.author || '佚名'} · {item.char_count} 字
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {articleLoading && <p className="site-practice__picker-note">正文加载中…</p>}

          {articleError && !articleLoading && (
            <p className="site-practice__picker-note is-error">
              {articleError}
              <button
                type="button"
                className="site-practice__picker-retry"
                onClick={onRetryArticle}
              >
                {labels.retry ?? '重试'}
              </button>
            </p>
          )}

          {article && !articleLoading && (
            <p className="site-practice__text-selected">
              {fill(labels.practiceTextSelected ?? '已选《{title}》· {count} 字', {
                title: article.title,
                count: article.char_count,
              })}
            </p>
          )}
        </>
      )}

      <button
        type="button"
        className="site-btn site-btn--primary site-practice__start"
        onClick={onStart}
        disabled={articleMode && (!article || articleLoading)}
      >
        {articleMode
          ? labels.practiceTextStart ?? '开始跟打'
          : labels.practiceStart ?? '开始练习'}
        <span className="site-btn__arrow" aria-hidden="true">
          →
        </span>
      </button>

      <p className="site-practice__shortcut">
        <kbd>1</kbd> 字根找键位 · <kbd>2</kbd> 单字打编码 ·{' '}
        <kbd>3</kbd> 文章跟打 · <kbd>Enter</kbd> 开始
      </p>
    </div>
  );
}
