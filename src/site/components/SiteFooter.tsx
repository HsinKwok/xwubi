import type { SiteConfig } from '../../shared/site-config';

export function SiteFooter({
  brand,
  footer,
}: {
  brand: SiteConfig['brand'];
  footer: SiteConfig['footer'];
}) {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <span className="site-footer__mark" aria-hidden="true">
            <img src="/logo.png" alt="" width={28} height={28} />
          </span>
          <p className="site-footer__tagline">{brand.tagline}</p>
          <p className="site-footer__note">{footer.note}</p>
        </div>

        <div className="site-footer__columns">
          {footer.columns.map((column) => (
            <div className="site-footer__column" key={column.title}>
              <p className="site-footer__column-title">{column.title}</p>
              <ul className="site-footer__links">
                {column.links.map((link) => (
                  <li key={link.href + link.label}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="site-footer__bottom">
        <span>{footer.copyright}</span>
        <span className="site-footer__mono">
          <img src="/logo.png" alt={brand.name} width={16} height={16} />
        </span>
      </div>
    </footer>
  );
}
