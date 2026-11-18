-- 字体栈改为系统字体优先。
-- 原配置把 'Inter' / 'JetBrains Mono' 放在首位，但站点从未加载这两个 Web 字体，
-- 结果拉丁字符反而落到中文字体的西文字形上；改由系统 UI 字体渲染拉丁字符，中文回落平台黑体。
UPDATE settings
SET value = json_set(
      value,
      '$.theme.fonts.sans',
      'system-ui, -apple-system, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif',
      '$.theme.fonts.mono',
      'ui-monospace, SFMono-Regular, "Cascadia Mono", Menlo, Consolas, "Liberation Mono", monospace'
    ),
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE key = 'site_config';

-- 自增内容版本号，让已缓存的 bootstrap 响应立即失效（与 bumpEpoch 行为一致）
UPDATE settings
SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT),
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE key = 'site_epoch';
