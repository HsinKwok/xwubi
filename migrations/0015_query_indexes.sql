-- 详情页与媒体列表的热点查询索引；仅新增索引，不改变表结构。
-- 公开详情：type + slug 精确定位，避免每次浏览文章都全表扫描
CREATE INDEX IF NOT EXISTS idx_content_type_slug
  ON content (type, slug);

-- 管理台媒体库：默认按创建时间倒序分页
CREATE INDEX IF NOT EXISTS idx_media_created
  ON media (created_at DESC);

-- 媒体库按版本筛选时同样保持时间倒序
CREATE INDEX IF NOT EXISTS idx_media_version_created
  ON media (version, created_at DESC);
