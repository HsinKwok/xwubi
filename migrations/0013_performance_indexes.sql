-- 公开列表与筛选的热点查询索引；仅新增索引，不改变表结构。
-- 公开列表：type + status + version + 发布时间排序
CREATE INDEX IF NOT EXISTS idx_content_public_list
  ON content (type, status, version, published_at DESC);

-- 公开列表按教学阶段筛选
CREATE INDEX IF NOT EXISTS idx_content_public_stage
  ON content (type, status, stage);

-- bootstrap 生成「哪些类型有阶段筛选」：status + stage
CREATE INDEX IF NOT EXISTS idx_content_status_stage
  ON content (status, stage);

-- 管理台默认按更新时间倒序；按类型筛选时同样走索引
CREATE INDEX IF NOT EXISTS idx_content_updated
  ON content (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_type_updated
  ON content (type, updated_at DESC);

-- 标签筛选：tag_id 查 content_id 时避免回表
CREATE INDEX IF NOT EXISTS idx_content_tags_tag_content
  ON content_tags (tag_id, content_id);
