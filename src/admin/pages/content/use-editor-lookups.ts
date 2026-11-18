import { useEffect, useState } from 'react';
import { resolveAdminError } from '../../lib/api';
import { listRevisions, listTags } from '../../lib/content-api';
import type { RevisionItem, TagItem } from '../../lib/content-api';
import { listCategories } from '../../lib/categories-api';
import type { CategoryItem } from '../../lib/categories-api';

/** 内容编辑器用到的标签列表 */
export function useEditorTags(onUnauthorized: () => void) {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [tagsError, setTagsError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setTagsLoading(true);
    setTagsError(null);

    listTags(controller.signal)
      .then((payload) => {
        if (controller.signal.aborted) return;
        setTags(payload.items);
        setTagsLoading(false);
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        const message = resolveAdminError(caught, '标签加载失败', onUnauthorized);
        if (!message) return;
        setTagsError('标签加载失败');
        setTagsLoading(false);
      });

    return () => controller.abort();
  }, [onUnauthorized]);

  return { tags, setTags, tagsLoading, tagsError };
}

/** 内容类型与教学阶段都由后端分类表驱动 */
export function useContentCategories() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    listCategories(undefined, controller.signal)
      .then((payload) => {
        if (!controller.signal.aborted) setCategories(payload.items);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  return categories;
}

/** 修订历史；refresh 用于保存、回滚、提交后重新拉取 */
export function useRevisionHistory(id: string | null) {
  const [revisions, setRevisions] = useState<RevisionItem[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    listRevisions(id, controller.signal)
      .then((payload) => {
        if (!controller.signal.aborted) setRevisions(payload.items);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [id, tick]);

  function refresh() {
    setTick((value) => value + 1);
  }

  return { revisions, refresh };
}
