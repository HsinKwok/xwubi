export const PAGE_SIZES = [50, 100, 200] as const;

export type KeymapPageSize = (typeof PAGE_SIZES)[number];

interface KeymapPagerProps {
  page: number;
  pageSize: KeymapPageSize;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: KeymapPageSize) => void;
}

/** 例字库分页条：每页数量与上一页/下一页 */
export function KeymapPager({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: KeymapPagerProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);

  return (
    <div className="xw-pager">
      <label className="xw-pager__size">
        每页
        <select
          className="xw-select"
          aria-label="每页显示数量"
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value) as KeymapPageSize)}
        >
          {PAGE_SIZES.map((size) => (
            <option value={size} key={size}>
              {size} 条
            </option>
          ))}
        </select>
      </label>
      <div className="xw-pager__nav">
        <button
          type="button"
          className="xw-btn xw-btn--ghost xw-btn--sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          上一页
        </button>
        <span className="xw-pager__info">
          第 {currentPage} / {totalPages} 页
        </span>
        <button
          type="button"
          className="xw-btn xw-btn--ghost xw-btn--sm"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          下一页
        </button>
      </div>
    </div>
  );
}
