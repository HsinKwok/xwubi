/**
 * 前台与管理台共用的 JSON 请求封装。
 * 两个入口会各自打包一份，但实现只有一处，避免错误解析与请求头逻辑分叉。
 */

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

interface ErrorPayload {
  error?: { code?: string; message?: string };
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  form?: FormData;
  signal?: AbortSignal;
  /** 401 时返回 null，而不是抛出 ApiError */
  allowUnauthorized?: boolean;
}

async function parseError(response: Response): Promise<ApiError> {
  let message = `请求失败（${response.status}）`;
  let code: string | undefined;

  try {
    const body = (await response.json()) as ErrorPayload;
    message = body.error?.message ?? message;
    code = body.error?.code;
  } catch {
    // 非 JSON 响应保持默认文案
  }

  return new ApiError(response.status, message, code);
}

async function send(path: string, options: RequestOptions): Promise<Response | null> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const init = {
    method: options.method ?? 'GET',
    credentials: 'same-origin',
    headers,
    signal: options.signal,
  } as unknown as RequestInit;

  if (options.form) {
    init.body = options.form;
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(options.body);
  }

  const response = await fetch(path, init);

  if (options.allowUnauthorized && response.status === 401) return null;
  if (!response.ok) throw await parseError(response);
  return response;
}

export async function requestJson<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T | null> {
  const response = await send(path, options);
  if (!response) return null;
  return (await response.json()) as T;
}

export async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  return (await requestJson<T>(path, { signal })) as T;
}

/** 未登录时返回 null，其余错误照常抛出 */
export async function getOptionalJson<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T | null> {
  return requestJson<T>(path, { signal, allowUnauthorized: true });
}

export async function postJson<T>(path: string, body?: unknown): Promise<T> {
  return (await requestJson<T>(path, { method: 'POST', body: body ?? {} })) as T;
}

export async function patchJson<T>(path: string, body?: unknown): Promise<T> {
  return (await requestJson<T>(path, { method: 'PATCH', body: body ?? {} })) as T;
}

export async function putJson<T>(path: string, body?: unknown): Promise<T> {
  return (await requestJson<T>(path, { method: 'PUT', body: body ?? {} })) as T;
}

export async function postForm<T>(path: string, form: FormData): Promise<T> {
  return (await requestJson<T>(path, { method: 'POST', form })) as T;
}

export async function deleteJson<T>(path: string): Promise<T> {
  return (await requestJson<T>(path, { method: 'DELETE' })) as T;
}
