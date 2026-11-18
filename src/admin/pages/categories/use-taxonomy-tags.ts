import { useState } from 'react';
import { resolveAdminError } from '../../lib/api';
import { createTag, deleteTag, updateTag } from '../../lib/content-api';
import type { TagItem } from '../../lib/content-api';
import type { TaxonomyNotice } from './use-taxonomy-categories';

interface Options {
  canWrite: boolean;
  setTags: (updater: (tags: TagItem[]) => TagItem[]) => void;
  setNotice: (notice: TaxonomyNotice | null) => void;
  onUnauthorized: () => void;
}

/** 标签的创建、重命名与删除：维护输入框、编辑态与进行中的请求 */
export function useTaxonomyTags({ canWrite, setTags, setNotice, onUnauthorized }: Options) {
  const [newTag, setNewTag] = useState('');
  const [creatingTag, setCreatingTag] = useState(false);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editTagName, setEditTagName] = useState('');
  const [savingTagId, setSavingTagId] = useState<string | null>(null);
  const [deletingTagId, setDeletingTagId] = useState<string | null>(null);

  function startEditTag(tag: TagItem) {
    setEditingTagId(tag.id);
    setEditTagName(tag.name);
  }

  function cancelEditTag() {
    setEditingTagId(null);
  }

  async function handleCreateTag() {
    const name = newTag.trim();
    if (!canWrite || !name || creatingTag) return;

    setCreatingTag(true);
    try {
      const payload = await createTag({ name });
      setTags((previous) =>
        [...previous, payload.item].sort((a, b) => a.name.localeCompare(b.name, 'zh')),
      );
      setNewTag('');
      setNotice({ kind: 'ok', text: `已创建标签「${payload.item.name}」` });
    } catch (caught) {
      const message = resolveAdminError(caught, '创建失败', onUnauthorized);
      if (!message) return;
      setNotice({ kind: 'error', text: message });
    } finally {
      setCreatingTag(false);
    }
  }

  async function handleRenameTag(tag: TagItem) {
    const name = editTagName.trim();
    if (!canWrite || !name || savingTagId) return;
    if (name === tag.name) {
      setEditingTagId(null);
      return;
    }

    setSavingTagId(tag.id);
    try {
      const payload = await updateTag(tag.id, { name });
      setTags((previous) =>
        previous
          .map((row) => (row.id === tag.id ? payload.item : row))
          .sort((a, b) => a.name.localeCompare(b.name, 'zh')),
      );
      setEditingTagId(null);
      setNotice({ kind: 'ok', text: '标签已更新' });
    } catch (caught) {
      const message = resolveAdminError(caught, '更新失败', onUnauthorized);
      if (!message) return;
      setNotice({ kind: 'error', text: message });
    } finally {
      setSavingTagId(null);
    }
  }

  async function handleDeleteTag(tag: TagItem) {
    if (!canWrite || deletingTagId) return;
    if ((tag.count ?? 0) > 0) {
      setNotice({ kind: 'error', text: `标签「${tag.name}」仍被内容引用，不能删除` });
      return;
    }
    if (!window.confirm(`确定删除标签「${tag.name}」？`)) return;

    setDeletingTagId(tag.id);
    try {
      await deleteTag(tag.id);
      setTags((previous) => previous.filter((row) => row.id !== tag.id));
      if (editingTagId === tag.id) setEditingTagId(null);
      setNotice({ kind: 'ok', text: '标签已删除' });
    } catch (caught) {
      const message = resolveAdminError(caught, '删除失败', onUnauthorized);
      if (!message) return;
      setNotice({ kind: 'error', text: message });
    } finally {
      setDeletingTagId(null);
    }
  }

  return {
    newTag,
    setNewTag,
    creatingTag,
    editingTagId,
    editTagName,
    setEditTagName,
    savingTagId,
    deletingTagId,
    startEditTag,
    cancelEditTag,
    handleCreateTag,
    handleRenameTag,
    handleDeleteTag,
  };
}
