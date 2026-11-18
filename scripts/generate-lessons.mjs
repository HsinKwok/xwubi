// 生成教学教案种子 SQL：每个版本 × 每个阶段 × 50 篇。
// 用法：node scripts/generate-lessons.mjs
import path from 'node:path';
import { LESSON_STAGES, STAGE_LABEL } from './content/lessons-data.mjs';
import {
  VERSION_LABEL,
  isoDate,
  loadExamples,
  loadRoots,
  pickChars,
  sqlText,
  wordCode,
  writeSqlChunks,
} from './content/wubi-data.mjs';

const VERSIONS = ['86', '98', 'xsj'];
const VARIANTS = [
  {
    label: '拆解示范',
    minutes: 15,
    goal: '先看懂再动手',
    action: '每字先写出拆分或编码，再击键，不追求速度。',
    check: '能口述本课 3 个例字的取码过程。',
  },
  {
    label: '分组循环',
    minutes: 20,
    goal: '用短组循环建立手感',
    action: '每 10 个一组，共 5 组，组间休息 30 秒再继续。',
    check: '五组错误数逐组下降。',
  },
  {
    label: '限时挑战',
    minutes: 10,
    goal: '在压力下保持准确',
    action: '60 秒计时，记录完成量与错误数，再复测一次。',
    check: '第二次错误数不高于第一次。',
  },
  {
    label: '错题复盘',
    minutes: 20,
    goal: '只处理真正出错的部分',
    action: '把本课错字、错词单独抄出，每个重打 5 遍再回原文。',
    check: '错题复测全部正确。',
  },
  {
    label: '综合应用',
    minutes: 25,
    goal: '把本课放进真实文本',
    action: '选一段 200 字左右的真实文本，刻意使用本课所学。',
    check: '回退次数控制在每百字 3 次以内。',
  },
];

const versionNote = {
  '86': '86 版共 25 个键位，本课例字编码取自站内 86 版码表库；与旧教程不一致时，以本机码表反查为准。',
  '98': '98 版部分字根归键与 86 版不同，本课例字编码取自站内 98 版码表库，不要直接套用 86 版编码。',
  xsj: '新世纪版有独立的字根与取码体系，本课例字编码取自站内新世纪版码表库，练习时请先确认已切换到对应码表。',
};

function pad(value, size) {
  return String(value).padStart(size, '0');
}

function rootTable(roots, keys, limit = 5) {
  const rows = keys
    .slice(0, limit)
    .map((key) => {
      const item = roots[key];
      if (!item) return `| ${key} | — | — |`;
      const list = item.roots.slice(0, 4).join('、') || '—';
      return `| ${key} | ${item.mnemonic || '—'} | ${list} |`;
    })
    .join('\n');
  return `| 键 | 口诀 | 代表字根 |\n| --- | --- | --- |\n${rows}`;
}

function charTable(rows) {
  const body = rows.map(({ char, code }) => `| ${char} | ${code} | ${code[0]} |`).join('\n');
  return `| 字 | 编码 | 首码键 |\n| --- | --- | --- |\n${body}`;
}

function wordTable(module, charCodes) {
  if (!module.w || module.w.length === 0) return '';
  const source = module.w.slice();
  const rows = [];
  for (const word of source) {
    const code = wordCode(word, charCodes);
    if (!code) continue;
    const rule =
      word.length === 2
        ? '各取前两码'
        : word.length === 3
          ? '首字一码 + 次字一码 + 末字两码'
          : word.length === 4
            ? '每字取首码'
            : '前三字首码 + 末字首码';
    rows.push(`| ${word} | ${code} | ${rule} |`);
    if (rows.length >= 10) break;
  }
  if (rows.length === 0) return '';
  return `| 词组 | 编码 | 规则 |\n| --- | --- | --- |\n${rows.join('\n')}`;
}

function drillText(module, variantIndex) {
  if (module.w && module.w.length > 0) {
    return module.w
      .slice(variantIndex % 3)
      .concat(module.w)
      .slice(0, 18)
      .join('  ');
  }
  const chars = module.c.slice(variantIndex * 7).concat(module.c).slice(0, 40).join('');
  return chars;
}

