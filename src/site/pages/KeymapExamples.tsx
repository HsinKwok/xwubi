import { useMemo } from 'react';
import type { SiteConfig } from '../../shared/site-config';
import type { KeymapExample } from './keymap-types';
import { KEYMAP_PAGE_SIZE } from './keymap-types';

interface KeymapExamplesProps {
  labels: SiteConfig['labels'];
  search: string;
  onSearchChange: (value: string) => void;
  examples: KeymapExample[];
  total: number;
  page: number;
  onPageChange: (page: number) => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

/** 例字速查：搜索框、当前页例字与服务端分页 */
export function KeymapExamples({
  labels,
  search,
  onSearchChange,
  examples,
  total,
  page,
  onPageChange,
  loading,
  error,
  onRetry,
}: KeymapExamplesProps) {
  const totalPages = Math.max(1, Math.ceil(total / KEYMAP_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }
    const start = Math.max(1, Math.min(currentPage - 3, totalPages - 6));
    return Array.from({ length: 7 }, (_, index) => start + index);
  }, [currentPage, totalPages]);

  return (
    <section className="site-keymap__examples">
      <div className="site-keymap__examples-head">
        <h2 className="site-keymap__examples-title">{labels.keymapExamples ?? '例字速查'}</h2>
        <input
          className="site-keymap__search"
          type="search"
          value={search}
          placeholder={labels.keymapSearchPlaceholder ?? '输入汉字、编码或字根'}
          aria-label={labels.keymapSearchPlaceholder ?? '输入汉字、编码或字根'}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      {error && !loading ? (
        <p className="site-keymap__related-empty">
          {error}
          <button type="button" className="site-keymap__pager-btn" onClick={onRetry}>
            {labels.retry ?? '重试'}
          </button>
        </p>
      ) : examples.length > 0 ? (
        <>
          <div className="site-keymap__example-list">
            {examples.map((item) => (
              <div className="site-keymap__example" key={item.char}>
                <span className="site-keymap__example-char">{item.char}</span>
                <code className="site-keymap__example-code">{item.code}</code>
                <span className="site-keymap__example-roots">{item.roots}</span>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <nav className="site-keymap__pager" aria-label="例字分页">
              <button
                type="button"
                className="site-keymap__pager-btn"
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
              >
                {labels.keymapPrevPage ?? '上一页'}
              </button>
              <div className="site-keymap__pager-pages">
                {pageNumbers.map((number) => (
                  <button
                    key={number}
                    type="button"
                    className={`site-keymap__pager-num${
                      number === currentPage ? ' is-active' : ''
                    }`}
                    aria-current={number === currentPage ? 'page' : undefined}
                    onClick={() => onPageChange(number)}
                  >
                    {number}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="site-keymap__pager-btn"
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
              >
                {labels.keymapNextPage ?? '下一页'}
              </button>
              <span className="site-keymap__pager-info">
                {(labels.keymapPageInfo ?? '第 {page} / {total} 页 · 共 {count} 个例字')
                  .replace('{page}', String(currentPage))
                  .replace('{total}', String(totalPages))
                  .replace('{count}', String(total))}
              </span>
            </nav>
          )}
        </>
      ) : loading ? (
        <p className="site-keymap__related-empty">
          {labels.keymapExamplesLoading ?? '正在加载例字…'}
        </p>
      ) : (
        <p className="site-keymap__related-empty">
          {labels.keymapResultEmpty ?? '没有匹配的例字，换个关键词试试。'}
        </p>
      )}
    </section>
  );
}
