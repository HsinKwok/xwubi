-- 搜狗五笔与冰凌输入法同时支持 86 / 98 / 新世纪码表，
-- 版本标记改为 all，避免 98、新世纪列表里查不到这两款输入法。

UPDATE content
SET version = 'all',
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE type = 'software'
  AND id IN ('cnt_sw_09', 'cnt_sw_12');

UPDATE settings
SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT),
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE key = 'site_epoch';
