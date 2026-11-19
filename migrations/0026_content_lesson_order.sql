-- 教学列表按课次排序（lesson_no, sort_order, published_at），
-- 原索引只覆盖发布时间，这里补一条与之匹配的组合索引。
CREATE INDEX IF NOT EXISTS idx_content_lesson_order
  ON content (type, status, version, lesson_no, sort_order, published_at DESC);
