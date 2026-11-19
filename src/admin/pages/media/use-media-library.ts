import { useEffect, useState } from 'react';
import { toQueryString } from '../../../shared/query';
import { resolveAdminError } from '../../lib/api';
import { useAsyncData } from '../../lib/use-async-data';
import { useSelection } from '../../lib/use-selection';
import { deleteMedia, deleteMediaBatch, listMedia, updateMedia, uploadMedia } from '../../lib/media-api';
import type { MediaItem, MediaListResponse } from '../../lib/media-api';

const PER_PAGE = 24;

interface Options {
  canWrite: boolean;
  onUnauthorized: () => void;
}

/**
 * 媒体库的筛选分页、上传、复制地址、编辑与删除逻辑。
 */
export function useMediaLibrary({ canWrite, onUnauthorized }: Options) {
  const [keyword, setKeyword] = useState('');
  const [query, setQuery] = useState('');
  const [version, setVersion] = useState('');
  const [page, setPage] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [batchDeleting, setBatchDeleting] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const [editing, setEditing] = useState<MediaItem | null>(null);
  const [editAlt, setEditAlt] = useState('');
  const [editVersion, setEditVersion] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(keyword.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [keyword]);

  const filters = { q: query || undefined, version: version || undefined, page, per_page: PER_PAGE };
  const queryKey = toQueryString(filters);
  const { data, setData, loading, error, reload } = useAsyncData<MediaListResponse>(
    (signal) => listMedia(filters, signal),
    {
      queryKey,
      fallback: '媒体库加载失败',
      onUnauthorized,
    },
  );

  // 编辑弹窗支持 Esc 关闭
  useEffect(() => {
    if (!editing) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setEditing(null);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editing]);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const { selectedIds, toggleSelect, toggleSelectAll, clearSelection } = useSelection(items, {
    resetKey: queryKey,
  });

  async function handleFiles(files: FileList | File[]) {
    if (!canWrite) return;
    const list = Array.from(files);
    if (list.length === 0) return;

    setNotice(null);
    setUploading(true);
    const failures: string[] = [];

    try {
      for (const file of list) {
        try {
          await uploadMedia(file, '', version);
        } catch (caught) {
          const message = resolveAdminError(caught, '上传失败', onUnauthorized);
          if (!message) return;
          failures.push(`${file.name}：${message}`);
        }
      }
    } finally {
      setUploading(false);
    }

    if (failures.length > 0) {
      setNotice({ kind: 'error', text: failures.join('；') });
    } else {
      setNotice({ kind: 'ok', text: `已上传 ${list.length} 张图片` });
    }
    setPage(1);
    reload();
  }

  async function copyUrl(item: MediaItem) {
    const absolute = new URL(item.url, window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(absolute);
      setNotice({ kind: 'ok', text: '图片地址已复制到剪贴板' });
    } catch {
      setNotice({ kind: 'error', text: `复制失败，请手动复制：${absolute}` });
    }
  }

  function openEdit(item: MediaItem) {
    setEditing(item);
    setEditAlt(item.alt);
    setEditVersion(item.version ?? '');
    setEditError(null);
  }

  function closeEdit() {
    setEditing(null);
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    setEditError(null);
    try {
      const { item } = await updateMedia(editing.id, { alt: editAlt, version: editVersion });
      setData((prev) =>
        prev
          ? { ...prev, items: prev.items.map((row) => (row.id === item.id ? item : row)) }
          : prev,
      );
      setEditing(null);
      setNotice({ kind: 'ok', text: '图片信息已更新' });
    } catch (caught) {
      const message = resolveAdminError(caught, '保存失败', onUnauthorized);
      if (!message) return;
      setEditError(message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(item: MediaItem) {
    if (!window.confirm(`确定删除「${item.filename}」？删除后引用该图片的页面将无法显示。`)) {
      return;
    }

    setDeletingId(item.id);
    try {
      await deleteMedia(item.id);
      setNotice({ kind: 'ok', text: '图片已删除' });
      if (items.length === 1 && page > 1) {
        setPage((value) => value - 1);
      } else {
        reload();
      }
    } catch (caught) {
      const message = resolveAdminError(caught, '删除失败', onUnauthorized);
      if (!message) return;
      setNotice({ kind: 'error', text: message });
    } finally {
      setDeletingId(null);
    }
  }

  /** 切换版本筛选并回到第一页 */
  function changeVersion(value: string) {
    setVersion(value);
    setPage(1);
  }

  async function deleteSelected() {
    if (!canWrite || batchDeleting || selectedIds.length === 0) return;
    const count = selectedIds.length;
    if (
      !window.confirm(
        `确定删除选中的 ${count} 张图片？\n删除后无法恢复，引用这些图片的页面将无法显示。`,
      )
    ) {
      return;
    }

    setBatchDeleting(true);
    try {
      const payload = await deleteMediaBatch(selectedIds);
      clearSelection();
      setNotice({ kind: 'ok', text: `已删除 ${payload.deleted} 张图片` });
      if (items.length === count && page > 1) {
        setPage((value) => value - 1);
      } else {
        reload();
      }
    } catch (caught) {
      const message = resolveAdminError(caught, '批量删除失败', onUnauthorized);
      if (!message) return;
      setNotice({ kind: 'error', text: message });
    } finally {
      setBatchDeleting(false);
    }
  }

  return {
    keyword,
    setKeyword,
    query,
    version,
    changeVersion,
    page,
    setPage,
    totalPages,
    uploading,
    deletingId,
    notice,
    setNotice,
    editing,
    closeEdit,
    editAlt,
    setEditAlt,
    editVersion,
    setEditVersion,
    editError,
    saving,
    items,
    total,
    loading,
    error,
    reload,
    handleFiles,
    copyUrl,
    openEdit,
    saveEdit,
    remove,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    batchDeleting,
    deleteSelected,
  };
}
