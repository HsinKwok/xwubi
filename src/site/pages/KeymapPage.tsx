import { useEffect, useMemo, useState } from 'react';
import type { SiteConfig } from '../../shared/site-config';
import { PageHeader, PageState, type PageStatus } from '../components/Bits';
import { useSiteResource } from '../lib/use-site-resource';
import { KeymapBoard } from './KeymapBoard';
import { KeymapExamples } from './KeymapExamples';
import type { ExampleListPayload, KeymapPayload } from './keymap-types';
import { KEYMAP_PAGE_SIZE } from './keymap-types';
import '../styles/keymap.css';

const SEARCH_DEBOUNCE = 250;

export interface KeymapPageProps {
  labels: SiteConfig['labels'];
  version: string;
  versionLabel: string;
}

export function KeymapPage({ labels, version, versionLabel }: KeymapPageProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const fallback = labels.errorTitle ?? '加载失败';

  // 基础数据：字根、分区、每键代表例字与例字总数
  const keymap = useSiteResource<KeymapPayload>({
    url: `/api/site/keymap?version=${encodeURIComponent(version)}`,
    ttlMs: 300_000,
    fallback,
    onSuccess: (payload) => setSelected(payload.roots[0]?.key ?? null),
  });

  const exampleParams = new URLSearchParams({
    version,
    page: String(page),
    per_page: String(KEYMAP_PAGE_SIZE),
  });
  if (query) exampleParams.set('q', query);

  // 例字速查：服务端分页 + 搜索，仅取当前页数据
  const exampleList = useSiteResource<ExampleListPayload>({
    url: `/api/site/keymap/examples?${exampleParams.toString()}`,
    ttlMs: 0,
    fallback,
  });

  // 搜索输入防抖，避免每次按键都请求
  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(search.trim()), SEARCH_DEBOUNCE);
    return () => window.clearTimeout(timer);
  }, [search]);

  // 关键词变化后回到第一页
  useEffect(() => {
    setPage(1);
  }, [query]);

  const data = keymap.data;
  const rootMap = useMemo(
    () => new Map((data?.roots ?? []).map((item) => [item.key, item])),
    [data],
  );

  // 分区由后台「分类管理」维护；未配置时展示空状态，不再使用内置兜底
  const zones = data?.zones ?? [];
  const relatedExamples = selected ? data?.related[selected] ?? [] : [];

  // 切换版本时页面会整体重挂载，这里只关心本次加载是否成功
  const status: PageStatus = keymap.error
    ? 'error'
    : !data
      ? 'loading'
      : data.roots.length === 0 || zones.length === 0
        ? 'empty'
        : 'ready';

  return (
    <div className="site-page site-keymap">
      <PageHeader
        eyebrow={labels.keymapEyebrow ?? 'KEYMAP'}
        title={labels.keymapTitle ?? '字根键位图'}
        description={
          labels.keymapDescription ??
          '按横、竖、撇、捺、折五个区排列 25 个键位，点开任一键查看口诀与代表字根。'
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
        emptyTitle={labels.keymapEmptyTitle ?? '当前版本还没有码表数据'}
        emptyDescription={labels.keymapEmptyDescription ?? '可以先切换码表版本，或稍后再来查看。'}
      />

      {status === 'ready' && (
        <>
          <KeymapBoard
            labels={labels}
            zones={zones}
            rootMap={rootMap}
            selected={selected}
            relatedExamples={relatedExamples}
            onSelect={setSelected}
          />

          <KeymapExamples
            labels={labels}
            search={search}
            onSearchChange={setSearch}
            examples={exampleList.data?.items ?? []}
            total={exampleList.data?.total ?? 0}
            page={page}
            onPageChange={setPage}
            loading={exampleList.loading}
            error={exampleList.error}
            onRetry={exampleList.reload}
          />
        </>
      )}
    </div>
  );
}
