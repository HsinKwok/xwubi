import { useEffect, useState } from 'react';
import { resolveAdminError } from '../../lib/api';
import { createContent, createTag, deleteContent, getContent, updateContent } from '../../lib/content-api';
import type { AdminContentItem } from '../../lib/content-api';
import type { AdminUser } from '../../types';
import { buildInput, emptyForm, formFromItem, snapshot } from './content-form';
import type { ContentFormState } from './content-form';
import { handleEditorError } from './content-editor-errors';
import type { EditorNotice } from './content-editor-errors';
import { useContentWorkflow } from './use-content-workflow';
import { useContentCategories, useEditorTags, useRevisionHistory } from './use-editor-lookups';

interface Options {
  user: AdminUser;
  /** null 表示新建 */
  id: string | null;
  onNavigate: (href: string) => void;
  onUnauthorized: () => void;
}

/**
 * 内容编辑器的数据与操作逻辑：加载、字段与标签维护、审核流转。
 */
export function useContentEditor({ user, id, onNavigate, onUnauthorized }: Options) {
  const [item, setItem] = useState<AdminContentItem | null>(null);
  const [form, setForm] = useState<ContentFormState>(() =>
    emptyForm(user.role === 'ops' ? 'news' : 'lesson'),
  );
  const [baseline, setBaseline] = useState(() => snapshot(form));
  const [loading, setLoading] = useState(Boolean(id));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<EditorNotice | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [conflict, setConflict] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const { tags, setTags, tagsLoading, tagsError } = useEditorTags(onUnauthorized);
  const categories = useContentCategories();
  const { revisions, refresh: refreshRevisions } = useRevisionHistory(id);

  const canEdit =
    user.role !== 'reviewer' && !(user.role === 'ops' && item !== null && item.type !== 'news');
  const canReview = user.role === 'admin' || user.role === 'reviewer';
  const dirty = snapshot(form) !== baseline;

  function reload() {
    setReloadKey((key) => key + 1);
  }

  function applyItem(next: AdminContentItem) {
    const nextForm = formFromItem(next);
    setItem(next);
    setForm(nextForm);
    setBaseline(snapshot(nextForm));
  }

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);

    getContent(id, controller.signal)
      .then((payload) => {
        if (controller.signal.aborted) return;
        applyItem(payload.item);
        setLoading(false);
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        const message = resolveAdminError(caught, '内容加载失败', onUnauthorized);
        if (!message) return;
        setLoadError(message);
        setLoading(false);
      });

    return () => controller.abort();
  }, [id, reloadKey, onUnauthorized]);

  // 新建时若默认类型已被删除，自动切到第一个可用类型
  useEffect(() => {
    if (id || categories.length === 0) return;
    const available = categories.filter((item) => item.domain === 'content_type');
    setForm((prev) => {
      if (available.some((item) => item.slug === prev.type)) return prev;
      const fallback =
        (user.role === 'ops' ? available.find((item) => item.slug === 'news') : undefined) ??
        available[0];
      return fallback ? { ...prev, type: fallback.slug } : prev;
    });
  }, [categories, id, user.role]);

  // 新建成功跳转过来时给出提示，并把地址栏恢复干净
  useEffect(() => {
    if (!id) return;
    if (new URLSearchParams(window.location.search).has('created')) {
      setNotice({ tone: 'ok', text: '内容已创建，可以继续编辑或提交审核。' });
      window.history.replaceState({}, '', `/admin/content/${id}`);
    }
  }, [id]);

  function setField<K extends keyof ContentFormState>(key: K, value: ContentFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setNotice(null);
    setProblems([]);
    setConflict(false);
  }

  /** 切换内容类型：只接受分类表中存在的类型，类型变化时清空教学阶段 */
  function changeType(next: string) {
    if (!categories.some((category) => category.domain === 'content_type' && category.slug === next)) {
      return;
    }
    setForm((prev) => ({ ...prev, type: next, stage: next === 'lesson' ? prev.stage : '' }));
    setNotice(null);
    setProblems([]);
    setConflict(false);
  }

  function handleError(caught: unknown) {
    handleEditorError(caught, { setNotice, setProblems, setConflict, onUnauthorized });
  }

  function toggleTag(tagId: string) {
    if (!canEdit) return;
    setField(
      'tagIds',
      form.tagIds.includes(tagId)
        ? form.tagIds.filter((idItem) => idItem !== tagId)
        : [...form.tagIds, tagId],
    );
  }

  async function handleCreateTag(name: string): Promise<boolean> {
    if (!canEdit) return false;

    try {
      const payload = await createTag({ name });
      setTags((prev) => [...prev, payload.item]);
      setForm((prev) => ({ ...prev, tagIds: [...prev.tagIds, payload.item.id] }));
      setNotice({ tone: 'ok', text: `已新建标签「${payload.item.name}」，保存后生效。` });
      return true;
    } catch (caught) {
      handleError(caught);
      return false;
    }
  }

  async function handleDelete() {
    if (!item || !canEdit || deleting) return;
    if (!window.confirm(`确定删除「${item.title}」？删除后无法恢复。`)) return;

    setDeleting(true);
    setNotice(null);
    try {
      await deleteContent(item.id);
      onNavigate('/admin/content');
    } catch (caught) {
      handleError(caught);
    } finally {
      setDeleting(false);
    }
  }

  async function persist(): Promise<AdminContentItem | null> {
    const input = buildInput(form, item);

    if (!input.title) {
      setNotice({ tone: 'error', text: '标题不能为空' });
      return null;
    }

    const payload = item ? await updateContent(item.id, input) : await createContent(input);
    if (!payload.item) throw new Error('服务端没有返回内容数据');

    applyItem(payload.item);
    refreshRevisions();
    return payload.item;
  }

  async function refresh(targetId: string) {
    const payload = await getContent(targetId);
    applyItem(payload.item);
    refreshRevisions();
  }

  const {
    pending,
    restoring,
    handleRestore,
    handleSave,
    handleSubmit,
    handlePublish,
    handleTransition,
    handleVerify,
  } = useContentWorkflow({
    item,
    canEdit,
    canReview,
    dirty,
    setNotice,
    setProblems,
    setConflict,
    onError: handleError,
    persist,
    applyItem,
    refresh,
    refreshRevisions,
    onNavigate,
  });

  return {
    item,
    form,
    loading,
    loadError,
    revisions,
    tags,
    tagsLoading,
    tagsError,
    categories,
    pending,
    restoring,
    notice,
    problems,
    conflict,
    deleting,
    canEdit,
    canReview,
    dirty,
    reload,
    setField,
    changeType,
    toggleTag,
    handleCreateTag,
    handleRestore,
    handleSave,
    handleSubmit,
    handlePublish,
    handleTransition,
    handleVerify,
    handleDelete,
  };
}
