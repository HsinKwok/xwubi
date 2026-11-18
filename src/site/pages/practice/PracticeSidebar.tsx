import type { SiteConfig } from '../../../shared/site-config';

export function PracticeSidebar({
  labels,
  articleMode,
}: {
  labels: SiteConfig['labels'];
  articleMode: boolean;
}) {
  return (
    <aside className="site-practice__side">
      <h2 className="site-practice__side-title">{labels.practiceTipTitle ?? '练习提示'}</h2>
      <ol className="site-practice__tips">
        {articleMode ? (
          <>
            <li>
              {labels.practiceTextTip1 ??
                '用输入法照着原文打字，标点与空格会自动跳过，不计入判定。'}
            </li>
            <li>
              {labels.practiceTextTip2 ?? '打错的字会标红，可以退格修改；打满全篇自动结束。'}
            </li>
            <li>
              {labels.practiceTextTip3 ??
                '打开「编码提示」可以对照当前码表版本的五笔编码，生僻字可能没有收录。'}
            </li>
          </>
        ) : (
          <>
            <li>{labels.practiceTip1 ?? '先看清字根或汉字，再想编码，不要凭手指记忆乱按。'}</li>
            <li>
              {labels.practiceTip2 ?? '输满编码会自动判定；打错会显示正确编码，接着进入下一题。'}
            </li>
            <li>{labels.practiceTip3 ?? '连续练三轮，把正确率稳定在 95% 以上，再追求速度。'}</li>
          </>
        )}
      </ol>
      <a className="site-practice__link" href="/tools/keymap">
        {labels.practiceKeymapLink ?? '打开字根键位图 →'}
      </a>
    </aside>
  );
}
