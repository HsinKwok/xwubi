import type { Context } from 'hono';
import type { ContentTypeOption, SiteConfig } from '../../shared/site-config';
import { escapeHtml, markdownToText, renderMarkdown, stripDuplicateTitle } from '../../shared/markdown';
import type { ContentRow } from './content';
import { loadPublishedContent } from './content';
import type { AppEnv } from './env';
import { loadSiteSettings, normalizeVersion } from './settings';
import { loadSiteTaxonomy } from './site-taxonomy';

/** 片段的缓存时长，与公开内容接口保持一致；KV 的 expirationTtl 最小为 60 秒 */
const FRAGMENT_TTL = 300;

/** KV 中片段键的前缀，与媒体等其他缓存区分 */
const FRAGMENT_PREFIX = 'prerender:';

interface ContentRoute {
  type: ContentTypeOption;
  slug: string;
}

/** 与 HTML 外壳无关的部分：发布或切版本时随 epoch 一起失效 */
interface PrerenderFragment {
  title: string;
  description: string;
  headTags: string;
  /** 头部 + 正文骨架 + 页脚，React 挂载后整体替换 */
  chrome: string;
}

/** 与前台 resolveView 相同的规则：路径前缀命中内容类型，末段为 slug */
function resolveContentRoute(
  pathname: string,
  types: ContentTypeOption[],
): ContentRoute | null {
  const match = types.find((type) => type.route && pathname.startsWith(`${type.route}/`));
  if (!match) return null;

  const raw = pathname
    .slice(match.route.length + 1)
    .split('/')
    .filter(Boolean)
    .pop();
  if (!raw) return null;

  try {
    return { type: match, slug: decodeURIComponent(raw) };
  } catch {
    return { type: match, slug: raw };
  }
}

function buildHeadTags(
  config: SiteConfig,
  row: ContentRow,
  canonical: string,
  description: string,
): string {
  const title = `${row.title} · ${config.brand.name}`;
  const published = row.published_at ?? row.updated_at ?? '';
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: row.title,
    description,
    inLanguage: 'zh-CN',
    ...(published ? { datePublished: published, dateModified: row.updated_at ?? published } : {}),
    mainEntityOfPage: canonical,
  }).replace(/</g, '\\u003c');

  return [
    `<meta property="og:type" content="article" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<script type="application/ld+json">${jsonLd}</script>`,
    `<style>
      .xw-prerender{max-width:760px;margin:0 auto;padding:32px 20px 64px;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;line-height:1.75;color:#1f2328;word-break:break-word}
      .xw-prerender h1{font-size:clamp(24px,4vw,32px);line-height:1.35;margin:6px 0 12px}
      .xw-prerender__type{margin:0;font-size:12px;letter-spacing:.12em;color:#8d6e3f}
      .xw-prerender__summary{margin:0 0 22px;font-size:15px;color:#57606a}
      .xw-prerender__body h2{font-size:20px;margin:28px 0 10px}
      .xw-prerender__body pre{overflow:auto;padding:12px;border-radius:8px;background:#f6f8fa}
      .xw-prerender__body img{max-width:100%;height:auto}
    </style>`,
  ].join('\n');
}

const MOON_ICON =
  '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none"><path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';

const MENU_ICON =
  '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

/** 与 App.tsx 相同的导航高亮规则 */
function activeNavKey(config: SiteConfig, pathname: string): string | undefined {
  return config.nav.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  )?.key;
}

/**
 * 头部骨架：结构、类名与 SiteHeader 保持一致，未登录状态为默认输出。
 * 这段 HTML 只负责首屏绘制，React 挂载后会被真实组件替换。
 */
