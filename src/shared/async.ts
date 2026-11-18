/**
 * 前端共享的异步工具：站点与管理台各自打包，但取消语义只维护一份。
 */

/** 取消请求时使用的标准错误，与 fetch 抛出的 AbortError 保持一致 */
export function abortError(): DOMException {
  return new DOMException('请求已取消', 'AbortError');
}

/**
 * 让共享请求的结果跟随调用方的取消信号：
 * 网络请求本身不取消，调用方放弃等待时只影响自己。
 */
export function withSignal<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(abortError());

  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(abortError());
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener('abort', onAbort);
        resolve(value);
      },
      (error: unknown) => {
        signal.removeEventListener('abort', onAbort);
        reject(error);
      },
    );
  });
}