function buildBody({ version, stage, module, variant, variantIndex, roots, examples, lessonNo }) {
  const chars = pickChars(examples, module.c, module.z, 8);
  const keys = module.z.length > 0 ? module.z : ['G', 'H', 'T', 'Y', 'N'];
  const words = wordTable(module, examples);
  const drill =
    stage === '指法与键位'
      ? Array.from({ length: 12 }, () => keys.map((key) => key.toLowerCase()).join(' ')).join('  ')
      : drillText(module, variantIndex);
  const points = module.p.map((item) => `- ${item}`).join('\n');
  const steps = module.s.map((item, index) => `${index + 1}. ${item}`).join('\n');
  const exampleSection = words
    ? `## 词组编码核对\n\n${words}`
    : `## 例字核对\n\n${charTable(chars)}`;

  return `# 第${pad(lessonNo, 2)}课 ${module.t}：${variant.label}（${VERSION_LABEL[version]}）

**适用码表**：${VERSION_LABEL[version]}　**阶段**：${stage}　**建议用时**：${variant.minutes} 分钟

## 本课目标

${variant.goal}。${module.g}

## 版本说明

${versionNote[version]}

## 字根与键位

${rootTable(roots, keys)}

> 本课重点观察 ${keys.join('、')} 这几个键；先想手指归属，再想字根。

## 拆解要点

${points}

${exampleSection}

## 练习步骤

${steps}

### 本课练法

${variant.action}

### 练习材料

\`\`\`
${drill}
\`\`\`

## 自检

- [ ] ${variant.check}
- [ ] 本课例字的编码能独立写出，不靠猜。
- [ ] 出错后先回基准键，再重新起手。
`;
}

function main() {
  const examplesByVersion = loadExamples();
  const rootsByVersion = loadRoots();
  const lines = [
    '-- 自动生成：教学教案（每版本 × 每阶段 × 50 篇）',
    '-- 生成脚本：scripts/generate-lessons.mjs',
    "DELETE FROM content_tags WHERE content_id LIKE 'cnt_lesson_%';",
    "DELETE FROM content WHERE id LIKE 'cnt_lesson_%';",
  ];
  const statements = [];

  for (const version of VERSIONS) {
    const examples = examplesByVersion[version];
    const roots = rootsByVersion[version];
    if (!examples || examples.size === 0) throw new Error(`缺少 ${version} 版例字`);
    let lessonNo = 0;
    LESSON_STAGES.forEach((stage, stageIndex) => {
      stage.modules.forEach((module) => {
        VARIANTS.forEach((variant, variantIndex) => {
          lessonNo += 1;
          const id = `cnt_lesson_${version}_${stage.slug}_${pad(lessonNo, 3)}`;
          const slug = `lesson-${version}-${stage.slug}-${pad(lessonNo, 3)}`;
          const title = `第${pad(lessonNo, 2)}课 ${module.t}：${variant.label}（${VERSION_LABEL[version]}）`;
          const body = buildBody({
            version,
            stage: STAGE_LABEL[stage.slug],
            module,
            variant,
            variantIndex,
            roots,
            examples,
            lessonNo,
          });
          const summary = `${module.g} 练法：${variant.label}，建议 ${variant.minutes} 分钟。`;
          const meta = JSON.stringify({
            duration_min: variant.minutes,
            focus: module.t,
            drill: variant.label,
            examples: pickChars(examples, module.c, module.z, 6).map((item) => item.char),
          });
          const published = isoDate(stageIndex * 40 + lessonNo);
          statements.push(
            `INSERT OR REPLACE INTO content (id, type, slug, version, title, summary, body_md, meta_json, stage, lesson_no, sort_order, status, verified_at, published_at, created_at, updated_at) VALUES (${[
              sqlText(id),
              sqlText('lesson'),
              sqlText(slug),
              sqlText(version),
              sqlText(title),
              sqlText(summary),
              sqlText(body),
              sqlText(meta),
              sqlText(stage.slug),
              lessonNo,
              lessonNo,
              sqlText('published'),
              sqlText(published),
              sqlText(published),
              sqlText(published),
              sqlText(published),
            ].join(', ')});`,
          );
        });
      });
    });
  }

  const dir = path.resolve('seeds/content');
  const parts = writeSqlChunks(dir, 'lessons', lines, statements, 50);
  console.log(`已生成 ${dir}，教案 ${statements.length} 篇，分 ${parts} 个分片`);
}

main();
