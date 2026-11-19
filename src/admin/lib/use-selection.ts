import { useCallback, useEffect, useMemo, useState } from 'react';

interface Selectable {
  id: string;
}

interface SelectionOptions {
  /** 筛选、翻页等变化时清空选择，传入当前查询标识即可 */
  resetKey?: string;
  /** 不可选的条目 id（如当前登录账号自己） */
  excludeIds?: string[];
}

/**
 * 列表页通用的多选逻辑：按当前页计算全选，跨页保留已选条目。
 */
export function useSelection<T extends Selectable>(
  items: T[],
  { resetKey, excludeIds }: SelectionOptions = {},
) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    setSelectedIds([]);
  }, [resetKey]);

  const selectableIds = useMemo(
    () => items.map((item) => item.id).filter((id) => !excludeIds?.includes(id)),
    [items, excludeIds],
  );
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selectedSet.has(id));

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const all = selectableIds.length > 0 && selectableIds.every((id) => prev.includes(id));
      return all
        ? prev.filter((id) => !selectableIds.includes(id))
        : [...new Set([...prev, ...selectableIds])];
    });
  }, [selectableIds]);

  const clearSelection = useCallback(() => setSelectedIds([]), []);

  const deselect = useCallback((ids: string | string[]) => {
    const removing = new Set(Array.isArray(ids) ? ids : [ids]);
    setSelectedIds((prev) => prev.filter((id) => !removing.has(id)));
  }, []);

  return {
    selectedIds,
    allSelected,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    deselect,
  };
}
