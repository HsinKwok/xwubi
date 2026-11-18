-- 双栏首页需要更宽的内容区：主内容宽度由 theme.maxWidth 下发，
-- 这里与 site.css 的 --max-w 默认值对齐为 1240px。
UPDATE settings
SET value = json_set(value, '$.theme.maxWidth', '1240px'),
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE key = 'site_config';

-- 自增内容版本号，让已缓存的 bootstrap 响应立即失效（与 bumpEpoch 行为一致）
UPDATE settings
SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT),
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE key = 'site_epoch';
