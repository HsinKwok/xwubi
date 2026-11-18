import { useState } from 'react';
import {
  archiveContent,
  getContent,
  publishContent,
  restoreRevision,
  submitContent,
  unpublishContent,
  updateContent,
} from '../../lib/content-api';
import type { AdminContentItem, RevisionItem } from '../../lib/content-api';
import type { EditorNotice } from './content-editor-errors';

interface Options {
  item: AdminContentItem | null;
  canEdit: boolean;
  canReview: boolean;
  dirty: boolean;
  setNotice: (notice: EditorNotice | null) => void;
  setProblems: (problems: string[]) => void;
  setConflict: (conflict: boolean) => void;
  onError: (caught: unknown) => void;
  persist: () => Promise<AdminContentItem | null>;
  applyItem: (item: AdminContentItem) => void;
  refresh: (targetId: string) => Promise<void>;
  refreshRevisions: () => void;
  onNavigate: (href: string) => void;
}

/**
 * 内容编辑器的保存与审核流转操作：保存、提审、发布、下架、归档、核对、修订回滚。
 */
export function useContentWorkflow({
  item,
  canEdit,
  canReview,
  dirty,
  setNotice,
  setProblems,
  setConflict,
  onError,
  persist,
  applyItem,
  refresh,
  refreshRevisions,
  onNavigate,
}: Options) {
  const [pending, setPending] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<number | null>(null);

  /** 每次操作前清空上一次的提示与错误 */
  function resetFeedback() {
    setNotice(null);
    setProblems([]);
    setConflict(false);
  }

  async function handleRestore(revision: RevisionItem) {
    if (!item || !canEdit || pending || restoring !== null) return;

    if (dirty && !window.confirm('当前有未保存的修改，回滚会丢弃这些修改。确定继续？')) {
      return;
    }
    if (
      !window.confirm(
        `确定回滚到第 ${revision.revision_no} 版「${revision.title}」？当前内容会作为新的修订记录保留。`,
      )
    ) {
      return;
    }

    setRestoring(revision.id);
    resetFeedback();

    try {
      const payload = await restoreRevision(item.id, revision.id, item.updated_at);
      if (!payload.item) throw new Error('服务端没有返回内容数据');
      applyItem(payload.item);
      refreshRevisions();
      setNotice({ tone: 'ok', text: `已回滚到第 ${revision.revision_no} 版，并生成新的修订记录。` });
    } catch (caught) {
      onError(caught);
    } finally {
      setRestoring(null);
    }
  }

  async function handleSave() {
    if (!canEdit || pending) return;
    setPending('save');
    resetFeedback();

    try {
      const next = await persist();
      if (!next) return;

      if (!item) {
        onNavigate(`/admin/content/${next.id}?created=1`);
        return;
      }
      setNotice({ tone: 'ok', text: '已保存，并生成一条修订记录。' });
    } catch (caught) {
      onError(caught);
    } finally {
      setPending(null);
    }
  }

  async function handleSubmit() {
    if (!canEdit || pending) return;
    setPending('submit');
    resetFeedback();

    try {
      let target = item;
      if (!target || dirty) {
        target = await persist();
        if (!target) return;
      }

      await submitContent(target.id);
      if (!item) {
        onNavigate(`/admin/content/${target.id}`);
        return;
      }
      await refresh(target.id).catch(() => undefined);
      setNotice({ tone: 'ok', text: '已提交审核。' });
    } catch (caught) {
      onError(caught);
    } finally {
      setPending(null);
    }
  }

  async function handlePublish() {
    if (!item || !canReview || pending) return;
    setPending('publish');
    resetFeedback();

    try {
      let target = item;
      if (canEdit && dirty) {
        target = (await persist()) ?? item;
      }

      await publishContent(target.id);
      await refresh(target.id).catch(() => undefined);
      setNotice({ tone: 'ok', text: '已发布，前台会在缓存刷新后更新。' });
    } catch (caught) {
      onError(caught);
    } finally {
      setPending(null);
    }
  }

  async function handleTransition(action: 'unpublish' | 'archive') {
    if (!item || !canReview || pending) return;
    setPending(action);
    resetFeedback();

    try {
      if (canEdit && dirty) {
        const saved = await persist();
        if (!saved) return;
      }

      if (action === 'unpublish') {
        await unpublishContent(item.id);
        await refresh(item.id).catch(() => undefined);
        setNotice({ tone: 'ok', text: '已下架，内容回到草稿状态。' });
      } else {
        await archiveContent(item.id);
        await refresh(item.id).catch(() => undefined);
        setNotice({ tone: 'ok', text: '已归档。' });
      }
    } catch (caught) {
      onError(caught);
    } finally {
      setPending(null);
    }
  }

  async function handleVerify() {
    if (!item || !canEdit || pending) return;
    setPending('verify');
    resetFeedback();

    try {
      let target = item;
      if (dirty) {
        target = (await persist()) ?? item;
      }

      const payload = await updateContent(target.id, { verified_at: new Date().toISOString() });
      if (payload.item) applyItem(payload.item);
      refreshRevisions();
      setNotice({ tone: 'ok', text: '已标记为人工核对完成。' });
    } catch (caught) {
      onError(caught);
    } finally {
      setPending(null);
    }
  }

  return {
    pending,
    restoring,
    handleRestore,
    handleSave,
    handleSubmit,
    handlePublish,
    handleTransition,
    handleVerify,
  };
}
