import { useEffect, useState } from 'react';
import { Icon } from '../../components/icons';
import type { AdminUser, WubiVersion } from '../../types';
import { defaultVersion, versionLabel, versionOptions } from '../../lib/versions';
import { KeymapImport } from './KeymapImport';
import { KeymapCreatePanel } from './KeymapCreatePanel';
import { ExamplesTable } from './ExamplesTable';
import { RootsTable } from './RootsTable';
import { MatrixView } from './MatrixView';
import { KeymapPager } from './KeymapPager';
import type { KeymapPageSize } from './KeymapPager';
import { useKeymapActions } from './use-keymap-actions';
import type { KeymapNotice } from './use-keymap-actions';
import { useKeymapData } from './use-keymap-data';
import type { KeymapTab } from './use-keymap-data';
import '../../styles/keymap.css';

const VERSION_KEY = 'xwubi.admin.data.version';

function readVersion(): WubiVersion {
  const allowed = versionOptions().map((item) => item.value);
  try {
    const stored = window.localStorage.getItem(VERSION_KEY);
    return stored && allowed.includes(stored) ? stored : defaultVersion();
  } catch {
    return defaultVersion();
  }
}

export interface DataPageProps {
  user: AdminUser;
  onUnauthorized: () => void;
}

export function DataPage({ user, onUnauthorized }: DataPageProps) {
  const canWrite = user.role === 'admin';

  const [tab, setTab] = useState<KeymapTab>('roots');
  const [version, setVersion] = useState<WubiVersion>(readVersion);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState<KeymapNotice | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<KeymapPageSize>(50);

  const [importOpen, setImportOpen] = useState(false);

  const {
    roots,
    setRoots,
    examples,
    setExamples,
    total,
    setTotal,
    loading,
    error,
    loadedTab,
    matrix,
    matrixLoading,
    reload,
  } = useKeymapData({
    tab,
    version,
    query,
    page,
    pageSize,
    onUnauthorized,
    onMatrixError: (message) => setNotice({ kind: 'error', text: message }),
  });

  const {
    importing,
    importReport,
    setImportReport,
    handleCreateRoot,
    handleCreateExample,
    handleUpdateRoot,
    handleDeleteRoot,
    handleUpdateExample,
    handleDeleteExample,
    handleImport,
  } = useKeymapActions({
    tab,
    version,
    canWrite,
    page,
    examples,
    setPage,
    setRoots,
    setExamples,
    setTotal,
    reload,
    onUnauthorized,
    setNotice,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [tab, version, query]);

  function changeVersion(next: WubiVersion) {
    setVersion(next);
    try {
      window.localStorage.setItem(VERSION_KEY, next);
    } catch {
      // 忽略隐私模式下的写入失败
    }
  }

  const itemsCount = tab === 'roots' ? roots.length : total;

  return (
    <div className="xw-content">
      <header className="xw-content__head">
        <div>
          <p className="xw-content__eyebrow">KEYMAP DATA</p>
          <h1 className="xw-content__title">码表数据</h1>
          <p className="xw-content__desc">
            维护各版本的字根与例字，支持 CSV 批量导入。导入按「版本 + 键位 / 汉字」覆盖同项，不会删除未出现在文件中的记录。
          </p>
        </div>
      </header>

      {notice && (
        <div className={`xw-notice xw-notice--${notice.kind}`} role="status">
          <span>{notice.text}</span>
          <button
            type="button"
            className="xw-btn xw-btn--ghost xw-btn--sm"
            onClick={() => setNotice(null)}
          >
            关闭
          </button>
        </div>
      )}

      <div className="xw-tabs" role="tablist">
        {(
          [
            ['roots', '字根表'],
            ['examples', '例字库'],
            ['matrix', '版本矩阵'],
          ] as Array<[KeymapTab, string]>
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={`xw-tabs__item${tab === key ? ' is-active' : ''}`}
            onClick={() => {
              setTab(key);
              setImportOpen(false);
              setImportReport(null);
              setNotice(null);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'matrix' ? (
        <MatrixView items={matrix} loading={matrixLoading} />
      ) : (
        <>
          <div className="xw-toolbar xw-keymap__toolbar">
            <div className="xw-keymap__filters">
              <select
                className="xw-select"
                aria-label="码表版本"
                value={version}
                onChange={(event) => changeVersion(event.target.value as WubiVersion)}
              >
                {versionOptions().map((item) => (
                  <option value={item.value} key={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <input
                className="xw-input"
                placeholder={tab === 'roots' ? '搜索键位、口诀或字根' : '搜索例字、编码或拆解'}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <span className="xw-toolbar__count">
              {loading ? '加载中…' : `共 ${itemsCount} 条`}
            </span>
            {canWrite && (
              <button
                type="button"
                className="xw-btn xw-btn--ghost xw-btn--sm"
                onClick={() => {
                  setImportOpen((open) => !open);
                  setImportReport(null);
                }}
              >
                {importOpen ? '收起导入' : '导入 CSV'}
              </button>
            )}
          </div>

          {canWrite && importOpen && (
            <KeymapImport
              key={`${tab}-${version}`}
              kind={tab}
              version={version}
              importing={importing}
              report={importReport}
              onImport={(csv) => void handleImport(csv)}
              onLocalError={(text) => setNotice({ kind: 'error', text })}
            />
          )}

          {canWrite && (
            <KeymapCreatePanel
              tab={tab}
              version={version}
              onCreateRoot={handleCreateRoot}
              onCreateExample={handleCreateExample}
            />
          )}

          {!canWrite && (
            <p className="xw-field__hint">当前角色只能查看码表数据，维护与导入需要管理员权限。</p>
          )}

          {error ? (
            <div className="xw-panel">
              <div className="xw-empty">
                <Icon name="shield" size={22} />
                <p>{error}</p>
                <button
                  type="button"
                  className="xw-btn xw-btn--ghost xw-btn--sm"
                  onClick={reload}
                >
                  重新加载
                </button>
              </div>
            </div>
          ) : !loading && loadedTab === tab && itemsCount === 0 ? (
            <div className="xw-panel">
              <div className="xw-empty">
                <Icon name="database" size={22} />
                <p>
                  {versionLabel(version)}还没有{tab === 'roots' ? '字根' : '例字'}数据
                  {canWrite ? '，可以新增或导入 CSV' : ''}
                </p>
              </div>
            </div>
          ) : tab === 'roots' ? (
            <RootsTable
              items={roots}
              canWrite={canWrite}
              loading={loading}
              onUpdate={handleUpdateRoot}
              onDelete={handleDeleteRoot}
            />
          ) : (
            <>
              <ExamplesTable
                items={examples}
                canWrite={canWrite}
                loading={loading}
                onUpdate={handleUpdateExample}
                onDelete={handleDeleteExample}
              />

              <KeymapPager
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
