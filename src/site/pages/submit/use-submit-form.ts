// 投稿表单状态与提交逻辑：类型切换、字段取值、 honeypot 防刷与提交结果
import { useState } from 'react';
import type { FormEvent } from 'react';
import type { BootstrapPayload } from '../../../shared/site-config';
import { ApiError, postJson } from '../../lib/api';
import { searchParam } from '../../lib/router';
import type { Notice, SubmissionKind } from './submit-types';

function readInitialKind(): SubmissionKind {
  const kind = searchParam('kind');
  return kind === 'correction' || kind === 'software' ? kind : 'news';
}

function readInitialPageUrl(): string {
  return searchParam('page');
}

export function useSubmitForm(boot: BootstrapPayload) {
  const labels = boot.labels;
  const [kind, setKind] = useState<SubmissionKind>(readInitialKind);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [pageUrl, setPageUrl] = useState(readInitialPageUrl);
  const [targetVersion, setTargetVersion] = useState('');
  const [note, setNote] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [done, setDone] = useState(false);
  const [statusUrl, setStatusUrl] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setNotice(null);

    try {
      const payload = await postJson<{ ok: boolean; id: string | null; status_url?: string }>(
        '/api/site/submissions',
        {
          kind,
          title: title.trim(),
          url: url.trim(),
          page_url: pageUrl.trim(),
          version: targetVersion,
          note: note.trim(),
          display_name: displayName.trim(),
          email: email.trim(),
          website: honeypot,
        },
      );
      setStatusUrl(payload.status_url ?? null);
      setDone(true);
    } catch (caught) {
      setNotice({
        tone: 'error',
        text: caught instanceof ApiError ? caught.message : labels.submitFailed ?? '提交失败，请稍后再试',
      });
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setTitle('');
    setUrl('');
    setPageUrl('');
    setTargetVersion('');
    setNote('');
    setDisplayName('');
    setEmail('');
    setNotice(null);
    setDone(false);
    setStatusUrl(null);
  }

  return {
    kind,
    setKind,
    title,
    setTitle,
    url,
    setUrl,
    pageUrl,
    setPageUrl,
    targetVersion,
    setTargetVersion,
    note,
    setNote,
    displayName,
    setDisplayName,
    email,
    setEmail,
    honeypot,
    setHoneypot,
    submitting,
    notice,
    done,
    statusUrl,
    handleSubmit,
    reset,
  };
}

export type SubmitFormModel = ReturnType<typeof useSubmitForm>;
