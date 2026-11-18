// 投稿表单视图：类型、标题、链接/问题页面、版本、说明与联系方式
import type { BootstrapPayload } from '../../../shared/site-config';
import { KIND_FALLBACKS, KIND_LABEL_KEYS, type SubmissionKind } from './submit-types';
import type { SubmitFormModel } from './use-submit-form';

interface SubmitFormProps {
  boot: BootstrapPayload;
  form: SubmitFormModel;
}

export function SubmitForm({ boot, form }: SubmitFormProps) {
  const labels = boot.labels;

  return (
    <form className="site-form" onSubmit={form.handleSubmit}>
      <label className="site-field">
        <span className="site-field__label">{labels.submitKind ?? '投稿类型'}</span>
        <select
          value={form.kind}
          onChange={(event) => form.setKind(event.target.value as SubmissionKind)}
        >
          {(Object.keys(KIND_FALLBACKS) as SubmissionKind[]).map((value) => (
            <option key={value} value={value}>
              {labels[KIND_LABEL_KEYS[value]] ?? KIND_FALLBACKS[value]}
            </option>
          ))}
        </select>
      </label>

      <label className="site-field">
        <span className="site-field__label">{labels.submitItemTitle ?? '标题'}</span>
        <input
          type="text"
          required
          maxLength={160}
          value={form.title}
          placeholder={labels.submitItemTitlePlaceholder ?? '一句话说明要投稿或纠正的内容'}
          onChange={(event) => form.setTitle(event.target.value)}
        />
      </label>

      <div className="site-form__row">
        {form.kind === 'correction' ? (
          <label className="site-field">
            <span className="site-field__label">{labels.submitPageUrl ?? '出现问题的页面'}</span>
            <input
              type="text"
              required
              maxLength={500}
              value={form.pageUrl}
              placeholder="/learn/basics/lesson-1"
              onChange={(event) => form.setPageUrl(event.target.value)}
            />
          </label>
        ) : (
          <label className="site-field">
            <span className="site-field__label">{labels.submitUrl ?? '相关链接'}</span>
            <input
              type="url"
              maxLength={500}
              value={form.url}
              placeholder="https://"
              onChange={(event) => form.setUrl(event.target.value)}
            />
          </label>
        )}

        <label className="site-field">
          <span className="site-field__label">{labels.versionLabel ?? '适用版本'}</span>
          <select
            value={form.targetVersion}
            onChange={(event) => form.setTargetVersion(event.target.value)}
          >
            <option value="">{labels.generalVersion ?? '通用'}</option>
            {boot.versions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="site-field">
        <span className="site-field__label">{labels.submitNote ?? '补充说明'}</span>
        <textarea
          rows={5}
          maxLength={4000}
          value={form.note}
          placeholder={labels.submitNotePlaceholder ?? '可以补充理由、出处或需要修正的细节'}
          onChange={(event) => form.setNote(event.target.value)}
        />
      </label>

      <div className="site-form__row">
        <label className="site-field">
          <span className="site-field__label">{labels.submitName ?? '怎么称呼你'}</span>
          <input
            type="text"
            maxLength={60}
            value={form.displayName}
            autoComplete="name"
            onChange={(event) => form.setDisplayName(event.target.value)}
          />
        </label>

        <label className="site-field">
          <span className="site-field__label">{labels.submitEmail ?? '邮箱（必填）'}</span>
          <input
            type="email"
            required
            maxLength={200}
            value={form.email}
            autoComplete="email"
            onChange={(event) => form.setEmail(event.target.value)}
          />
        </label>
      </div>

      <input
        className="site-hp"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={form.honeypot}
        onChange={(event) => form.setHoneypot(event.target.value)}
      />

      {form.notice && (
        <p className={`site-form__error site-form__error--${form.notice.tone}`} role="alert">
          {form.notice.text}
        </p>
      )}

      <div className="site-form__actions">
        <button type="submit" className="site-btn site-btn--primary" disabled={form.submitting}>
          {form.submitting ? labels.submitSubmitting ?? '提交中…' : labels.submitAction ?? '提交'}
        </button>
        <a className="site-btn site-btn--text" href="/">
          {labels.backHome ?? '回到首页'} →
        </a>
      </div>
    </form>
  );
}
