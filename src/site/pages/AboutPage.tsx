import type { BootstrapPayload } from '../../shared/site-config';
import { EmptyState } from '../components/Bits';
import { SectionList } from '../components/Sections';

export function AboutPage({ boot }: { boot: BootstrapPayload }) {
  const page = boot.pages.about;

  if (!page) {
    return (
      <div className="site-page">
        <EmptyState title={boot.labels.notFoundTitle} description={boot.labels.notFoundDescription} />
      </div>
    );
  }

  return (
    <div className="site-page site-page--about">
      <header className="site-page__head">
        <p className="site-eyebrow">{page.eyebrow}</p>
        <h1 className="site-page__title">{page.title}</h1>
        {page.description && <p className="site-page__desc">{page.description}</p>}
      </header>

      <SectionList
        sections={page.sections}
        context={{ labels: boot.labels, versions: boot.versions, types: boot.types }}
      />
    </div>
  );
}
