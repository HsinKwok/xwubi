import { marked } from 'marked';

/** 正文来源是后台 Markdown，渲染前统一转义，避免拼出可执行的 HTML */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}

/** marked 解析失败时的最小渲染，保证正文仍然可读 */
function fallbackRender(source: string): string {
  return source
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';

      const heading = /^(#{1,4})\s+(.*)$/.exec(trimmed);
      if (heading) {
        const level = heading[1].length;
        return `<h${level}>${escapeHtml(heading[2])}</h${level}>`;
      }

      if (/^[-*]\s+/m.test(trimmed)) {
        const items = trimmed
          .split('\n')
          .map((line) => line.replace(/^[-*]\s+/, '').trim())
          .filter(Boolean)
          .map((line) => `<li>${escapeHtml(line)}</li>`)
          .join('');
        return `<ul>${items}</ul>`;
      }

      return `<p>${escapeHtml(trimmed).replace(/\n/g, '<br />')}</p>`;
    })
    .join('');
}

/** 站点正文渲染：前台按需 chunk 加载，Worker 预渲染直接复用同一实现 */
export function renderMarkdown(source: string): string {
  try {
    const rendered = marked.parse(source, { async: false });
    return typeof rendered === 'string' ? rendered : fallbackRender(source);
  } catch {
    return fallbackRender(source);
  }
}

function normalizeHeading(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/**
 * 正文常把条目标题重复写成开头的一级标题，渲染前去掉，
 * 避免页头 h1 与正文 h1 并排出现两次。标题不一致时保持原样。
 */
export function stripDuplicateTitle(source: string, title: string): string {
  const trimmed = source.replace(/^\s+/, '');
  const match = /^#\s+(.+?)\s*#*\s*(?:\r?\n|$)/.exec(trimmed);
  if (!match) return source;

  const heading = normalizeHeading(match[1]);
  const pageTitle = normalizeHeading(title);
  if (!heading) return source;

  // 兼容「页面标题带版本后缀、正文只写主标题」的写法
  const duplicated =
    heading === pageTitle ||
    pageTitle.startsWith(`${heading}（`) ||
    pageTitle.startsWith(`${heading}(`);
  if (!duplicated) return source;

  return trimmed.slice(match[0].length).replace(/^\r?\n/, '');
}

/** 从 Markdown 提取纯文本摘要，用于 meta description */
export function markdownToText(source: string, limit = 120): string {
  const text = source
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_>`~#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > limit ? `${text.slice(0, limit)}…` : text;
}
