import type { DashboardQueueItem } from './dashboard-types';

export { createNavigateHandler } from '../lib/navigate';

export const TYPE_LABELS: Record<DashboardQueueItem['type'], string> = {
  lesson: '教学',
  news: '资讯',
  software: '软件',
  tool: '工具',
};

export function formatCount(value: number): string {
  return value > 99 ? '99+' : String(value);
}

export function greetingOf(hour: number): string {
  if (hour < 6) return '夜深了';
  if (hour < 12) return '早上好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

export function formatRelative(iso: string): string {
  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) return iso;

  const diff = Date.now() - timestamp;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  if (diff < 7 * day) return `${Math.floor(diff / day)} 天前`;
  return new Date(timestamp).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}
