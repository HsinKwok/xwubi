import { useState } from 'react';
import { Icon } from '../../components/icons';
import { NoticeBar } from '../../components/NoticeBar';
import { useAsyncData } from '../../lib/use-async-data';
import { listCategories } from '../../lib/categories-api';
import type { CategoryItem } from '../../lib/categories-api';
import { listTags } from '../../lib/content-api';
import type { TagItem } from '../../lib/content-api';
import type { AdminUser } from '../../types';
import { CategoryEditor } from './CategoryEditor';
import { CategoryTable } from './CategoryTable';
import { TagPanel } from './TagPanel';
import { GROUPS, GROUP_DOMAINS, type Group } from './category-config';
import { useTaxonomyCategories } from './use-taxonomy-categories';
import type { TaxonomyNotice } from './use-taxonomy-categories';
import { useTaxonomyTags } from './use-taxonomy-tags';

export interface CategoriesPageProps {
  user: AdminUser;
  onUnauthorized: () => void;
}

/** 分类页一次加载分类与标签两份配置 */
interface TaxonomyData {
  items: CategoryItem[];
  tags: TagItem[];
}

export function CategoriesPage({ user, onUnauthorized }: CategoriesPageProps) {
  const canWrite = user.role === 'admin';

  const [group, setGroup] = useState<Group>('content');
  const [notice, setNotice] = useState<TaxonomyNotice | null>(null);

  const { data, setData, loading, error, reload } = useAsyncData<TaxonomyData>(
    async (signal) => {
      const [categoryPayload, tagPayload] = await Promise.all([
        listCategories(undefined, signal),
        listTags(signal),
      ]);
      return { items: categoryPayload.items, tags: tagPayload.items };
    },
    {
      queryKey: 'taxonomy',
      enabled: canWrite,
      fallback: '分类与标签加载失败',
      onUnauthorized,
    },
  );
  const items = data?.items ?? [];
  const tags = data?.tags ?? [];

  function updateItems(updater: (rows: CategoryItem[]) => CategoryItem[]) {
    setData((previous) => (previous ? { ...previous, items: updater(previous.items) } : previous));
  }

  function updateTags(updater: (rows: TagItem[]) => TagItem[]) {
    setData((previous) => (previous ? { ...previous, tags: updater(previous.tags) } : previous));
  }

  const categories = useTaxonomyCategories({
    canWrite,
    items,
    setItems: updateItems,
    setNotice,
    onUnauthorized,
  });

  const tagEditor = useTaxonomyTags({
    canWrite,
    setTags: updateTags,
    setNotice,
    onUnauthorized,
  });

  // 分类与标签属于站点级配置，仅管理员可进入
  if (!canWrite) {
    return (
      <div className="xw-content">
        <header className="xw-content__head">
          <div>
            <p className="xw-content__eyebrow">TAXONOMY</p>
            <h1 className="xw-content__title">分类与标签</h1>
            <p className="xw-content__desc">统一维护内容类型、分类、码表与标签。</p>
          </div>
        </header>

        <div className="xw-panel">
          <div className="xw-empty">
            <Icon name="shield" size={22} />
            <p>仅管理员可以访问分类与标签</p>
            <p className="xw-field__hint">
              如需调整内容类型、分类或标签，请联系管理员。
            </p>
          </div>
        </div>
      </div>
    );
  }

  const activeGroup = GROUPS.find((item) => item.key === group)!;
  const domainList = group === 'tags' ? [] : GROUP_DOMAINS[group];

  return (
    <div className="xw-content">
      <header className="xw-content__head">
        <div>
          <p className="xw-content__eyebrow">TAXONOMY</p>
          <h1 className="xw-content__title">分类与标签</h1>
          <p className="xw-content__desc">
            三层结构：内容类型 → 分类（单选）→ 标签（多选）。前台筛选与发布选项都读取这里的配置。
          </p>
        </div>
      </header>

      <NoticeBar notice={notice} onClose={() => setNotice(null)} />

      <div className="xw-tabs" role="tablist">
        {GROUPS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={group === item.key}
            className={`xw-tabs__item${group === item.key ? ' is-active' : ''}`}
            onClick={() => {
              setGroup(item.key);
              categories.setEditor(null);
              tagEditor.cancelEditTag();
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <p className="xw-content__desc">{activeGroup.desc}</p>

      {error ? (
        <div className="xw-panel">
          <div className="xw-empty">
            <Icon name="shield" size={22} />
            <p>{error}</p>
            <button
              type="button"
              className="xw-btn xw-btn--ghost xw-btn--sm"
              onClick={reload}
            >
              重试
            </button>
          </div>
        </div>
      ) : group === 'tags' ? (
        <TagPanel
          tags={tags}
          loading={loading}
          newTag={tagEditor.newTag}
          creatingTag={tagEditor.creatingTag}
          editingTagId={tagEditor.editingTagId}
          editTagName={tagEditor.editTagName}
          savingTagId={tagEditor.savingTagId}
          deletingTagId={tagEditor.deletingTagId}
          onNewTagChange={tagEditor.setNewTag}
          onCreate={() => void tagEditor.handleCreateTag()}
          onStartEdit={tagEditor.startEditTag}
          onEditNameChange={tagEditor.setEditTagName}
          onRename={(tag) => void tagEditor.handleRenameTag(tag)}
          onCancelEdit={tagEditor.cancelEditTag}
          onDelete={(tag) => void tagEditor.handleDeleteTag(tag)}
        />
      ) : (
        <>
          {categories.editor && (
            <CategoryEditor
              editor={categories.editor}
              saving={categories.saving}
              onPatch={categories.updateForm}
              onSave={() => void categories.handleSave()}
              onCancel={() => categories.setEditor(null)}
            />
          )}

          {domainList.map((domain) => (
            <CategoryTable
              key={domain}
              domain={domain}
              rows={items.filter((item) => item.domain === domain)}
              loading={loading}
              saving={categories.saving}
              deletingId={categories.deletingId}
              onStartCreate={categories.startCreate}
              onEdit={categories.startEdit}
              onDelete={(item) => void categories.handleDelete(item)}
            />
          ))}
        </>
      )}
    </div>
  );
}
