import { useEffect, useMemo, useState } from 'react';
import { resolveAdminError } from '../../lib/api';
import { useAsyncData } from '../../lib/use-async-data';
import { listCategories } from '../../lib/categories-api';
import type { CategoryItem } from '../../lib/categories-api';
import {
  createPracticeText,
  deletePracticeText,
  getPracticeText,
  listPracticeTexts,
  updatePracticeText,
} from '../../lib/practice-api';
import type { PracticeTextListPayload, PracticeTextSummary } from '../../lib/practice-api';
import {
  EMPTY_PRACTICE_TEXT_FORM,
  countHan,
  type PracticeTextEditorState,
  type PracticeTextForm,
} from './practice-text-utils';

const PAGE_SIZE = 50;

interface Options {
  canWrite: boolean;
  onUnauthorized: () => void;
}

/**
 * 文章跟打篇目管理的数据与操作逻辑：分类、列表、筛选分页、编辑器与增删改。
 */
export function usePracticeTexts({ canWrite, onUnauthorized }: Options) {
  const [genres, setGenres] = useState<CategoryItem[]>([]);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const [query, setQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState('all');
  const [page, setPage] = useState(1);

  const [editor, setEditor] = useState<PracticeTextEditorState | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, setData, loading, error, reload } = useAsyncData<PracticeTextListPayload>(
    (signal) => listPracticeTexts(signal),
    { queryKey: 'practice-texts', fallback: '篇目加载失败', onUnauthorized },
  );
  const items = data?.items ?? [];

  useEffect(() => {
    const controller = new AbortController();

    listCategories('practice_genre', controller.signal)
      .then((payload) => {
        if (controller.signal.aborted) return;
        setGenres(payload.items);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setNotice({ kind: 'error', text: '分类加载失败，请稍后重试' });
      });

    return () => controller.abort();
  }, []);

  const genreLabel = (slug: string) =>
    genres.find((item) => item.slug === slug)?.label ?? slug;

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return items.filter((item) => {
      if (genreFilter !== 'all' && item.genre !== genreFilter) return false;
      if (!keyword) return true;
      return [item.title, item.author, item.dynasty].some((value) =>
        value.toLowerCase().includes(keyword),
      );
    });
  }, [items, query, genreFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  /** 搜索或筛选变化后回到第一页 */
  function changeQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  function changeGenreFilter(value: string) {
    setGenreFilter(value);
    setPage(1);
  }

  function updateForm(patch: Partial<PracticeTextForm>) {
    setEditor((previous) =>
      previous ? { ...previous, form: { ...previous.form, ...patch } } : previous,
    );
  }

  function startCreate() {
    if (!canWrite) return;
    setNotice(null);
    setEditor({
      id: null,
      loading: false,
      form: { ...EMPTY_PRACTICE_TEXT_FORM, genre: genres[0]?.slug ?? '' },
    });
  }

  async function startEdit(item: PracticeTextSummary) {
    if (!canWrite) return;
    setNotice(null);
    setEditor({
      id: item.id,
      loading: true,
      form: {
        title: item.title,
        author: item.author,
        dynasty: item.dynasty,
        genre: item.genre,
        sort_order: String(item.sort_order),
        body: '',
      },
    });

    try {
      const payload = await getPracticeText(item.id);
      setEditor((previous) =>
        previous && previous.id === item.id
          ? {
              id: item.id,
              loading: false,
              form: {
                title: payload.item.title,
                author: payload.item.author,
                dynasty: payload.item.dynasty,
                genre: payload.item.genre,
                sort_order: String(payload.item.sort_order),
                body: payload.item.body,
              },
            }
          : previous,
      );
    } catch (caught) {
      const message = resolveAdminError(caught, '篇目加载失败', onUnauthorized);
      if (!message) return;
      setEditor(null);
      setNotice({ kind: 'error', text: message });
    }
  }

  async function handleSave() {
    if (!editor || !canWrite || saving) return;

    const title = editor.form.title.trim();
    const body = editor.form.body.trim();
    if (!title || !body) {
      setNotice({ kind: 'error', text: '标题和正文不能为空' });
      return;
    }
    if (!genres.some((item) => item.slug === editor.form.genre)) {
      setNotice({ kind: 'error', text: '请选择有效的篇目分类' });
      return;
    }

    const payload = {
      title,
      author: editor.form.author.trim(),
      dynasty: editor.form.dynasty.trim(),
      genre: editor.form.genre,
      body,
      sort_order: Number(editor.form.sort_order) || 0,
    };

    setSaving(true);
    try {
      if (editor.id) {
        await updatePracticeText(editor.id, payload);
        setNotice({ kind: 'ok', text: `已更新《${title}》` });
      } else {
        await createPracticeText(payload);
        setNotice({ kind: 'ok', text: `已创建《${title}》` });
      }
      setEditor(null);
      reload();
    } catch (caught) {
      const message = resolveAdminError(caught, '保存失败', onUnauthorized);
      if (!message) return;
      setNotice({ kind: 'error', text: message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: PracticeTextSummary) {
    if (!canWrite || deletingId) return;
    if (!window.confirm(`确定删除《${item.title}》？删除后前台文章跟打将不再显示该篇目。`)) return;

    setDeletingId(item.id);
    try {
      await deletePracticeText(item.id);
      setData((previous) =>
        previous
          ? { ...previous, items: previous.items.filter((row) => row.id !== item.id) }
          : previous,
      );
      if (editor?.id === item.id) setEditor(null);
      setNotice({ kind: 'ok', text: `已删除《${item.title}》` });
    } catch (caught) {
      const message = resolveAdminError(caught, '删除失败', onUnauthorized);
      if (!message) return;
      setNotice({ kind: 'error', text: message });
    } finally {
      setDeletingId(null);
    }
  }

  return {
    genres,
    notice,
    setNotice,
    query,
    changeQuery,
    genreFilter,
    changeGenreFilter,
    setPage,
    editor,
    setEditor,
    saving,
    deletingId,
    loading,
    error,
    reload,
    items,
    filtered,
    totalPages,
    currentPage,
    pageStart,
    pageItems,
    genreLabel,
    bodyChars: editor ? countHan(editor.form.body) : 0,
    updateForm,
    startCreate,
    startEdit,
    handleSave,
    handleDelete,
  };
}
