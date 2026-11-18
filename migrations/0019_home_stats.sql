-- 内容补全后同步首页统计：教学 600 篇（4 阶段 × 3 版本 × 50）、
-- 资讯 315 条（5 标签 × 3 版本 × 21）、软件库 30 款。
UPDATE settings
SET value = json_set(
      value,
      '$.home.sections[1].items',
      json('[
        { "label": "课时", "value": "600", "hint": "四阶段 × 三版本" },
        { "label": "资讯", "value": "315", "hint": "五标签 × 三版本" },
        { "label": "软件", "value": "30", "hint": "说明与下载" },
        { "label": "工具", "value": "字根 / 键位", "hint": "随时可查" }
      ]')
    ),
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE key = 'site_config';

-- 自增内容版本号，让已缓存的 bootstrap 响应立即失效
UPDATE settings
SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT),
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE key = 'site_epoch';
