-- 例字库扩充后，前台只渲染前 120 条，其余通过搜索查看。

UPDATE settings
SET value = json_set(
  value,
  '$.labels.keymapMoreExamples', '共 {count} 个例字，输入关键词缩小范围。'
),
updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE key = 'site_config';
