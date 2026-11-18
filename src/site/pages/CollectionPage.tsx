// 集合页：按内容类型展示列表、筛选与分页加载
import type { BootstrapPayload } from '../../shared/site-config';
import { PageHeader, PageState, type PageStatus } from '../components/Bits';
import { CollectionRow } from '../components/Sections';
import { CollectionToolEntries } from './collection/CollectionToolEntries';
import { useCollectionList } from './collection/use-collection-list';
import '../styles/collection.css';

export interface CollectionPageProps {
  boot: BootstrapPayload;
  type: string;
  version: string;
}

export function CollectionPage({ boot, type, version }: CollectionPageProps) {
  const {
    meta,
    data,
    items,
    error,
    loading,
    loadingMore,
    filters,
    pageFilters,
    versionLabel,
    hasMore,
    selectFilter,
    retry,
    retryMore,
    loadMore,
  } = useCollectionList({ boot, type, version });

  const page = data?.page ?? meta;
  const status: PageStatus =
    loading && !data
      ? 'loading'
      : error && !loading && items.length === 0
        ? 'error'
        : !error && data && items.length === 0
          ? 'empty'
          : 'ready';

  return (
    <div className="site-page site-page--collection">
      <PageHeader
        eyebrow={page?.eyebrow}
        title={page?.title ?? ''}
        description={page?.description}
        count={data ? `${data.total} ${boot.labels.countUnit ?? ''}` : ''}
        versionLabel={versionLabel}
      />

      {type === 'tool' && <CollectionToolEntries boot={boot} />}

      {pageFilters.length > 0 && (
        <div className="site-filters">
          {pageFilters.map((filter) => (
            <div className="site-filter" key={filter.key}>
              <span className="site-filter__label">{filter.label}</span>
              <div className="site-filter__options">
                {filter.options.map((option) => {
                  const active = (filters[filter.key] ?? '') === option.value;
                  return (
                    <button
                      key={`${filter.key}-${option.value}`}
                      type="button"
                      className={`site-filter__option${active ? ' is-active' : ''}`}
                      aria-pressed={active}
                      onClick={() => selectFilter(filter.key, option.value)}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <PageState
        status={status}
        skeletonRows={4}
        errorTitle={boot.labels.errorTitle}
        errorMessage={error ?? undefined}
        retryLabel={boot.labels.retry}
        onRetry={retry}
        emptyTitle={page?.empty?.title ?? boot.labels.emptyTitle}
        emptyDescription={page?.empty?.description ?? boot.labels.emptyDescription}
      />

      {items.length > 0 && (
        <>
          <div className={`site-items${loading ? ' is-refreshing' : ''}`}>
            {items.map((item, index) => (
              <CollectionRow
                item={item}
                index={index}
                versions={boot.versions}
                labels={boot.labels}
                key={item.id}
              />
            ))}
          </div>

          <div className="site-load-more">
            {error ? (
              // 加载更多失败时保留已加载内容，只提供重试
              <button type="button" className="site-btn site-btn--ghost" onClick={retryMore}>
                {boot.labels.retry}
              </button>
            ) : (
              hasMore && (
                <button
                  type="button"
                  className="site-btn site-btn--ghost"
                  disabled={loadingMore}
                  onClick={loadMore}
                >
                  {loadingMore
                    ? boot.labels.loadingMore ?? '正在加载…'
                    : boot.labels.loadMore ?? '加载更多'}
                </button>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
