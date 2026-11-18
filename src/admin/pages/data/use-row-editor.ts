import { useState } from 'react';

/** 表格式行内编辑的通用状态：编辑草稿、保存中与删除中的行 */
export function useRowEditor<T>(emptyDraft: T) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<T>(emptyDraft);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function startEdit(id: string, value: T) {
    setEditingId(id);
    setDraft(value);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function patchDraft(patch: Partial<T>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  async function runSave(id: string, action: () => Promise<void>) {
    if (savingId) return;
    setSavingId(id);
    try {
      await action();
      setEditingId(null);
    } catch {
      // 失败时保留编辑态，错误提示由父级统一展示
    } finally {
      setSavingId(null);
    }
  }

  async function runDelete(id: string, confirmText: string, action: () => Promise<void>) {
    if (deletingId) return;
    if (!window.confirm(confirmText)) return;

    setDeletingId(id);
    try {
      await action();
      if (editingId === id) setEditingId(null);
    } catch {
      // 错误提示由父级统一展示
    } finally {
      setDeletingId(null);
    }
  }

  return {
    editingId,
    draft,
    savingId,
    deletingId,
    startEdit,
    cancelEdit,
    patchDraft,
    runSave,
    runDelete,
  };
}
