/** 文章跟打篇目的表单与统计工具 */

export interface PracticeTextForm {
  title: string;
  author: string;
  dynasty: string;
  genre: string;
  sort_order: string;
  body: string;
}

export const EMPTY_PRACTICE_TEXT_FORM: PracticeTextForm = {
  title: '',
  author: '',
  dynasty: '',
  genre: '',
  sort_order: '0',
  body: '',
};

export interface PracticeTextEditorState {
  id: string | null;
  loading: boolean;
  form: PracticeTextForm;
}

/** 与后台一致：只统计汉字 */
export function countHan(value: string): number {
  return (value.match(/\p{Script=Han}/gu) ?? []).length;
}
