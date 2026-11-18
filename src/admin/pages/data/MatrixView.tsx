import { Icon } from '../../components/icons';
import type { MatrixVersion } from '../../lib/data-api';
import { versionLabel } from '../../lib/versions';

function formatTime(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
}

export function MatrixView({ items, loading }: { items: MatrixVersion[]; loading: boolean }) {
  return (
    <div className={`xw-keymap__matrix${loading ? ' is-refreshing' : ''}`}>
      {items.map((item) => {
        const complete = item.roots.missing_keys.length === 0;
        return (
          <div className="xw-panel" key={item.version}>
            <div className="xw-panel__head">
              <h2 className="xw-panel__title">{versionLabel(item.version)}</h2>
              <span className={`xw-keymap__badge${complete ? ' is-done' : ''}`}>
                {complete ? '字根完整' : `缺 ${item.roots.missing_keys.length} 键`}
              </span>
            </div>

            <dl className="xw-keymap__stats">
              <div>
                <dt>字根</dt>
                <dd>{item.roots.count} / 25</dd>
              </div>
              <div>
                <dt>例字</dt>
                <dd>{item.examples.count}</dd>
              </div>
              <div>
                <dt>字根更新</dt>
                <dd>{formatTime(item.roots.updated_at)}</dd>
              </div>
              <div>
                <dt>例字更新</dt>
                <dd>{formatTime(item.examples.updated_at)}</dd>
              </div>
            </dl>

            {item.roots.missing_keys.length > 0 && (
              <div className="xw-keymap__missing">
                <span className="xw-field__hint">缺失键位</span>
                <div className="xw-keymap__chips">
                  {item.roots.missing_keys.map((key) => (
                    <span className="xw-keymap__chip" key={key}>
                      {key}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {!loading && items.length === 0 && (
        <div className="xw-panel">
          <div className="xw-empty">
            <Icon name="database" size={22} />
            <p>还没有码表数据</p>
          </div>
        </div>
      )}
    </div>
  );
}
