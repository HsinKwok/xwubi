-- 在线打字练习：菜单入口、页面文案与配套课时。
-- 练习数据直接复用 wubi_roots / wubi_examples，不额外建表。

UPDATE settings
SET value = json_set(
  value,
  '$.labels.practiceEyebrow', 'PRACTICE',
  '$.labels.practiceTitle', '在线打字',
  '$.labels.practiceDescription', '按当前码表版本练习：先认字根键位，再练单字编码，输满自动判定并记录正确率与速度。',
  '$.labels.practiceModeLabel', '练习模式',
  '$.labels.practiceModeRoot', '字根找键位',
  '$.labels.practiceModeChar', '单字打编码',
  '$.labels.practiceCountLabel', '本轮题量',
  '$.labels.practiceStart', '开始练习',
  '$.labels.practiceRestart', '再练一轮',
  '$.labels.practiceChangeMode', '调整模式',
  '$.labels.practiceRootLabel', '这个字根在哪个键？',
  '$.labels.practiceCharLabel', '打出这个字的编码',
  '$.labels.practiceProgress', '第 {index} / {total} 题',
  '$.labels.practiceInputPlaceholder', '直接输入编码，输满自动判定',
  '$.labels.practiceCorrect', '正确',
  '$.labels.practiceWrong', '正确编码：{answer}',
  '$.labels.practiceCompleted', '已完成',
  '$.labels.practiceAccuracy', '正确率',
  '$.labels.practiceTime', '用时',
  '$.labels.practiceSpeed', '速度',
  '$.labels.practiceDoneEyebrow', 'ROUND DONE',
  '$.labels.practiceDoneTitle', '本轮完成',
  '$.labels.practiceDoneDescription', '正确率 {accuracy}%，用时 {time}，平均 {speed} 题/分钟。',
  '$.labels.practiceTipTitle', '练习提示',
  '$.labels.practiceTip1', '先看清字根或汉字，再想编码，不要凭手指记忆乱按。',
  '$.labels.practiceTip2', '输满编码会自动判定；打错会显示正确编码，接着进入下一题。',
  '$.labels.practiceTip3', '连续练三轮，把正确率稳定在 95% 以上，再追求速度。',
  '$.labels.practiceKeymapLink', '打开字根键位图 →',
  '$.labels.practiceEntryTitle', '在线打字',
  '$.labels.practiceEntryDescription', '字根找键位、单字打编码，实时统计正确率与速度',
  '$.labels.practiceEmptyTitle', '当前版本还没有可练习的数据',
  '$.labels.practiceEmptyDescription', '可以先切换码表版本，或稍后再来练习。',
  '$.nav', (
    SELECT json_group_array(json(item))
    FROM (
      SELECT value AS item, CAST(key AS INTEGER) AS position
      FROM json_each(json_extract(settings.value, '$.nav'))
      UNION ALL
      SELECT '{"key":"practice","label":"练习","href":"/practice"}', 3.5
      ORDER BY position
    )
  )
),
updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE key = 'site_config';

-- 菜单与文案变更后自增站点版本，避免公共缓存继续返回旧配置。
UPDATE settings
SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT),
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE key = 'site_epoch';

-- 参考启蒙五笔的学习路线，补齐拆字、简码与词组三个课时。
INSERT OR IGNORE INTO content
  (id, type, slug, version, title, summary, body_md, meta_json, stage, lesson_no, sort_order, status, author_id, verified_at, published_at)
VALUES
  (
    'cnt_lesson_04',
    'lesson',
    'lesson-04-split-rules',
    'all',
    '第四课：拆字顺序与取大优先',
    '按书写顺序、取大优先、兼顾直观、能连不交、能散不连五条规则拆字。',
    '# 第四课：拆字顺序与取大优先

拆字不是把字拆得越细越好，而是按固定顺序取字根。

## 五条规则

1. 书写顺序：从左到右、从上到下、从外到内。
2. 取大优先：能取大字根，就不取小字根。
3. 兼顾直观：拆出来的字根要容易辨认。
4. 能连不交：能连成一体，就不要交叉。
5. 能散不连：能分开，就不要硬连。

## 练习

| 字 | 拆分 | 编码 |
| --- | --- | --- |
| 照 | 日 刀 口 灬 | jvko |
| 微 | 彳 山 一 攵 | tmgt |
| 键 | 钅 彐 二 廴 | qvfp |

先在纸上写出拆分，再回到在线打字里验证编码。',
    '{"examples":["照","微","键"],"duration_min":20}',
    'shape',
    4,
    4,
    'published',
    NULL,
    '2026-11-15T02:00:00.000Z',
    '2026-11-15T02:00:00.000Z'
  ),
  (
    'cnt_lesson_05',
    'lesson',
    'lesson-05-single-char',
    'all',
    '第五课：单字、简码与重码',
    '分清一级简码、二级简码与全码，用在线打字把常用字打顺。',
    '# 第五课：单字、简码与重码

常用字不一定打全码。一级简码、二级简码能明显提速。

## 三种打法

- 一级简码：按一个键加空格，例如 我（Q）、的（R）。
- 二级简码：取前两个字根，例如 明（JE）。
- 全码：四码，用来处理重码和生僻字。

## 练习

1. 在在线打字里选「单字打编码」，先完成 20 题。
2. 正确率低于 90% 时，回到字根键位图核对字根。
3. 连续三轮正确率稳定后，再增加到 50 题。',
    '{"examples":["我","的","明"],"duration_min":25}',
    'practice',
    5,
    5,
    'published',
    NULL,
    '2026-11-15T02:00:00.000Z',
    '2026-11-15T02:00:00.000Z'
  ),
  (
    'cnt_lesson_06',
    'lesson',
    'lesson-06-phrase-text',
    'all',
    '第六课：词组与短文跟打',
    '按二字词、三字词、四字词的取码规则练习，再用短文检验速度。',
    '# 第六课：词组与短文跟打

词组按固定规则取码，熟练后整句输入会比单字快很多。

## 词组取码

- 二字词：每字取前两码。
- 三字词：前两字各取一码，最后一字取两码。
- 四字词：每字取第一码。

## 短文练习

1. 选一段 100 到 300 字的短文。
2. 先求准确，再记录每分钟字数。
3. 把打错的字单独抄出来，下一轮重点练。

在线打字页支持字根与单字两种模式，词组与短文可以先用单字模式逐字过关。',
    '{"examples":["我们","可以","已经"],"duration_min":30}',
    'speed',
    6,
    6,
    'published',
    NULL,
    '2026-11-15T02:00:00.000Z',
    '2026-11-15T02:00:00.000Z'
  );
