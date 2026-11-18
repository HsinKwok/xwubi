import type { IconName } from '../components/icons';
import type { AdminBadgeCounts, AdminUser, WubiVersion } from '../types';

export interface DashboardStat {
  key: string;
  label: string;
  value: number | string;
  hint?: string;
  icon?: IconName;
}

export interface DashboardQueueItem {
  id: string;
  title: string;
  type: 'lesson' | 'news' | 'software' | 'tool';
  version?: WubiVersion | 'all';
  submitter?: string;
  /** UTC ISO 8601 */
  updatedAt: string;
  href?: string;
}

export interface DashboardDistributionItem {
  label: string;
  count: number;
}

export interface DashboardActivityItem {
  id: string;
  actor: string;
  action: string;
  target: string;
  /** UTC ISO 8601 */
  createdAt: string;
}

export interface DashboardProps {
  user: AdminUser;
  counts?: AdminBadgeCounts;
  /** 不传时根据 counts 生成基础统计 */
  stats?: DashboardStat[];
  queue?: DashboardQueueItem[];
  distribution?: DashboardDistributionItem[];
  activities?: DashboardActivityItem[];
  onNavigate?: (href: string) => void;
}
