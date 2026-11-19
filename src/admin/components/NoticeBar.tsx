export interface NoticeLike {
  tone?: 'ok' | 'error';
  kind?: 'ok' | 'error';
  text: string;
}

interface NoticeBarProps {
  notice: NoticeLike | null;
  /** 传入后显示「关闭」按钮 */
  onClose?: () => void;
}

/** 页面级提示条：统一 tone/kind 两种历史字段 */
export function NoticeBar({ notice, onClose }: NoticeBarProps) {
  if (!notice) return null;
  const tone = notice.tone ?? notice.kind ?? 'ok';

  return (
    <div className={`xw-notice xw-notice--${tone}`} role="status">
      <span>{notice.text}</span>
      {onClose && (
        <button type="button" className="xw-btn xw-btn--ghost xw-btn--sm" onClick={onClose}>
          关闭
        </button>
      )}
    </div>
  );
}
