import { useState } from 'react';
import { resolveAdminError } from '../../lib/api';
import { createCategory, deleteCategory, updateCategory } from '../../lib/categories-api';
import type { CategoryDomain, CategoryItem } from '../../lib/categories-api';
import { refreshVersions } from '../../lib/versions';
import type { EditorState, FormState } from './category-config';

export interface TaxonomyNotice {
  kind: 'ok' | 'error';
  text: string;
}

interface Options {
  canWrite: boolean;
  items: CategoryItem[];
  /** 以更新函数修改分类列表，页面据此维护整份配置数据 */
  setItems: (updater: (items: CategoryItem[]) => CategoryItem[]) => void;
  setNotice: (notice: TaxonomyNotice | null) => void;
  onUnauthorized: () => void;
}

/** 分类的编辑、保存与删除：维护编辑态与进行中的请求 */
export function useTaxonomyCategories({
  canWrite,
  items,
  setItems,
  setNotice,
  onUnauthorized,
}: Options) {
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function startCreate(domain: CategoryDomain) {
    if (!canWrite) return;
    setNotice(null);
    const maxSort = items
      .filter((item) => item.domain === domain)
      .reduce((max, item) => Math.max(max, item.sort_order), 0);
    setEditor({
      id: null,
      form: {
        domain,
        slug: '',
        label: '',
        hint: '',
        key_list: '',
        route: '',
        sort_order: String(maxSort + 1),
      },
    });
  }

  function startEdit(item: CategoryItem) {
    if (!canWrite) return;
    setNotice(null);
    setEditor({
      id: item.id,
      form: {
        domain: item.domain,
        slug: item.slug,
        label: item.label,
        hint: item.hint,
        key_list: item.key_list,
        route: item.route,
        sort_order: String(item.sort_order),
      },
    });
  }

  function updateForm(patch: Partial<FormState>) {
    setEditor((previous) =>
      previous ? { ...previous, form: { ...previous.form, ...patch } } : previous,
    );
  }

  async function handleSave() {
    if (!editor || !canWrite || saving) return;

    const slug = editor.form.slug.trim();
    const label = editor.form.label.trim();
    if (!slug || !label) {
      setNotice({ kind: 'error', text: '名称和标识不能为空' });
      return;
    }

    const payload = {
      domain: editor.form.domain,
      slug,
      label,
      hint: editor.form.hint.trim(),
      key_list: editor.form.domain === 'keymap_zone' ? editor.form.key_list.trim() : '',
      route: editor.form.domain === 'content_type' ? editor.form.route.trim() : '',
      sort_order: Number(editor.form.sort_order) || 0,
    };

    setSaving(true);
    try {
      const result = editor.id
        ? await updateCategory(editor.id, {
            slug: payload.slug,
            label: payload.label,
            hint: payload.hint,
            key_list: payload.key_list,
            route: payload.route,
            sort_order: payload.sort_order,
          })
        : await createCategory(payload);

      setItems((previous) => {
        const rest = previous.filter((item) => item.id !== result.item.id);
        return [...rest, result.item].sort((a, b) =>
          a.domain === b.domain
            ? a.sort_order - b.sort_order
            : a.domain.localeCompare(b.domain),
        );
      });
      setNotice({
        kind: 'ok',
        text: editor.id ? `已更新「${payload.label}」` : `已创建「${payload.label}」`,
      });
      setEditor(null);

      // 版本清单被内容、媒体、码表数据等页面共用，写入后同步刷新
      if (payload.domain === 'keymap_version') {
        await refreshVersions().catch(() => undefined);
      }
    } catch (caught) {
      const message = resolveAdminError(caught, '保存失败', onUnauthorized);
      if (!message) return;
      setNotice({ kind: 'error', text: message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: CategoryItem) {
    if (!canWrite || deletingId) return;
    if ((item.count ?? 0) > 0) {
      setNotice({ kind: 'error', text: `「${item.label}」仍被引用，不能删除` });
      return;
    }
    if (!window.confirm(`确定删除「${item.label}」？该分类的标识为 ${item.slug}。`)) return;

    setDeletingId(item.id);
    try {
      await deleteCategory(item.id);
      setItems((previous) => previous.filter((row) => row.id !== item.id));
      if (editor?.id === item.id) setEditor(null);
      setNotice({ kind: 'ok', text: `已删除「${item.label}」` });
      if (item.domain === 'keymap_version') {
        await refreshVersions().catch(() => undefined);
      }
    } catch (caught) {
      const message = resolveAdminError(caught, '删除失败', onUnauthorized);
      if (!message) return;
      setNotice({ kind: 'error', text: message });
    } finally {
      setDeletingId(null);
    }
  }

  return {
    editor,
    setEditor,
    saving,
    deletingId,
    startCreate,
    startEdit,
    updateForm,
    handleSave,
    handleDelete,
  };
}
