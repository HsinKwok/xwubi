// 集合页工具入口：字根键位图与在线打字
import type { BootstrapPayload } from '../../../shared/site-config';

interface ToolEntryCardProps {
  href: string;
  title: string;
  description: string;
}

function ToolEntryCard({ href, title, description }: ToolEntryCardProps) {
  return (
    <a className="site-keymap-entry" href={href}>
      <span className="site-keymap-entry__main">
        <span className="site-keymap-entry__title">{title}</span>
        <span className="site-keymap-entry__desc">{description}</span>
      </span>
      <span className="site-keymap-entry__arrow" aria-hidden="true">
        →
      </span>
    </a>
  );
}

export function CollectionToolEntries({ boot }: { boot: BootstrapPayload }) {
  return (
    <>
      <ToolEntryCard
        href="/tools/keymap"
        title={boot.labels.keymapEntryTitle ?? '字根键位图'}
        description={
          boot.labels.keymapEntryDescription ?? '按 25 个键位查看口诀、代表字根与例字速查'
        }
      />
      <ToolEntryCard
        href="/practice"
        title={boot.labels.practiceEntryTitle ?? '在线打字'}
        description={
          boot.labels.practiceEntryDescription ??
          '字根找键位、单字打编码，实时统计正确率与速度'
        }
      />
    </>
  );
}
