import { useMemo } from 'react';
import type { PracticeTextPayload } from '../../../shared/site-config';
import type { ArticleChar, KeymapPayload } from './practice-types';
import { isCjkChar } from './practice-utils';

interface Options {
  article: PracticeTextPayload['item'] | null;
  articleInput: string;
  data: KeymapPayload | null;
  elapsedSeconds: number;
}

/**
 * 跟打模式下的正文派生数据：目标汉字、已输入汉字、正确数、
 * 分行渲染结构、编码映射与速度。
 */
export function useArticleProgress({ article, articleInput, data, elapsedSeconds }: Options) {
  const targetChars = useMemo(
    () => (article ? Array.from(article.body).filter(isCjkChar) : []),
    [article],
  );

  const typedChars = useMemo(
    () => Array.from(articleInput).filter(isCjkChar).slice(0, targetChars.length),
    [articleInput, targetChars],
  );

  const articleCorrect = useMemo(
    () =>
      typedChars.reduce(
        (total, char, position) => total + (char === targetChars[position] ? 1 : 0),
        0,
      ),
    [typedChars, targetChars],
  );

  const articleLines = useMemo<ArticleChar[][]>(() => {
    if (!article) return [];
    let cjkIndex = -1;
    return article.body.split('\n').map((line) =>
      Array.from(line).map((char) => {
        if (isCjkChar(char)) {
          cjkIndex += 1;
          return { char, index: cjkIndex };
        }
        return { char, index: null };
      }),
    );
  }, [article]);

  const codeMap = useMemo(
    () => new Map((data?.examples ?? []).map((item) => [item.char, item.code])),
    [data],
  );

  const articleSpeed =
    elapsedSeconds > 0 ? Math.round((typedChars.length / elapsedSeconds) * 60) : 0;

  return { targetChars, typedChars, articleCorrect, articleLines, codeMap, articleSpeed };
}
