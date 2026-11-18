import { useEffect, useMemo, useRef, useState } from 'react';
import type { SiteConfig } from '../../../shared/site-config';
import { PageHeader, PageState, type PageStatus } from '../../components/Bits';
import '../../styles/practice.css';
import { ArticleSession } from './ArticleSession';
import { PracticeResult } from './PracticeResult';
import { PracticeSession } from './PracticeSession';
import { PracticeSetup } from './PracticeSetup';
import { PracticeSidebar } from './PracticeSidebar';
import { PracticeStats } from './PracticeStats';
import { usePracticeData } from './use-practice-data';
import { useArticleProgress } from './use-article-progress';
import { usePracticeSession } from './use-practice-session';
import { usePracticeShortcuts } from './use-practice-shortcuts';
import { shuffle, splitRoots } from './practice-utils';
import type { PracticeMode, Question, QuestionCount } from './practice-types';

export interface PracticePageProps {
  labels: SiteConfig['labels'];
  version: string;
  versionLabel: string;
}

export function PracticePage({ labels, version, versionLabel }: PracticePageProps) {
  const [mode, setMode] = useState<PracticeMode>('root');
  const [count, setCount] = useState<QuestionCount>(20);
  const [round, setRound] = useState(0);

  const [genre, setGenre] = useState<string>('all');
  const [textQuery, setTextQuery] = useState('');
  const [textId, setTextId] = useState('');
  const [showCodes, setShowCodes] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const articleInputRef = useRef<HTMLInputElement>(null);

  const { keymap, textList, article: articleResource } = usePracticeData({
    labels,
    version,
    mode,
    textId,
  });
  const { setData: setArticleData } = articleResource;

  const data = keymap.data;
  const texts = textList.data?.items ?? null;
  const textGenres = textList.data?.genres ?? [];
  const article = articleResource.data?.item ?? null;

  // 切换篇目时先清空旧正文，避免读到上一篇文章的内容
  useEffect(() => {
    setArticleData(null);
  }, [textId, setArticleData]);

  const pool = useMemo<Question[]>(() => {
    if (!data) return [];
    if (mode === 'root') {
      return data.roots.flatMap((row) =>
        splitRoots(row.roots).map((root) => ({
          id: `${row.key}-${root}`,
          prompt: root,
          answer: row.key.toLowerCase(),
          hint: row.mnemonic,
        })),
      );
    }
    return data.examples.map((item) => ({
      id: item.char,
      prompt: item.char,
      answer: item.code.toLowerCase(),
      hint: item.roots,
    }));
  }, [data, mode]);

  const questions = useMemo(
    () => shuffle(pool).slice(0, count),
    // round 用于开始新一轮时重新洗牌
    [pool, count, round],
  );

  const {
    index,
    input,
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
  } = usePracticeSession({
    mode,
    count,
    questions,
    onShuffle: () => setRound((current) => current + 1),
    canStartArticle:
      Boolean(article) && !articleResource.loading && Boolean(article?.body.trim()),
    inputRef,
    articleInputRef,
  });

  const visibleTexts = useMemo(() => {
    const list = texts ?? [];
    const keyword = textQuery.trim();
    return list.filter((item) => {
      if (genre !== 'all' && item.genre !== genre) return false;
      if (!keyword) return true;
      return `${item.title}${item.author}${item.dynasty}`.includes(keyword);
    });
  }, [texts, genre, textQuery]);

  // 篇目分类全部由后台「分类管理」维护
  const genreOptions = useMemo(
    () => [
      { value: 'all', label: '全部' },
      ...textGenres.map((item) => ({
        value: item.slug,
        label: item.label,
      })),
    ],
    [textGenres],
  );

  const { targetChars, typedChars, articleCorrect, articleLines, codeMap, articleSpeed } =
    useArticleProgress({ article, articleInput, data, elapsedSeconds });

  const shownAccuracy = articleMode
    ? typedChars.length > 0
      ? Math.round((articleCorrect / typedChars.length) * 100)
      : 100
    : accuracy;
  const progressValue = articleMode ? typedChars.length : completed;
  const progressTotal = articleMode ? targetChars.length : questions.length;
  const shownSpeed = articleMode ? articleSpeed : speed;

  useEffect(() => {
    if (!articleMode || startedAt === null || finishedAt !== null) return;
    if (targetChars.length > 0 && typedChars.length >= targetChars.length) {
      setFinishedAt(Date.now());
    }
  }, [articleMode, startedAt, finishedAt, typedChars.length, targetChars.length, setFinishedAt]);

  usePracticeShortcuts({
    startedAt,
    finishedAt,
    articleMode,
    onModeChange: setMode,
    onStartRound: startRound,
    onStartArticle: startArticle,
    onReset: resetSession,
  });

  const stats = (
    <PracticeStats
      labels={labels}
      articleMode={articleMode}
      progressValue={progressValue}
      progressTotal={progressTotal}
      accuracy={shownAccuracy}
      elapsedSeconds={elapsedSeconds}
      speed={shownSpeed}
    />
  );

  // 切换版本时页面会整体重挂载，这里只关心本次加载是否成功
  const status: PageStatus = keymap.error
    ? 'error'
    : !data
      ? 'loading'
      : pool.length === 0
        ? 'empty'
        : 'ready';

  return (
    <div className="site-page site-practice">
      <PageHeader
        eyebrow={labels.practiceEyebrow ?? 'PRACTICE'}
        title={labels.practiceTitle ?? '在线打字'}
        description={
          labels.practiceDescription ??
          '按当前码表版本练习：先认字根键位，再练单字编码，也可以跟打古文，输满自动判定并记录正确率与速度。'
        }
        count={data ? `${data.counts.roots} 键 · ${data.counts.examples} 个例字` : ''}
        versionLabel={versionLabel}
      />

      <PageState
        status={status}
        errorTitle={labels.errorTitle ?? '加载失败'}
        errorMessage={keymap.error ?? undefined}
        retryLabel={labels.retry ?? '重试'}
        onRetry={keymap.reload}
        emptyTitle={labels.practiceEmptyTitle ?? '当前版本还没有可练习的数据'}
        emptyDescription={
          labels.practiceEmptyDescription ?? '可以先切换码表版本，或稍后再来练习。'
        }
      />

      {status === 'ready' && (
        <div className="site-practice__layout">
          <section className="site-practice__main">
            {startedAt === null && (
              <PracticeSetup
                labels={labels}
                mode={mode}
                onModeChange={setMode}
                articleMode={articleMode}
                count={count}
                onCountChange={setCount}
                genreOptions={genreOptions}
                genre={genre}
                onGenreChange={setGenre}
                textQuery={textQuery}
                onTextQueryChange={setTextQuery}
                textListLoading={textList.loading}
                textListError={textList.error}
                onRetryTextList={textList.reload}
                visibleTexts={visibleTexts}
                textId={textId}
                onTextIdChange={setTextId}
                articleLoading={articleResource.loading}
                articleError={articleResource.error}
                onRetryArticle={articleResource.reload}
                article={article}
                onStart={articleMode ? startArticle : startRound}
              />
            )}

            {running && !articleMode && question && (
              <PracticeSession
                labels={labels}
                question={question}
                mode={mode}
                index={index}
                total={questions.length}
                input={input}
                feedback={feedback}
                lastAnswer={lastAnswer}
                inputRef={inputRef}
                onInputChange={handleInputChange}
                stats={stats}
              />
            )}

            {running && articleMode && article && (
              <ArticleSession
                labels={labels}
                article={article}
                articleLines={articleLines}
                targetChars={targetChars}
                typedChars={typedChars}
                showCodes={showCodes}
                onShowCodesChange={setShowCodes}
                codeMap={codeMap}
                articleInput={articleInput}
                onArticleInputChange={setArticleInput}
                articleInputRef={articleInputRef}
                stats={stats}
              />
            )}

            {finished && (
              <PracticeResult
                labels={labels}
                articleMode={articleMode}
                accuracy={accuracy}
                shownAccuracy={shownAccuracy}
                articleSpeed={articleSpeed}
                speed={speed}
                elapsedSeconds={elapsedSeconds}
                onRestart={articleMode ? startArticle : startRound}
                onReset={resetSession}
                stats={stats}
              />
            )}
          </section>

          <PracticeSidebar labels={labels} articleMode={articleMode} />
        </div>
      )}
    </div>
  );
}
