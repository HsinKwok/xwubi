// 投稿与推荐页：页头文案 + 表单/成功面板组合
import type { BootstrapPayload } from '../../shared/site-config';
import { SubmitDone } from './submit/SubmitDone';
import { SubmitForm } from './submit/SubmitForm';
import { useSubmitForm } from './submit/use-submit-form';
import '../styles/forms.css';

export interface SubmitPageProps {
  boot: BootstrapPayload;
}

export function SubmitPage({ boot }: SubmitPageProps) {
  const labels = boot.labels;
  const form = useSubmitForm(boot);

  return (
    <div className="site-form-page">
      <header>
        <p className="site-eyebrow">{labels.submitEyebrow ?? 'SUBMIT'}</p>
        <h1 className="site-form-page__title">{labels.submitTitle ?? '投稿与推荐'}</h1>
        <p className="site-form-page__desc">
          {labels.submitDescription ??
            '有值得收录的资讯、软件，或发现页面有错误，都可以在这里提交。我们会人工核对后处理。'}
        </p>
      </header>

      {form.done ? (
        <SubmitDone boot={boot} statusUrl={form.statusUrl} onReset={form.reset} />
      ) : (
        <SubmitForm boot={boot} form={form} />
      )}
    </div>
  );
}
