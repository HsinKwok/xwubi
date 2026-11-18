interface MarkedModule {
  marked: { parse(source: string): string };
}

const MARKED_CDN = 'https://cdn.jsdelivr.net/npm/marked@12.0.2/+esm';

let loader: Promise<MarkedModule> | null = null;

function escapeHtml(value: string): string {
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

/** CDN 不可用时的最小渲染，保证正文仍然可读 */
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

export async function renderMarkdown(source: string): Promise<string> {
  try {
    loader ??= import(/* @vite-ignore */ MARKED_CDN) as Promise<MarkedModule>;
    const module = await loader;
    return module.marked.parse(source);
  } catch {
    return fallbackRender(source);
  }
}
