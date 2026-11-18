-- 前台字根键位图的展示文案，写入站点配置的 labels。
-- 迁移只执行一次；如需改文案，请在管理台站点设置中调整。

UPDATE settings
SET value = json_set(
  value,
  '$.labels.keymapEyebrow', 'KEYMAP',
  '$.labels.keymapTitle', '字根键位图',
  '$.labels.keymapDescription', '按横、竖、撇、捺、折五个区排列 25 个键位，点开任一键查看口诀与代表字根。',
  '$.labels.keymapMnemonic', '口诀',
  '$.labels.keymapRelatedExamples', '代表例字',
  '$.labels.keymapRelatedEmpty', '还没有收录以这个键开头的例字。',
  '$.labels.keymapSelectHint', '选择左侧任一键位查看字根。',
  '$.labels.keymapExamples', '例字速查',
  '$.labels.keymapSearchPlaceholder', '输入汉字、编码或字根',
  '$.labels.keymapResultEmpty', '没有匹配的例字，换个关键词试试。',
  '$.labels.keymapEmptyTitle', '当前版本还没有码表数据',
  '$.labels.keymapEmptyDescription', '可以先切换码表版本，或稍后再来查看。',
  '$.labels.keymapEntryTitle', '字根键位图',
  '$.labels.keymapEntryDescription', '按 25 个键位查看口诀、代表字根与例字速查'
),
updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE key = 'site_config';
