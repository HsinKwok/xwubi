-- 统一分类体系（三层）：
--   ① content_type  内容类型（可增删，route 决定前台路径前缀）
--   ② lesson_stage  教学阶段（单选，前台「阶段」筛选来源）
--      practice_genre / keymap_zone / keymap_version 沿用既有分类
--   ③ tags          扁平标签，去掉 kind，可多选、可增长
-- 同时移除 content.type 的固定 CHECK，让内容类型真正由分类表驱动。

-- 1) 分类表增加前台路径字段（仅 content_type 使用）
ALTER TABLE categories ADD COLUMN route TEXT NOT NULL DEFAULT '';

-- 2) 内容类型种子：原有四种类型转为可管理数据
INSERT OR IGNORE INTO categories
  (id, domain, slug, label, hint, key_list, sort_order, route, created_at, updated_at)
VALUES
  ('cat_type_lesson',   'content_type', 'lesson',   '教学',   '按阶段推进的课时',   '', 1, '/learn',    '2026-11-16T00:00:00.000Z', '2026-11-16T00:00:00.000Z'),
  ('cat_type_news',     'content_type', 'news',     '资讯',   '版本更新与社区动态', '', 2, '/news',     '2026-11-16T00:00:00.000Z', '2026-11-16T00:00:00.000Z'),
  ('cat_type_software', 'content_type', 'software', '软件库', '输入法与辅助工具',   '', 3, '/software', '2026-11-16T00:00:00.000Z', '2026-11-16T00:00:00.000Z'),
  ('cat_type_tool',     'content_type', 'tool',     '工具',   '在线查询与练习',     '', 4, '/tools',    '2026-11-16T00:00:00.000Z', '2026-11-16T00:00:00.000Z');

-- 3) 教学阶段种子：沿用前台原有四个阶段的中文文案
INSERT OR IGNORE INTO categories
  (id, domain, slug, label, hint, key_list, sort_order, route, created_at, updated_at)
VALUES
  ('cat_stage_basic',    'lesson_stage', 'basic',    '指法与键位', '', '', 1, '', '2026-11-16T00:00:00.000Z', '2026-11-16T00:00:00.000Z'),
  ('cat_stage_shape',    'lesson_stage', 'shape',    '字根与拆字', '', '', 2, '', '2026-11-16T00:00:00.000Z', '2026-11-16T00:00:00.000Z'),
  ('cat_stage_practice', 'lesson_stage', 'practice', '成词与标点', '', '', 3, '', '2026-11-16T00:00:00.000Z', '2026-11-16T00:00:00.000Z'),
  ('cat_stage_speed',    'lesson_stage', 'speed',    '提速与纠错', '', '', 4, '', '2026-11-16T00:00:00.000Z', '2026-11-16T00:00:00.000Z');

-- 4) tags 去掉 kind：先备份，再重建，最后恢复内容关联
CREATE TABLE _bak_tags AS SELECT id, name, created_at FROM tags;
CREATE TABLE _bak_content_tags AS SELECT content_id, tag_id FROM content_tags;

DROP TABLE tags;

CREATE TABLE tags (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT INTO tags (id, name, created_at) SELECT id, name, created_at FROM _bak_tags;
INSERT INTO content_tags (content_id, tag_id) SELECT content_id, tag_id FROM _bak_content_tags;

DROP TABLE _bak_tags;
DROP TABLE _bak_content_tags;

-- 5) 重建 content，去掉 type 的固定 CHECK，允许后台新增内容类型
CREATE TABLE _bak_submissions AS SELECT * FROM submissions;
DROP TABLE submissions;

CREATE TABLE _bak_content_revisions AS SELECT * FROM content_revisions;
CREATE TABLE _bak_content_tags2 AS SELECT * FROM content_tags;

