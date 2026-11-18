-- 早期示例数据里的两条软件条目只有 example.com 占位链接，
-- 真实软件库（0020）上线后转为草稿，避免前台出现不可用的下载地址。

UPDATE content
SET status = 'draft',
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE type = 'software'
  AND id IN ('cnt_software_01', 'cnt_software_02');

UPDATE settings
SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT),
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE key = 'site_epoch';
