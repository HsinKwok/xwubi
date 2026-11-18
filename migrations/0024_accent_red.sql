-- 强调色由绿改为红（正红 #F60C3E），只影响强调元素：边框、链接、按钮、小标签。
-- 主题调色板由 site_config 下发，前端 CSS 里的值只是首屏兜底，两边必须同步，否则刷新后被覆盖回绿色。
-- 正文保持 --ink 深色；深色模式下换成更亮一档的红，避免在近黑底上发闷。

UPDATE settings
SET value = json_set(
      value,
      '$.theme.light.brand', '#F60C3E',
      '$.theme.light.brandStrong', '#C7092F',
      '$.theme.light.onBrand', '#FFFFFF',
      '$.theme.dark.brand', '#FF4D6A',
      '$.theme.dark.brandStrong', '#FF7A8F',
      '$.theme.dark.onBrand', '#18050A'
    ),
    updated_at = datetime('now')
WHERE key = 'site_config';
