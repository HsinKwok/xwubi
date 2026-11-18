import type { CategoryDomain } from '../../lib/categories-api';

export type Group = 'content' | 'keymap' | 'tags';

export const GROUPS: Array<{ key: Group; label: string; desc: string }> = [
  {
    key: 'content',
    label: '内容分类',
    desc: '内容类型决定归属与前台路径；教学阶段是教学内容的单选维度，也是前台「阶段」筛选的唯一来源。',
  },
  {
    key: 'keymap',
    label: '码表',
    desc: '码表分区决定字根图分组，码表版本是内容、字根、例字共用的版本维度。',
  },
  {
    key: 'tags',
    label: '标签',
    desc: '标签是扁平、多选、可增长的一层，所有内容类型都可使用；前台筛选按实际用到的标签生成。',
  },
];

export const GROUP_DOMAINS: Record<'content' | 'keymap', CategoryDomain[]> = {
  content: ['content_type', 'lesson_stage', 'practice_genre'],
  keymap: ['keymap_zone', 'keymap_version'],
};

export const DOMAIN_META: Record<CategoryDomain, { label: string; desc: string }> = {
  content_type: {
    label: '内容类型',
    desc: '如教学、资讯、软件库、工具。新增类型需填写唯一的前台路径前缀。',
  },
  lesson_stage: {
    label: '教学阶段',
    desc: '教学内容只能选一个阶段，前台「阶段」筛选直接读取这里。',
  },
  practice_genre: {
    label: '篇目分类',
    desc: '文章跟打页的篇目分类，一篇只能归入一个分类。',
  },
  keymap_zone: {
    label: '码表分区',
    desc: '前台「码表查询」字根图的分区，可调整名称、提示、键位与顺序。',
  },
  keymap_version: {
    label: '码表版本',
    desc: '内容、字根、例字与投稿共用的版本维度；默认版本在「系统设置」中选择。',
  },
};

export interface FormState {
  domain: CategoryDomain;
  slug: string;
  label: string;
  hint: string;
  key_list: string;
  route: string;
  sort_order: string;
}

export interface EditorState {
  id: string | null;
  form: FormState;
}

export { formatStamp as formatDate } from '../../lib/format';
