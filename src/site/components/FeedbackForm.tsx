import { useState } from 'react';
import type { FormEvent } from 'react';
import type { SiteConfig } from '../../shared/site-config';
import { ApiError, postJson } from '../lib/api';

export interface FeedbackFormProps {
  /** 反馈对应的页面地址，通常是站内路径 */
  pageUrl: string;
  version: string;
  labels: SiteConfig['labels'];
}

interface Notice {
  tone: 'ok' | 'error';
  text: string;
}

export function FeedbackForm({ pageUrl, version, labels }: FeedbackFormProps) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState('');
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [statusUrl, setStatusUrl] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const text = body.trim();
    if (!text) {
      setNotice({ tone: 'error', text: labels.feedbackBodyRequired ?? '请先描述遇到的问题' });
      return;
    }

    setSubmitting(true);
    setNotice(null);

    try {
      const payload = await postJson<{ ok: boolean; id: string | null; status_url?: string }>(
        '/api/site/feedback',
        {
          page_url: pageUrl,
          version,
          body: text,
          email: email.trim(),
          website: honeypot,
        },
      );
      setBody('');
      setEmail('');
      setStatusUrl(payload.status_url ?? null);
      setNotice({ tone: 'ok', text: labels.feedbackSuccess ?? '已收到反馈，谢谢！' });
    } catch (caught) {
      setNotice({
        tone: 'error',
        text: caught instanceof ApiError ? caught.message : labels.feedbackFailed ?? '提交失败，请稍后再试',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="site-feedback" aria-labelledby="site-feedback-title">
      <div className="site-feedback__head">
        <div>
          <p className="site-eyebrow">{labels.feedbackEyebrow ?? 'FEEDBACK'}</p>
          <h2 className="site-feedback__title" id="site-feedback-title">
            {labels.feedbackTitle ?? '页面有错误？'}
          </h2>
          <p className="site-feedback__desc">
            {labels.feedbackDescription ?? '告诉我们哪里不对，我们会核对并修正。'}
          </p>
        </div>
        <button
          type="button"
          className="site-btn site-btn--ghost"
          aria-expanded={open}
          onClick={() => {
            setOpen((current) => !current);
            setNotice(null);
            setStatusUrl(null);
          }}
        >
          {open ? labels.feedbackClose ?? '收起' : labels.feedbackOpen ?? '反馈问题'}
        </button>
      </div>

      {open && (
        <form className="site-feedback__form" onSubmit={handleSubmit}>
          <label className="site-field">
            <span className="site-field__label">{labels.feedbackBody ?? '问题描述'}</span>
            <textarea
              rows={4}
              required
              value={body}
              placeholder={labels.feedbackBodyPlaceholder ?? '例如：这一课的例字与字根对不上'}
              onChange={(event) => setBody(event.target.value)}
            />
          </label>

          <label className="site-field">
            <span className="site-field__label">{labels.feedbackEmail ?? '邮箱（可选，便于回复）'}</span>
            <input
              type="email"
              value={email}
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <input
            className="site-hp"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={honeypot}
            onChange={(event) => setHoneypot(event.target.value)}
          />

          {notice && (
            <p className={`site-feedback__notice site-feedback__notice--${notice.tone}`} role="status">
              {notice.text}
              {statusUrl && (
                <>
                  {' '}
                  <a className="site-feedback__status-link" href={statusUrl}>
                    {labels.feedbackViewStatus ?? '查看处理进度'} →
                  </a>
                </>
              )}
            </p>
          )}

          <div className="site-feedback__actions">
            <button type="submit" className="site-btn site-btn--primary" disabled={submitting}>
              {submitting ? labels.feedbackSubmitting ?? '提交中…' : labels.feedbackSubmit ?? '提交反馈'}
            </button>
            <a className="site-btn site-btn--text" href="/submit">
              {labels.feedbackSubmitLink ?? '投稿或推荐内容 →'}
            </a>
          </div>
        </form>
      )}
    </section>
  );
}
