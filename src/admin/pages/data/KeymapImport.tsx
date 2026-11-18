import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { ImportReport, KeymapKind } from '../../lib/data-api';
import { versionLabel } from '../../lib/versions';
import type { WubiVersion } from '../../types';

const ROOT_TEMPLATE =
  'key,mnemonic,roots,note,sort_order\nG,王旁青头戋五一,"王,旁,青,头,戋,五,一",,1';

const EXAMPLE_TEMPLATE =
  'char,code,roots,note,sort_order\n明,JE,"日,月",,9\n好,VB,"女,子",,10';

const MAX_FILE_BYTES = 200 * 1024;

export interface KeymapImportProps {
  kind: KeymapKind;
  version: WubiVersion;
  importing: boolean;
  report: ImportReport | null;
  onImport: (csv: string) => void;
  onLocalError: (message: string) => void;
}

/** 导入面板自带文本与文件状态，切换类型或版本时由 key 重置 */
export function KeymapImport({
  kind,
  version,
  importing,
  report,
  onImport,
  onLocalError,
}: KeymapImportProps) {
  const [text, setText] = useState('');

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      onLocalError('CSV 文件不能超过 200KB');
      return;
    }
    setText(await file.text());
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim() || importing) return;
    onImport(text);
  }

  return (
    <form className="xw-panel xw-keymap__import" onSubmit={handleSubmit}>
      <div className="xw-panel__head">
        <h2 className="xw-panel__title">
          导入{kind === 'roots' ? '字根' : '例字'} · {versionLabel(version)}
        </h2>
      </div>

      <p className="xw-field__hint">
        {kind === 'roots'
          ? '表头：key,mnemonic,roots,note,sort_order；key 为 A-Y 单字母。'
          : '表头：char,code,roots,note,sort_order；code 为 1-8 位大写字母。'}
        含逗号的字段请用英文引号包裹。
      </p>

      <div className="xw-keymap__import-actions">
        <label className="xw-btn xw-btn--ghost xw-btn--sm">
          选择 CSV 文件
          <input type="file" accept=".csv,text/csv" hidden onChange={handleFileChange} />
        </label>
        <button
          type="button"
          className="xw-btn xw-btn--ghost xw-btn--sm"
          onClick={() => setText(kind === 'roots' ? ROOT_TEMPLATE : EXAMPLE_TEMPLATE)}
        >
          填入模板
        </button>
      </div>

      <textarea
        className="xw-textarea xw-keymap__csv"
        rows={8}
        placeholder="粘贴 CSV 内容…"
        value={text}
        onChange={(event) => setText(event.target.value)}
      />

      <div className="xw-keymap__import-submit">
        <button
          type="submit"
          className="xw-btn xw-btn--primary xw-btn--sm"
          disabled={importing || !text.trim()}
        >
          {importing ? '导入中…' : '开始导入'}
        </button>
      </div>

      {report && (
        <div className="xw-keymap__report">
          <p>
            共 {report.total} 行：新增 {report.inserted}，更新 {report.updated}，跳过{' '}
            {report.skipped}
          </p>
          {report.errors.length > 0 && (
            <ul>
              {report.errors.map((item) => (
                <li key={`${item.line}-${item.message}`}>
                  第 {item.line} 行：{item.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}
