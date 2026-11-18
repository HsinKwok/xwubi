import type {
  PracticeTextListPayload,
  PracticeTextPayload,
  SiteConfig,
} from '../../../shared/site-config';
import { useSiteResource } from '../../lib/use-site-resource';
import type { KeymapPayload, PracticeMode } from './practice-types';

interface UsePracticeDataOptions {
  labels: SiteConfig['labels'];
  version: string;
  mode: PracticeMode;
  textId: string;
}

/**
 * 练习页的三类远程数据：练习码表、篇目列表与篇目正文。
 * 篇目列表仅在进入跟打模式时加载，并随组件卸载自动中止请求。
 */
export function usePracticeData({ labels, version, mode, textId }: UsePracticeDataOptions) {
  const fallback = labels.errorTitle ?? '加载失败';
  const articleMode = mode === 'text';

  const keymap = useSiteResource<KeymapPayload>({
    url: `/api/site/keymap/practice?version=${encodeURIComponent(version)}`,
    ttlMs: 300_000,
    fallback,
  });

  const textList = useSiteResource<PracticeTextListPayload>({
    url: articleMode ? '/api/site/texts' : null,
    ttlMs: 300_000,
    fallback,
    enabled: articleMode,
  });

  const article = useSiteResource<PracticeTextPayload>({
    url: textId ? `/api/site/texts/${encodeURIComponent(textId)}` : null,
    ttlMs: 60_000,
    fallback,
    enabled: Boolean(textId),
  });

  return { keymap, textList, article };
}
