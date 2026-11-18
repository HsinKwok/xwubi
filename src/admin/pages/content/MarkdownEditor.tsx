import { useEffect, useRef, useState } from 'react';
import { renderMarkdown } from '../../../site/lib/markdown';
import type { MediaItem } from '../../lib/media-api';
import { MediaPicker } from '../media/MediaPicker';
import '../../styles/markdown.css';

export interface MarkdownEditorProps {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

interface ToolButton {
  key: string;
  label: string;
  title: string;
  run: () => void;
}

export function MarkdownEditor({ value, disabled = false, onChange }: MarkdownEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);
  const [html, setHtml] = useState('');
  const [rendering, setRendering] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const savedRange = useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  useEffect(() => {
    if (!preview) return;
    let cancelled = false;
    setRendering(true);
    renderMarkdown(value)
      .then((result) => {
        if (cancelled) return;
        setHtml(result);
        setRendering(false);
      })
      .catch(() => {
        if (!cancelled) setRendering(false);
      });
    return () => {
      cancelled = true;
    };
  }, [preview, value]);

  function apply(next: string, caret: number) {
    onChange(next);
    window.requestAnimationFrame(() => {
      const node = ref.current;
      if (!node) return;
      node.focus();
      node.setSelectionRange(caret, caret);
    });
  }

  function wrap(before: string, after: string, placeholder: string) {
    const node = ref.current;
    if (!node || disabled) return;
    const start = node.selectionStart;
    const end = node.selectionEnd;
    const selected = value.slice(start, end) || placeholder;
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(next);
    const selectFrom = start + before.length;
    window.requestAnimationFrame(() => {
      node.focus();
      node.setSelectionRange(selectFrom, selectFrom + selected.length);
    });
  }

  function prefixLines(prefix: string, numbered = false) {
    const node = ref.current;
    if (!node || disabled) return;
    const start = node.selectionStart;
    const end = node.selectionEnd;
    const lineStart = value.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
    const lineBreak = value.indexOf('\n', end);
    const blockEnd = lineBreak === -1 ? value.length : lineBreak;
    const block = value.slice(lineStart, blockEnd);
    const lines = block.split('\n');
    const numberedPattern = /^\d+\.\s/;
    const isActive = lines.every((line) =>
      numbered ? numberedPattern.test(line) : line.startsWith(prefix),
    );

    const nextBlock = lines
      .map((line, index) => {
        if (isActive) {
          return numbered ? line.replace(numberedPattern, '') : line.slice(prefix.length);
        }
        return numbered ? `${index + 1}. ${line}` : `${prefix}${line}`;
      })
      .join('\n');

    const next = value.slice(0, lineStart) + nextBlock + value.slice(blockEnd);
    apply(next, lineStart + nextBlock.length);
  }

  function insertBlock(text: string) {
    const node = ref.current;
    if (!node || disabled) return;
    const start = node.selectionStart;
    const end = node.selectionEnd;
    apply(value.slice(0, start) + text + value.slice(end), start + text.length);
  }

  function openPicker() {
    const node = ref.current;
    savedRange.current = node
      ? { start: node.selectionStart, end: node.selectionEnd }
      : { start: value.length, end: value.length };
    setPickerOpen(true);
  }

  function insertImage(item: MediaItem) {
    const { start, end } = savedRange.current;
    const label = item.alt.trim() || item.filename.replace(/\.[^.]+$/, '') || '图片';
    const snippet = `![${label}](${item.url})`;
    const next = value.slice(0, start) + snippet + value.slice(end);
    apply(next, start + snippet.length);
    setPickerOpen(false);
  }

  const tools: ToolButton[] = [
    { key: 'h2', label: 'H2', title: '小标题', run: () => prefixLines('## ') },
    { key: 'bold', label: 'B', title: '粗体', run: () => wrap('**', '**', '粗体文字') },
    { key: 'italic', label: 'I', title: '斜体', run: () => wrap('*', '*', '斜体文字') },
    { key: 'ul', label: '• 列表', title: '无序列表', run: () => prefixLines('- ') },
    { key: 'ol', label: '1. 列表', title: '有序列表', run: () => prefixLines('', true) },
    { key: 'quote', label: '引用', title: '引用', run: () => prefixLines('> ') },
    { key: 'code', label: '</>', title: '行内代码', run: () => wrap('`', '`', '代码') },
    {
      key: 'codeblock',
      label: '代码块',
      title: '代码块',
      run: () => insertBlock('\n```\n代码\n```\n'),
    },
    {
      key: 'link',
      label: '链接',
      title: '插入链接',
      run: () => wrap('[', '](https://)', '链接文字'),
    },
    { key: 'image', label: '图片', title: '插入媒体库图片', run: openPicker },
    { key: 'hr', label: '分隔线', title: '分隔线', run: () => insertBlock('\n\n---\n\n') },
  ];

  const chars = value.replace(/\s/g, '').length;

  return (
    <>
      <div className="xw-md">
      <div className="xw-md__bar">
        <div className="xw-md__tools">
          {!preview &&
            tools.map((tool) => (
              <button
                type="button"
                key={tool.key}
                className="xw-md__btn"
                title={tool.title}
                disabled={disabled}
                onClick={tool.run}
              >
                {tool.label}
              </button>
            ))}
        </div>
        <span className="xw-md__spacer" />
        <span className="xw-md__count">{chars} 字</span>
        <button
          type="button"
          className="xw-btn xw-btn--ghost xw-btn--sm"
          disabled={disabled}
          onClick={() => setPreview((open) => !open)}
        >
          {preview ? '返回编辑' : '预览'}
        </button>
      </div>

      {preview ? (
        rendering ? (
          <p className="xw-field__hint">正在生成预览…</p>
        ) : html.trim() ? (
          <div className="xw-md__preview" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <p className="xw-field__hint">还没有正文内容。</p>
        )
      ) : (
        <textarea
          ref={ref}
          className="xw-textarea xw-textarea--code"
          rows={18}
          value={value}
          disabled={disabled}
          placeholder={'## 小标题\n\n- 要点一\n- 要点二'}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      </div>

      <MediaPicker
        open={pickerOpen}
        allowUpload={!disabled}
        onClose={() => setPickerOpen(false)}
        onSelect={insertImage}
      />
    </>
  );
}