function buildHeaderChrome(config: SiteConfig, version: string, pathname: string): string {
  const { brand, header, nav, versions } = config;
  const activeNav = activeNavKey(config, pathname);

  const navLinks = nav
    .map(
      (item) =>
        `<a class="site-nav__link" href="${escapeHtml(item.href)}"${
          activeNav === item.key ? ' aria-current="page"' : ''
        }>${escapeHtml(item.label)}</a>`,
    )
    .join('');

  const versionButtons = versions
    .map(
      (item) =>
        `<button type="button" class="site-versions__item${
          version === item.value ? ' is-active' : ''
        }" title="${escapeHtml(item.note ?? item.label)}" aria-pressed="${
          version === item.value
        }">${escapeHtml(item.label)}</button>`,
    )
    .join('');

  return `<header class="site-header"><div class="site-header__inner"><a class="site-brand" href="/"><span class="site-brand__mark" aria-hidden="true"><img src="/logo.png" alt="" width="34" height="34" /></span><span class="site-brand__text"><span class="site-brand__name">${escapeHtml(
    brand.name,
  )}</span><span class="site-brand__tagline">${escapeHtml(
    brand.tagline,
  )}</span></span></a><nav class="site-nav" aria-label="${escapeHtml(
    brand.name,
  )}">${navLinks}</nav><div class="site-header__tools"><div class="site-versions" role="group" aria-label="${escapeHtml(
    header.versionLabel,
  )}">${versionButtons}</div><button type="button" class="site-icon-btn" aria-label="${escapeHtml(
    header.themeLabel,
  )}" title="${escapeHtml(header.themeLabel)}">${MOON_ICON}</button><a class="site-header__login" href="/login">${escapeHtml(
    header.loginLabel,
  )}</a><button type="button" class="site-icon-btn site-header__menu-btn" aria-label="${escapeHtml(
    header.menuLabel,
  )}" aria-expanded="false">${MENU_ICON}</button></div></div></header>`;
}

/** 页脚骨架：与 SiteFooter 输出的结构一致 */
function buildFooterChrome(config: SiteConfig): string {
  const { brand, footer } = config;
  const columns = footer.columns
    .map(
      (column) =>
        `<div class="site-footer__column"><p class="site-footer__column-title">${escapeHtml(
          column.title,
        )}</p><ul class="site-footer__links">${column.links
          .map((link) => `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`)
          .join('')}</ul></div>`,
    )
    .join('');

  return `<footer class="site-footer"><div class="site-footer__inner"><div class="site-footer__brand"><span class="site-footer__mark" aria-hidden="true"><img src="/logo.png" alt="" width="28" height="28" /></span><p class="site-footer__tagline">${escapeHtml(
    brand.tagline,
  )}</p><p class="site-footer__note">${escapeHtml(
    footer.note,
  )}</p></div><div class="site-footer__columns">${columns}</div></div><div class="site-footer__bottom"><span>${escapeHtml(
    footer.copyright,
  )}</span><span class="site-footer__mono"><img src="/logo.png" alt="${escapeHtml(
    brand.name,
  )}" width="16" height="16" /></span></div></footer>`;
}

/** 外壳骨架：内容页把正文塞进 main，普通页面留空由 React 填充 */
function buildChrome(
  config: SiteConfig,
  version: string,
  pathname: string,
  body: string,
): string {
  return `<div class="site-shell"><a class="site-skip" href="#site-main">${escapeHtml(
    config.labels.skipToContent ?? '跳到主要内容',
  )}</a>${buildHeaderChrome(config, version, pathname)}<main class="site-main" id="site-main">${body}</main>${buildFooterChrome(
    config,
  )}</div>`;
}

function buildFragment(
  config: SiteConfig,
  row: ContentRow,
  route: ContentRoute,
  canonical: string,
  version: string,
  pathname: string,
): PrerenderFragment {
  // 正文开头重复条目标题时先去掉，保证首屏骨架与 React 渲染后都是单个 h1
  const body = stripDuplicateTitle(row.body_md, row.title);
  const title = `${row.title} · ${config.brand.name}`;
  const description = (row.summary || markdownToText(body)).slice(0, 160);
  const skeleton = `<div class="xw-prerender"><article><p class="xw-prerender__type">${escapeHtml(
    route.type.label,
  )}</p><h1>${escapeHtml(row.title)}</h1>${
    row.summary ? `<p class="xw-prerender__summary">${escapeHtml(row.summary)}</p>` : ''
  }<div class="xw-prerender__body">${renderMarkdown(body)}</div></article></div>`;

  return {
    title,
    description,
    headTags: buildHeadTags(config, row, canonical, description),
    chrome: buildChrome(config, version, pathname, skeleton),
  };
}

