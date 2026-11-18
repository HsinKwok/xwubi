import { ApiError, resolveAdminError } from '../../lib/api';

/** 编辑器顶部提示条数据 */
export interface EditorNotice {
  tone: 'ok' | 'error';
  text: string;
}

interface ErrorSinks {
  setNotice: (notice: EditorNotice) => void;
  setProblems: (problems: string[]) => void;
  setConflict: (conflict: boolean) => void;
  onUnauthorized: () => void;
}

/** 统一处理编辑器接口错误：编辑冲突、发布条件不足、未授权与普通失败 */
export function handleEditorError(caught: unknown, sinks: ErrorSinks) {
  const { setNotice, setProblems, setConflict, onUnauthorized } = sinks;

  if (caught instanceof ApiError) {
    if (caught.status === 409 && caught.code === 'edit_conflict') {
      setConflict(true);
      setNotice({ tone: 'error', text: caught.message });
      return;
    }
    if (caught.status === 422) {
      setProblems(caught.message.split('；').filter(Boolean));
      setNotice({ tone: 'error', text: '发布前还有未满足的条件' });
      return;
    }
    if (caught.status !== 401) {
      setNotice({ tone: 'error', text: caught.message });
      return;
    }
  }

  const message = resolveAdminError(caught, '操作失败，请重试', onUnauthorized);
  if (!message) return;
  setNotice({ tone: 'error', text: message });
}
