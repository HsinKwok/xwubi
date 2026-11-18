interface RowActionsProps {
  canWrite: boolean;
  editing: boolean;
  saving: boolean;
  deleting: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onDelete: () => void;
}

/** 码表表格行的操作区：只读提示或编辑、保存、取消、删除按钮 */
export function RowActions(props: RowActionsProps) {
  const { canWrite, editing, saving, deleting } = props;

  if (!canWrite) return <span className="xw-toolbar__count">只读</span>;

  if (editing) {
    return (
      <div className="xw-table__actions">
        <button
          type="button"
          className="xw-btn xw-btn--primary xw-btn--sm"
          disabled={saving}
          onClick={props.onSave}
        >
          {saving ? '保存中…' : '保存'}
        </button>
        <button
          type="button"
          className="xw-btn xw-btn--ghost xw-btn--sm"
          disabled={saving}
          onClick={props.onCancel}
        >
          取消
        </button>
      </div>
    );
  }

  return (
    <div className="xw-table__actions">
      <button type="button" className="xw-btn xw-btn--ghost xw-btn--sm" onClick={props.onEdit}>
        编辑
      </button>
      <button
        type="button"
        className="xw-btn xw-btn--ghost xw-btn--sm"
        disabled={deleting}
        onClick={props.onDelete}
      >
        {deleting ? '删除中…' : '删除'}
      </button>
    </div>
  );
}
