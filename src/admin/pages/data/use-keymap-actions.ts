import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { resolveAdminError } from '../../lib/api';
import {
  createExample,
  createRoot,
  deleteExample,
  deleteRoot,
  importKeymap,
  updateExample,
  updateRoot,
} from '../../lib/data-api';
import type {
  ExampleDraft,
  ImportReport,
  RootDraft,
  WubiExampleItem,
  WubiRootItem,
} from '../../lib/data-api';
import type { WubiVersion } from '../../types';
import type { KeymapTab } from './use-keymap-data';

export interface KeymapNotice {
  kind: 'ok' | 'error';
  text: string;
}

interface Options {
  tab: KeymapTab;
  version: WubiVersion;
  canWrite: boolean;
  page: number;
  examples: WubiExampleItem[];
  setPage: (page: number) => void;
  setRoots: Dispatch<SetStateAction<WubiRootItem[]>>;
  setExamples: Dispatch<SetStateAction<WubiExampleItem[]>>;
  setTotal: Dispatch<SetStateAction<number>>;
  reload: () => void;
  onUnauthorized: () => void;
  /** 提示条由页面持有，方便矩阵加载失败等其它来源复用 */
  setNotice: (notice: KeymapNotice | null) => void;
}

function sortRoots(items: WubiRootItem[]): WubiRootItem[] {
  return [...items].sort((a, b) =>
    a.sort_order === b.sort_order ? a.key.localeCompare(b.key) : a.sort_order - b.sort_order,
  );
}

/**
 * 码表数据的写操作与导入：新增、行内更新、删除与 CSV 导入。
 * 成功后就地更新列表，并按分页情况决定回到第一页还是重新取数。
 */
export function useKeymapActions({
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
}: Options) {
  const [importing, setImporting] = useState(false);
  const [importReport, setImportReport] = useState<ImportReport | null>(null);

  function reportError(caught: unknown, fallback: string) {
    const message = resolveAdminError(caught, fallback, onUnauthorized);
    if (!message) return;
    setNotice({ kind: 'error', text: message });
  }

  async function handleCreateRoot(draft: RootDraft): Promise<boolean> {
    setNotice(null);

    try {
      const payload = await createRoot({ version, ...draft, sort_order: 0 });
      setRoots((prev) => sortRoots([...prev, payload.item]));
      setNotice({ kind: 'ok', text: `已新增 ${payload.item.key} 键字根` });
      return true;
    } catch (caught) {
      reportError(caught, '新增字根失败');
      return false;
    }
  }

  async function handleCreateExample(draft: ExampleDraft): Promise<boolean> {
    setNotice(null);

    try {
      const payload = await createExample({ version, ...draft, sort_order: 0 });
      // 新例字默认排在最前，回到第一页并重新取数
      setPage(1);
      reload();
      setNotice({ kind: 'ok', text: `已新增例字「${payload.item.char}」` });
      return true;
    } catch (caught) {
      reportError(caught, '新增例字失败');
      return false;
    }
  }

  async function handleUpdateRoot(id: string, input: RootDraft) {
    try {
      const payload = await updateRoot(id, input);
      setRoots((prev) => sortRoots(prev.map((row) => (row.id === id ? payload.item : row))));
      setNotice({ kind: 'ok', text: `${payload.item.key} 键字根已更新` });
    } catch (caught) {
      reportError(caught, '保存字根失败');
      throw caught;
    }
  }

  async function handleDeleteRoot(item: WubiRootItem) {
    try {
      await deleteRoot(item.id);
      setRoots((prev) => prev.filter((row) => row.id !== item.id));
      setNotice({ kind: 'ok', text: '字根已删除' });
    } catch (caught) {
      reportError(caught, '删除字根失败');
      throw caught;
    }
  }

  async function handleUpdateExample(id: string, input: ExampleDraft) {
    try {
      const payload = await updateExample(id, input);
      setExamples((prev) => prev.map((row) => (row.id === id ? payload.item : row)));
      setNotice({ kind: 'ok', text: `例字「${payload.item.char}」已更新` });
    } catch (caught) {
      reportError(caught, '保存例字失败');
      throw caught;
    }
  }

  async function handleDeleteExample(item: WubiExampleItem) {
    try {
      await deleteExample(item.id);
      setExamples((prev) => prev.filter((row) => row.id !== item.id));
      setTotal((value) => Math.max(0, value - 1));
      if (examples.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        // 重新取当前页，补齐被删掉的位置
        reload();
      }
      setNotice({ kind: 'ok', text: '例字已删除' });
    } catch (caught) {
      reportError(caught, '删除例字失败');
      throw caught;
    }
  }

  async function handleImport(csv: string) {
    if (!canWrite || importing || tab === 'matrix') return;

    setImporting(true);
    setImportReport(null);
    setNotice(null);

    try {
      const report = await importKeymap({ kind: tab, version, csv });
      setImportReport(report);
      setPage(1);
      reload();
      setNotice({
        kind: report.errors.length > 0 ? 'error' : 'ok',
        text: `导入完成：新增 ${report.inserted}，更新 ${report.updated}，跳过 ${report.skipped}`,
      });
    } catch (caught) {
      reportError(caught, '导入失败');
    } finally {
      setImporting(false);
    }
  }

  return {
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
  };
}
