interface PagerProps {
  page: number;
  totalPages: number;
  /** 总数，传入后显示「共 N 条」 */
  total?: number;
  /** 总数单位，默认「条」 */
  unit?: string;
  loading?: boolean;
  /** 自定义左侧文案，优先级高于 total */
  infoText?: string;
  /** 只有一页时隐藏，默认始终显示 */
  hideOnSinglePage?: boolean;
  onChange: (page: number) => void;
}

/** 列表页统一分页条 */
export function Pager({
  page,
  totalPages,
  total,
  unit = '条',
  loading = false,
  infoText,
  hideOnSinglePage = false,
  onChange,
}: PagerProps) {
  if (hideOnSinglePage && totalPages <= 1) return null;

  const info =
    infoText ??
    (total === undefined
      ? `第 ${page} / ${totalPages} 页`
      : `第 ${page} / ${totalPages} 页 · 共 ${total} ${unit}`);

  return (
    <div className="xw-pager">
      <span className="xw-pager__info">{info}</span>
      <div className="xw-pager__nav">
        <button
          type="button"
          className="xw-btn xw-btn--ghost xw-btn--sm"
          disabled={page <= 1 || loading}
          onClick={() => onChange(page - 1)}
        >
          上一页
        </button>
        <button
          type="button"
          className="xw-btn xw-btn--ghost xw-btn--sm"
          disabled={page >= totalPages || loading}
          onClick={() => onChange(page + 1)}
        >
          下一页
        </button>
      </div>
    </div>
  );
}
