import type { AdminUser } from '../types';
import { ApiError, requestJson } from '../../shared/fetch-json';

export {
  ApiError,
  deleteJson,
  getJson,
  getOptionalJson,
  patchJson,
  postForm,
  postJson,
  putJson,
} from '../../shared/fetch-json';

/**
 * 管理台统一错误出口：401 交给登录失效回调，其余错误保留后端文案。
 * 返回 null 表示已接管错误，页面无需再设置错误状态。
 */
export function resolveAdminError(
  caught: unknown,
  fallback: string,
  onUnauthorized?: () => void,
): string | null {
  if (onUnauthorized && caught instanceof ApiError && caught.status === 401) {
    onUnauthorized();
    return null;
  }
  return caught instanceof Error ? caught.message : fallback;
}

export async function getCurrentUser(signal?: AbortSignal): Promise<AdminUser | null> {
  const payload = await requestJson<{ user: AdminUser }>('/api/auth/me', {
    signal,
    allowUnauthorized: true,
  });
  return payload?.user ?? null;
}
