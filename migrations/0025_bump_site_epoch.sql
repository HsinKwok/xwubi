-- 调色板改动后递增站点 epoch，让公开接口的边缘缓存键立即失效。
-- 不递增的话，旧配色最多还会被 caches.default 复用 300 秒。

UPDATE settings
SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT),
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE key = 'site_epoch';
