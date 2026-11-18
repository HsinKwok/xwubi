// 生成资讯种子 SQL：5 个固定标签 × 3 个版本 × 21 条 = 315 条。
// 用法：node scripts/generate-lessons.mjs 之后再执行 node scripts/generate-news.mjs
import path from 'node:path';
import { NEWS_TAGS, NEWS_TOPICS, VERSION_NOTE } from './content/news-data.mjs';
import { VERSION_LABEL, isoDate, sqlText, writeSqlChunks } from './content/wubi-data.mjs';

const VERSIONS = ['86', '98', 'xsj'];

const TAG_GUIDE = {
  version: {
    points: ['先确认程序版本，再确认码表版本，两者不是一回事。', '升级前备份配置与词库，升级后按清单逐项复测。'],
    impact: '版本变化会改变候选、标点与快捷键行为；不核对就开打，问题会被误判成“自己打错了”。',
    steps: ['记录升级前后的程序版本与码表版本。', '用同一段 200 字测试文本对比回退次数。', '把异常项写成一条可复现的记录。'],
    check: '能说清当前使用的程序版本与码表版本。',
  },
  code: {
    points: ['码表管编码，词库管词组，两件事分开维护。', '每次改动词库后，固定抽查高频字与高频词。'],
    impact: '码表或词库的小改动会放大成整篇文本的重码与错字，必须用固定样本回归。',
    steps: ['备份当前码表与词库。', '只改一类问题，改完立即抽查。', '把修改依据与影响范围记在词库说明里。'],
    check: '改动前后能用同一段文本复现差异。',
  },
  tool: {
    points: ['工具只解决一个明确问题，不要为了工具而工具。', '优先选能导出数据、能离线使用的工具。'],
    impact: '合适的辅助工具能减少查码与校对时间，堆砌工具则会打断输入节奏。',
    steps: ['先写清要解决的问题，再选工具。', '用一小段真实文本试用，确认不打断输入。', '保留配置与数据导出路径。'],
    check: '工具能减少查码或回退，而不是增加步骤。',
  },
  community: {
    points: ['反馈要带版本、码表与复现步骤。', '协作维护先分区，再合并。'],
    impact: '五笔方案的长期可用依赖可验证的反馈与文档；模糊反馈会让问题长期悬置。',
    steps: ['按模板补齐环境信息。', '附上最小复现文本与预期结果。', '跟进处理结果并回写文档。'],
    check: '反馈能被他人按步骤复现。',
  },
  opinion: {
    points: ['先看自己的高频文本，再看别人的推荐。', '任何技巧都要用固定测试验证，不靠感觉。'],
    impact: '版本、词库与练习方法的选择，最终都体现在回退率与持续使用意愿上。',
    steps: ['选一段自己的工作文本作为固定样本。', '只改变一个变量，连续测试三次。', '保留有效做法，放弃无效折腾。'],
    check: '能用数据说明这个选择对自己的影响。',
  },
};

function buildBody({ version, tag, topic, date }) {
  const [title, detail] = topic;
  const guide = TAG_GUIDE[tag.key];
  return `# ${title}（${VERSION_LABEL[version]}）

> 站内整理 · ${tag.label} · ${VERSION_LABEL[version]} · ${date.slice(0, 10)}

## 背景

${tag.intro}

${VERSION_NOTE[version]}

## 本次关注

- ${detail}
- ${guide.points[0]}
- ${guide.points[1]}

## 对使用者的影响

${guide.impact}

对 ${VERSION_LABEL[version]} 用户来说，还要额外确认词库是否与当前码表同源；跨版本混用会直接增加重码。

## 建议做法

1. ${guide.steps[0]}
2. ${guide.steps[1]}
3. ${guide.steps[2]}

## 核对清单

- [ ] ${guide.check}
- [ ] 记录当前码表版本与词库来源。
- [ ] 用同一段测试文本复测，记录回退次数。
`;
}

function main() {
  const lines = [
    '-- 自动生成：资讯（5 标签 × 3 版本 × 21 条）',
    '-- 生成脚本：scripts/generate-news.mjs',
    "DELETE FROM content_tags WHERE content_id LIKE 'cnt_news_%';",
    "DELETE FROM content WHERE id LIKE 'cnt_news_%';",
    "INSERT OR IGNORE INTO tags (id, name) VALUES ('tag-version', '版本更新'), ('tag-code', '码表与词库'), ('tag-tool', '软件与工具'), ('tag-community', '方案与社区'), ('tag-opinion', '长文与观点');",
  ];
  const statements = [];

  let index = 0;
  for (const tag of NEWS_TAGS) {
    const topics = NEWS_TOPICS[tag.key];
    if (!topics || topics.length !== 21) throw new Error(`${tag.key} 选题数量应为 21`);
    for (const version of VERSIONS) {
      topics.forEach((topic, topicIndex) => {
        const no = String(topicIndex + 1).padStart(2, '0');
        const id = `cnt_news_${version}_${tag.key}_${no}`;
        const slug = `news-${version}-${tag.key}-${no}`;
        const title = `${topic[0]}（${VERSION_LABEL[version]}）`;
        const date = isoDate(index);
        index += 1;
        statements.push(
          `INSERT OR REPLACE INTO content (id, type, slug, version, title, summary, body_md, meta_json, stage, lesson_no, sort_order, status, verified_at, published_at, created_at, updated_at) VALUES (${[
            sqlText(id),
            sqlText('news'),
            sqlText(slug),
            sqlText(version),
            sqlText(title),
            sqlText(topic[1]),
            sqlText(buildBody({ version, tag, topic, date })),
            sqlText(
              JSON.stringify({
                source_name: 'xwubi 编辑整理',
                topic: topic[0],
                tag: tag.label,
                checked_at: date,
              }),
            ),
            'NULL',
            'NULL',
            '0',
            sqlText('published'),
            sqlText(date),
            sqlText(date),
            sqlText(date),
            sqlText(date),
          ].join(', ')});`,
        );
        statements.push(
          `INSERT OR REPLACE INTO content_tags (content_id, tag_id) VALUES (${sqlText(id)}, ${sqlText(tag.tagId)});`,
        );
      });
    }
  }

  const dir = path.resolve('seeds/content');
  const parts = writeSqlChunks(dir, 'news', lines, statements, 40);
  console.log(`已生成 ${dir}，资讯 ${index} 条，分 ${parts} 个分片`);
}

main();
