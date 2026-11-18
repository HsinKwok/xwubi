import type { AdminContentItem } from '../../lib/content-api';
import { formatDate } from './editor-format';

export interface VerifyPanelProps {
  item: AdminContentItem | null;
  canEdit: boolean;
  pending: string | null;
  onVerify: () => void;
}

export function VerifyPanel({ item, canEdit, pending, onVerify }: VerifyPanelProps) {
  return (
    <section className="xw-panel">
      <div className="xw-panel__head">
        <h2 className="xw-panel__title">人工核对</h2>
      </div>
      <div className="xw-panel__body xw-form">
        <p className="xw-field__hint">
          {item?.verified_at ? `最近核对：${formatDate(item.verified_at)}` : '尚未标记人工核对。'}
        </p>
        <button
          type="button"
          className="xw-btn xw-btn--ghost xw-btn--sm"
          disabled={!canEdit || !item || pending !== null}
          onClick={onVerify}
        >
          {pending === 'verify' ? '标记中…' : '标记已核对'}
        </button>

        <ul className="xw-checklist">
          <li>教学：至少 3 条例字，且已核对。</li>
          <li>软件：至少 1 个平台，且已核对。</li>
          <li>资讯：填写原文链接。</li>
        </ul>
      </div>
    </section>
  );
}
