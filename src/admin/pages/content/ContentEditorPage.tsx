import type { MouseEvent as ReactMouseEvent } from 'react';
import { Icon } from '../../components/icons';
import '../../styles/content.css';
import type { AdminUser } from '../../types';
import { EditorHeader } from './EditorHeader';
import { EditorMainPanels } from './EditorMainPanels';
import { PublishSettingsPanel } from './PublishSettingsPanel';
import { RevisionPanel } from './RevisionPanel';
import { TagPicker } from './TagPicker';
import { VerifyPanel } from './VerifyPanel';
import { useContentEditor } from './use-content-editor';

export interface ContentEditorPageProps {
  user: AdminUser;
  /** null 表示新建 */
  id: string | null;
  onNavigate: (href: string) => void;
  onUnauthorized: () => void;
}

export function ContentEditorPage({ user, id, onNavigate, onUnauthorized }: ContentEditorPageProps) {
  const {
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
  } = useContentEditor({ user, id, onNavigate, onUnauthorized });

  function go(event: ReactMouseEvent<HTMLAnchorElement>, href: string) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    onNavigate(href);
  }

  if (loading) {
    return (
      <div className="xw-content">
        <p className="xw-content__desc">正在加载内容…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="xw-content">
        <div className="xw-panel">
          <div className="xw-empty">
            <Icon name="shield" size={22} />
            <p>{loadError}</p>
            <div className="xw-empty__actions">
              <button type="button" className="xw-btn xw-btn--ghost xw-btn--sm" onClick={reload}>
                重新加载
              </button>
              <a
                className="xw-btn xw-btn--ghost xw-btn--sm"
                href="/admin/content"
                onClick={(event) => go(event, '/admin/content')}
              >
                返回列表
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const contentTypes = categories
    .filter((category) => category.domain === 'content_type')
    .map((category) => ({
      slug: category.slug,
      label: category.label,
      route: category.route,
    }));
  const stages = categories
    .filter((category) => category.domain === 'lesson_stage')
    .map((category) => ({ slug: category.slug, label: category.label }));
  const itemRoute = contentTypes.find((type) => type.slug === form.type)?.route;

  const title = item ? item.title : '新建内容';

  return (
    <div className="xw-editor">
      <EditorHeader
        item={item}
        title={title}
        contentTypes={contentTypes}
        itemRoute={itemRoute}
        dirty={dirty}
        pending={pending}
        deleting={deleting}
        canEdit={canEdit}
        canReview={canReview}
        onGo={go}
        onSave={handleSave}
        onSubmit={handleSubmit}
        onPublish={handlePublish}
        onUnpublish={() => handleTransition('unpublish')}
        onArchive={() => handleTransition('archive')}
        onDelete={handleDelete}
      />

      {!canEdit && item && (
        <div className="xw-notice xw-notice--muted" role="status">
          当前角色只能查看与发布，不能修改正文。
        </div>
      )}

      {notice && (
        <div className={`xw-notice xw-notice--${notice.tone}`} role="status">
          <span>{notice.text}</span>
          {conflict && (
            <button type="button" className="xw-btn xw-btn--ghost xw-btn--sm" onClick={reload}>
              重新加载
            </button>
          )}
        </div>
      )}

      {problems.length > 0 && (
        <ul className="xw-problems">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      )}

      <div className="xw-editor__grid">
        <EditorMainPanels
          form={form}
          contentTypes={contentTypes}
          stages={stages}
          canEdit={canEdit}
          onChange={setField}
        />

        <aside className="xw-editor__side">
          <PublishSettingsPanel
            form={form}
            contentTypes={contentTypes}
            canEdit={canEdit}
            isEditing={Boolean(item)}
            role={user.role}
            onChange={setField}
            onChangeType={changeType}
          />

          <section className="xw-panel">
            <div className="xw-panel__head">
              <h2 className="xw-panel__title">标签</h2>
              {form.tagIds.length > 0 && <span className="xw-panel__count">{form.tagIds.length}</span>}
            </div>
            <div className="xw-panel__body xw-form">
              <TagPicker
                tags={tags}
                selected={form.tagIds}
                disabled={!canEdit}
                canCreate={user.role === 'admin'}
                loading={tagsLoading}
                error={tagsError}
                onToggle={toggleTag}
                onCreate={handleCreateTag}
              />
              <span className="xw-field__hint">标签用于前台归档与相关推荐，保存后生效。</span>
            </div>
          </section>

          <VerifyPanel item={item} canEdit={canEdit} pending={pending} onVerify={handleVerify} />

          <RevisionPanel
            revisions={revisions}
            canEdit={canEdit}
            pending={pending}
            restoring={restoring}
            onRestore={handleRestore}
          />
        </aside>
      </div>
    </div>
  );
}