/** KV 是跨实例共享的，冷启动节点也能直接命中片段，不再各自回源 D1 */
async function readFragment(
  c: Context<AppEnv>,
  cacheKey: string,
): Promise<PrerenderFragment | null> {
  try {
    return await c.env.CACHE.get<PrerenderFragment>(cacheKey, 'json');
  } catch {
    return null;
  }
}

function cacheFragment(c: Context<AppEnv>, cacheKey: string, fragment: PrerenderFragment): void {
  const write = c.env.CACHE.put(cacheKey, JSON.stringify(fragment), {
    expirationTtl: FRAGMENT_TTL,
  }).catch(() => {});
  try {
    c.executionCtx.waitUntil(write);
  } catch {
    // 非 Worker 运行环境（如脚本内直接调用）忽略缓存写入
  }
}

/**
 * 外壳永远取当前构建产物，避免部署后哈希资源名变化导致旧 HTML 引用不存在的 JS。
 * 每次注入的只是缓存里的外壳骨架与正文，不重复查库与渲染 Markdown。
 */
async function injectIntoShell(
  c: Context<AppEnv>,
  rootHtml: string,
  head?: { title: string; description: string; headTags: string },
): Promise<Response | null> {
  const assetUrl = new URL(c.req.url);
  assetUrl.pathname = '/site.html';
  assetUrl.search = '';
  const shell = await c.env.ASSETS.fetch(
    new Request(assetUrl.toString(), { headers: { Accept: 'text/html' } }),
  );
  if (!shell.ok) return null;

  let html = await shell.text();
  if (head) {
    html = html
      .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(head.title)}</title>`)
      .replace(
        /<meta\s+name="description"[^>]*>/i,
        `<meta name="description" content="${escapeHtml(head.description)}" />`,
      )
      .replace('</head>', `${head.headTags}\n</head>`);
  }
  html = html.replace('<div id="site-root"></div>', `<div id="site-root">${rootHtml}</div>`);

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // 与普通外壳一致：HTML 不共享缓存，保证部署后立刻引用新的资源名
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}

/**
 * 内容页预渲染：抓取与首屏渲染同一份已发布内容，注入标题、描述与正文骨架。
 * React 挂载后会用真实组件替换这段骨架，因此无需 hydration 对齐。
 * 非内容页、未发布或查询失败时返回 null，由调用方回退到普通 SPA 外壳。
 */
export async function prerenderContentPage(c: Context<AppEnv>): Promise<Response | null> {
  if (c.req.method !== 'GET') return null;

  const url = new URL(c.req.url);
  if (url.pathname === '/') return null;

  let settings;
  let taxonomy;
  try {
    [settings, taxonomy] = await Promise.all([
      loadSiteSettings(c.env),
      loadSiteTaxonomy(c.env),
    ]);
  } catch {
    return null;
  }

  const route = resolveContentRoute(url.pathname, taxonomy.types);
  if (!route) return null;

  const version = normalizeVersion(c.req.query('version'), settings.config);
  // 版本与 epoch 都进入缓存键：发布或切换版本后自然失效
  const cacheKey = `${FRAGMENT_PREFIX}${url.origin}${url.pathname}?epoch=${settings.epoch}&version=${encodeURIComponent(
    version,
  )}`;

  let fragment = await readFragment(c, cacheKey);
  if (!fragment) {
    let row: ContentRow | null;
    try {
      row = await loadPublishedContent(c.env, route.type.slug, route.slug, version);
    } catch {
      return null;
    }
    if (!row) return null;

    fragment = buildFragment(
      settings.config,
      row,
      route,
      `${url.origin}${url.pathname}`,
      version,
      url.pathname,
    );
    cacheFragment(c, cacheKey, fragment);
  }

  return injectIntoShell(c, fragment.chrome, fragment);
}

/**
 * 普通页面外壳：只注入头部与页脚，正文留给 React。
 * 这样首页、合集页在 JS 执行前就已有完整导航与页脚，不会整页下移。
 */
export async function prerenderSiteShell(c: Context<AppEnv>): Promise<Response | null> {
  if (c.req.method !== 'GET') return null;

  let settings;
  try {
    settings = await loadSiteSettings(c.env);
  } catch {
    return null;
  }

  const url = new URL(c.req.url);
  const version = normalizeVersion(c.req.query('version'), settings.config);
  return injectIntoShell(c, buildChrome(settings.config, version, url.pathname, ''));
}
