-- 公开接口与后台状态页的热点索引；只增删索引，不改变表结构。

-- 反馈/投稿状态页按 access token 精确定位（原先需要全表扫描）
CREATE INDEX IF NOT EXISTS idx_feedback_access_token
  ON feedback (access_token_hash);

-- 练习篇目列表默认按 sort_order, title 排序
CREATE INDEX IF NOT EXISTS idx_practice_texts_order
  ON practice_texts (sort_order, title);

-- 详情页查询由 UNIQUE (type, slug, version) 自动索引覆盖，重复索引只增加写入成本
DROP INDEX IF EXISTS idx_content_type_slug;
