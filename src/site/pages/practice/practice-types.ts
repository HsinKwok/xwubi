export interface KeymapRoot {
  key: string;
  mnemonic: string;
  roots: string;
  note: string | null;
  sort_order: number;
}

export interface KeymapExample {
  char: string;
  code: string;
  roots: string;
  note: string | null;
  sort_order: number;
}

export interface KeymapPayload {
  version: string;
  roots: KeymapRoot[];
  examples: KeymapExample[];
  counts: { roots: number; examples: number };
}

export type PracticeMode = 'root' | 'char' | 'text';

export interface Question {
  id: string;
  prompt: string;
  answer: string;
  hint: string;
}

export interface ArticleChar {
  char: string;
  /** 汉字在整篇中的序号，标点为 null */
  index: number | null;
}

export const QUESTION_COUNTS = [20, 50, 100] as const;

export type QuestionCount = (typeof QUESTION_COUNTS)[number];
