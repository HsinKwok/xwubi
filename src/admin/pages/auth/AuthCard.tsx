import type { ReactNode } from 'react';

export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="xw-login">
      <div className="xw-login__panel">
        <a className="xw-login__brand" href="/">
          <span className="xw-login__mark" aria-hidden="true">
            五
          </span>
          <span className="xw-login__wordmark">xwubi</span>
          <span className="xw-login__mode">管理</span>
        </a>

        <h1 className="xw-login__title">{title}</h1>
        {description && <p className="xw-login__desc">{description}</p>}

        {children}
      </div>
    </div>
  );
}
