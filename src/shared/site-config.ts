/**
 * 站点配置契约：由后端 site_config 下发，前端只按 kind 渲染，不写死文案与结构。
 * Worker 与浏览器端共用这些类型。
 */

export type ThemeMode = 'light' | 'dark';

export interface ThemePalette {
  brand: string;
  brandStrong: string;
  ink: string;
  inkMuted: string;
  line: string;
  surface: string;
  surfaceMuted: string;
  onBrand: string;
}

export interface SiteTheme {
  light: ThemePalette;
  dark: ThemePalette;
  fonts: { sans: string; mono: string };
  radius: string;
  maxWidth: string;
  defaultMode: ThemeMode;
}

export interface VersionOption {
  value: string;
  label: string;
  note?: string;
}

/** 内容类型：由后台分类表维护，route 决定前台列表与详情的路径前缀 */
export interface ContentTypeOption {
  slug: string;
  label: string;
  route: string;
  sort_order: number;
}

export interface NavItem {
  key: string;
  label: string;
  href: string;
  /** 指向内容类型时，前端把它当集合页处理 */
  collection?: string;
}

export interface ActionLink {
  label: string;
  href: string;
  variant?: 'primary' | 'ghost' | 'text';
}

export interface CollectionFilterOption {
  value: string;
  label: string;
}

export interface CollectionFilter {
  key: string;
  label: string;
  options: CollectionFilterOption[];
}

export interface CollectionMeta {
  eyebrow?: string;
  title: string;
  description?: string;
  filters?: CollectionFilter[];
  empty?: { title: string; description?: string };
}

export interface HeroSection {
  kind: 'hero';
  eyebrow?: string;
  title: string;
  lead?: string;
  actions?: ActionLink[];
  aside?: {
    label?: string;
    items: Array<{ label: string; value: string; hint?: string }>;
  };
}

export interface StatsSection {
  kind: 'stats';
  items: Array<{ label: string; value: string; hint?: string }>;
}

export interface FeatureGridSection {
  kind: 'feature-grid';
  eyebrow?: string;
  title: string;
  description?: string;
  items: Array<{
    title: string;
    description?: string;
    meta?: string;
    href?: string;
    badge?: string;
  }>;
}

export interface CollectionSection {
  kind: 'collection';
  source: string;
  eyebrow?: string;
  title: string;
  description?: string;
  limit?: number;
  more?: { label: string; href: string };
  /** 由后端在响应时填充 */
  items?: PublicContentItem[];
}

export interface StepsSection {
  kind: 'steps';
  eyebrow?: string;
  title: string;
  description?: string;
  /** steps：并排步骤；path：纵向学习路线长卡 */
  variant?: 'steps' | 'path';
  actions?: ActionLink[];
  items: Array<{ label?: string; title: string; description?: string }>;
}

/** 首页混排流：教学 / 资讯 / 软件 / 工具按最近发布时间混合排列 */
export interface FeedSection {
  kind: 'feed';
  eyebrow?: string;
  title: string;
  description?: string;
  /** 参与混排的内容类型与展示文案，缺省使用内置的四类 */
  sources?: Array<{ type: string; label: string }>;
  limit?: number;
  more?: { label: string; href: string };
  /** 由后端在响应时填充 */
  items?: PublicContentItem[];
}

/** 首页右栏：常驻入口卡 + 最近更新列表 */
export interface RailSection {
  kind: 'rail';
  eyebrow?: string;
  cards: Array<{ label?: string; title: string; description?: string; href: string }>;
  recent?: {
    /** 内容类型，缺省 software */
    source?: string;
    title: string;
    limit?: number;
    more?: { label: string; href: string };
    /** 由后端在响应时填充 */
    items?: PublicContentItem[];
  };
}

export interface QuoteSection {
  kind: 'quote';
  text: string;
  attribution?: string;
}

export interface CtaSection {
  kind: 'cta';
  title: string;
  description?: string;
  actions?: ActionLink[];
}

export type SiteSection =
  | HeroSection
  | StatsSection
  | FeatureGridSection
  | CollectionSection
  | FeedSection
  | RailSection
  | StepsSection
  | QuoteSection
  | CtaSection;

export interface PublicContentItem {
  id: string;
  type: string;
  slug: string;
  version: string;
  title: string;
  summary: string;
  stage?: string | null;
  lesson_no?: number | null;
  sort_order?: number;
  published_at?: string | null;
  meta?: Record<string, unknown>;
}

export interface SitePage {
  key: string;
  eyebrow?: string;
  title: string;
  description?: string;
  sections: SiteSection[];
}

export interface SiteFooterColumn {
  title: string;
  links: Array<{ label: string; href: string }>;
}

export interface SiteConfig {
  brand: {
    name: string;
    mark: string;
    tagline: string;
    description: string;
  };
  theme: SiteTheme;
  versions: VersionOption[];
  defaultVersion: string;
  nav: NavItem[];
  header: {
    versionLabel: string;
    loginLabel: string;
    staffLabel: string;
    themeLabel: string;
    menuLabel: string;
    profileLabel?: string;
  };
  home: { sections: SiteSection[] };
  collections: Record<string, CollectionMeta>;
  pages: Record<string, SitePage>;
  footer: {
    note: string;
    columns: SiteFooterColumn[];
    copyright: string;
  };
  labels: Record<string, string>;
}

/** GET /api/site/bootstrap */
export interface BootstrapPayload {
  brand: SiteConfig['brand'];
  theme: SiteTheme;
  versions: VersionOption[];
  defaultVersion: string;
  /** 内容类型，前台据此生成列表页与详情页路由 */
  types: ContentTypeOption[];
  nav: NavItem[];
  header: SiteConfig['header'];
  home: { sections: SiteSection[] };
  collections: Record<string, CollectionMeta>;
  pages: Record<string, SitePage>;
  footer: SiteConfig['footer'];
  labels: Record<string, string>;
  meta: { epoch: number; generatedAt: string; version: string };
}

/** GET /api/site/collection */
export interface CollectionPayload {
  page: CollectionMeta & { type: string; version: string };
  items: PublicContentItem[];
  total: number;
  /** 每页条数；合集页据此判断是否还能「加载更多」 */
  per_page?: number;
  /** 下一页游标；教学等固定长度列表为 null，继续按 page 翻页 */
  next_cursor?: string | null;
}

/** GET /api/site/content/:type/:slug */
export interface ContentPayload {
  chrome: Record<string, string>;
  item: PublicContentItem & {
    body_md: string;
    meta: Record<string, unknown>;
  };
}

/** GET /api/site/page/:key */
export interface StaticPagePayload {
  page: SitePage;
  labels: Record<string, string>;
}

/** 后台统一管理的分类（码表分区 / 文章分类） */
export interface SiteCategory {
  slug: string;
  label: string;
  hint: string;
  /** 码表分区包含的键位；文章分类为空数组 */
  keys: string[];
  sort_order: number;
}

/** 文章练习篇目（列表不带正文） */
export interface PracticeTextSummary {
  id: string;
  title: string;
  author: string;
  dynasty: string;
  genre: string;
  char_count: number;
  sort_order: number;
}

export interface PracticeTextDetail extends PracticeTextSummary {
  body: string;
}

/** GET /api/site/texts */
export interface PracticeTextListPayload {
  items: PracticeTextSummary[];
  total: number;
  /** 文章分类，随列表一起返回，后台修改后即时生效 */
  genres: SiteCategory[];
}

/** GET /api/site/texts/:id */
export interface PracticeTextPayload {
  item: PracticeTextDetail;
}

/** GET /api/auth/me */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'reviewer' | 'ops';
}