CREATE TABLE content_new (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  version     TEXT NOT NULL DEFAULT '86',
  title       TEXT NOT NULL,
  summary     TEXT NOT NULL DEFAULT '',
  body_md     TEXT NOT NULL DEFAULT '',
  meta_json   TEXT NOT NULL DEFAULT '{}',
  stage       TEXT,
  lesson_no   INTEGER,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'pending', 'published', 'needs_review', 'archived')),
  author_id   TEXT REFERENCES users (id),
  assignee_id TEXT REFERENCES users (id),
  verified_at TEXT,
  published_at TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (type, slug, version)
);

INSERT INTO content_new
  (id, type, slug, version, title, summary, body_md, meta_json, stage, lesson_no,
   sort_order, status, author_id, assignee_id, verified_at, published_at, created_at, updated_at)
SELECT
  id, type, slug, version, title, summary, body_md, meta_json, stage, lesson_no,
  sort_order, status, author_id, assignee_id, verified_at, published_at, created_at, updated_at
FROM content;

DROP TABLE content;
ALTER TABLE content_new RENAME TO content;

CREATE INDEX idx_content_type_status ON content (type, status);
CREATE INDEX idx_content_status_updated ON content (status, updated_at);
CREATE INDEX idx_content_version ON content (version);
CREATE INDEX idx_content_assignee ON content (assignee_id);
CREATE INDEX idx_content_verified ON content (verified_at);

INSERT INTO content_revisions
  (id, content_id, revision_no, title, summary, body_md, meta_json, editor_id, note, created_at)
SELECT
  id, content_id, revision_no, title, summary, body_md, meta_json, editor_id, note, created_at
FROM _bak_content_revisions;

INSERT INTO content_tags (content_id, tag_id)
SELECT content_id, tag_id FROM _bak_content_tags2;

DROP TABLE _bak_content_revisions;
DROP TABLE _bak_content_tags2;

CREATE TABLE submissions_new (
  id                 TEXT PRIMARY KEY,
  kind               TEXT NOT NULL CHECK (kind IN ('news', 'correction', 'software')),
  title              TEXT NOT NULL,
  url                TEXT,
  page_url           TEXT,
  version            TEXT,
  note               TEXT NOT NULL DEFAULT '',
  email              TEXT NOT NULL,
  display_name       TEXT,
  status             TEXT NOT NULL DEFAULT 'new'
                       CHECK (status IN ('new', 'confirmed', 'claimed', 'accepted', 'rejected', 'spam')),
  confirm_token_hash TEXT,
  access_token_hash  TEXT,
  confirmed_at       TEXT,
  assignee_id        TEXT REFERENCES users (id),
  content_id         TEXT REFERENCES content (id),
  reject_reason      TEXT,
  created_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT INTO submissions_new
  (id, kind, title, url, page_url, version, note, email, display_name, status,
   confirm_token_hash, access_token_hash, confirmed_at, assignee_id, content_id,
   reject_reason, created_at, updated_at)
SELECT
  id, kind, title, url, page_url, version, note, email, display_name, status,
  confirm_token_hash, access_token_hash, confirmed_at, assignee_id, content_id,
  reject_reason, created_at, updated_at
FROM _bak_submissions;

DROP TABLE _bak_submissions;
ALTER TABLE submissions_new RENAME TO submissions;

CREATE INDEX idx_submissions_status ON submissions (status, created_at);
CREATE INDEX idx_submissions_email ON submissions (email, created_at);
CREATE UNIQUE INDEX idx_submissions_access_token ON submissions (access_token_hash)
  WHERE access_token_hash IS NOT NULL;

-- 6) 清理 site_config 里写死的筛选：改由后端按分类表与实际用到的标签生成
--    同时补三个筛选文案，避免前端写死「全部 / 阶段 / 标签」
UPDATE settings
SET value = json_set(
      json_remove(value, '$.collections.lesson.filters', '$.collections.news.filters'),
      '$.labels.allOption', '全部',
      '$.labels.stageFilter', '阶段',
      '$.labels.tagFilter', '标签'
    ),
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE key = 'site_config';
