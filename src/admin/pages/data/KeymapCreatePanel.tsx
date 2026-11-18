import { useState } from 'react';
import type { FormEvent } from 'react';
import { versionLabel } from '../../lib/versions';
import type { ExampleDraft, RootDraft } from '../../lib/data-api';
import type { WubiVersion } from '../../types';

const EMPTY_ROOT: RootDraft = { key: '', mnemonic: '', roots: '', note: '' };
const EMPTY_EXAMPLE: ExampleDraft = { char: '', code: '', roots: '', note: '' };

interface KeymapCreatePanelProps {
  tab: 'roots' | 'examples';
  version: WubiVersion;
  /** 返回 true 表示保存成功，表单才清空草稿 */
  onCreateRoot: (draft: RootDraft) => Promise<boolean>;
  onCreateExample: (draft: ExampleDraft) => Promise<boolean>;
}

/** 字根与例字的单条新增表单，草稿与提交状态由组件内部维护 */
export function KeymapCreatePanel({
  tab,
  version,
  onCreateRoot,
  onCreateExample,
}: KeymapCreatePanelProps) {
  const [rootDraft, setRootDraft] = useState<RootDraft>(EMPTY_ROOT);
  const [exampleDraft, setExampleDraft] = useState<ExampleDraft>(EMPTY_EXAMPLE);
  const [creating, setCreating] = useState(false);

  async function handleCreateRoot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creating) return;

    setCreating(true);
    try {
      if (await onCreateRoot(rootDraft)) setRootDraft(EMPTY_ROOT);
    } finally {
      setCreating(false);
    }
  }

  async function handleCreateExample(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creating) return;

    setCreating(true);
    try {
      if (await onCreateExample(exampleDraft)) setExampleDraft(EMPTY_EXAMPLE);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="xw-panel">
      <div className="xw-panel__head">
        <h2 className="xw-panel__title">
          新增{tab === 'roots' ? '字根' : '例字'} · {versionLabel(version)}
        </h2>
      </div>

      {tab === 'roots' ? (
        <form className="xw-keymap__form" onSubmit={handleCreateRoot}>
          <input
            className="xw-input xw-keymap__key"
            placeholder="键位 A-Y"
            maxLength={1}
            required
            value={rootDraft.key}
            disabled={creating}
            onChange={(event) =>
              setRootDraft((draft) => ({ ...draft, key: event.target.value.toUpperCase() }))
            }
          />
          <input
            className="xw-input"
            placeholder="口诀"
            maxLength={120}
            value={rootDraft.mnemonic}
            disabled={creating}
            onChange={(event) =>
              setRootDraft((draft) => ({ ...draft, mnemonic: event.target.value }))
            }
          />
          <input
            className="xw-input"
            placeholder="字根，用逗号分隔"
            maxLength={300}
            value={rootDraft.roots}
            disabled={creating}
            onChange={(event) =>
              setRootDraft((draft) => ({ ...draft, roots: event.target.value }))
            }
          />
          <input
            className="xw-input"
            placeholder="备注（可选）"
            maxLength={500}
            value={rootDraft.note}
            disabled={creating}
            onChange={(event) => setRootDraft((draft) => ({ ...draft, note: event.target.value }))}
          />
          <button
            type="submit"
            className="xw-btn xw-btn--primary xw-btn--sm"
            disabled={creating || !rootDraft.key.trim()}
          >
            {creating ? '保存中…' : '新增'}
          </button>
        </form>
      ) : (
        <form className="xw-keymap__form" onSubmit={handleCreateExample}>
          <input
            className="xw-input xw-keymap__key"
            placeholder="例字"
            maxLength={1}
            required
            value={exampleDraft.char}
            disabled={creating}
            onChange={(event) =>
              setExampleDraft((draft) => ({ ...draft, char: event.target.value }))
            }
          />
          <input
            className="xw-input xw-keymap__code"
            placeholder="编码"
            maxLength={8}
            required
            value={exampleDraft.code}
            disabled={creating}
            onChange={(event) =>
              setExampleDraft((draft) => ({ ...draft, code: event.target.value.toUpperCase() }))
            }
          />
          <input
            className="xw-input"
            placeholder="拆解，用逗号分隔"
            maxLength={300}
            value={exampleDraft.roots}
            disabled={creating}
            onChange={(event) =>
              setExampleDraft((draft) => ({ ...draft, roots: event.target.value }))
            }
          />
          <input
            className="xw-input"
            placeholder="备注（可选）"
            maxLength={500}
            value={exampleDraft.note}
            disabled={creating}
            onChange={(event) =>
              setExampleDraft((draft) => ({ ...draft, note: event.target.value }))
            }
          />
          <button
            type="submit"
            className="xw-btn xw-btn--primary xw-btn--sm"
            disabled={creating || !exampleDraft.char.trim() || !exampleDraft.code.trim()}
          >
            {creating ? '保存中…' : '新增'}
          </button>
        </form>
      )}
    </div>
  );
}
