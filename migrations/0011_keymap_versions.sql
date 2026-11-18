-- 码表版本并入统一分类表，并解除 content / submissions 的固定版本约束
-- domain = 'keymap_version'：86 / 98 / xsj …，由管理台「分类管理」统一维护

-- 1) 把 site_config.versions 复制到 categories，保持原有顺序
INSERT OR IGNORE INTO categories
  (id, domain, slug, label, hint, key_list, sort_order, created_at, updated_at)
SELECT
  'cat_ver_' || json_extract(je.value, '$.value'),
  'keymap_version',
  json_extract(je.value, '$.value'),
  json_extract(je.value, '$.label'),
  COALESCE(json_extract(je.value, '$.note'), ''),
  '',
  CAST(je.key AS INTEGER) + 1,
  '2026-11-15T00:00:00.000Z',
  '2026-11-15T00:00:00.000Z'
FROM settings AS s, json_each(s.value, '$.versions') AS je
WHERE s.key = 'site_config'
  AND json_extract(je.value, '$.value') IS NOT NULL;

-- 兜底：配置缺失时至少保留三个默认版本
INSERT OR IGNORE INTO categories
  (id, domain, slug, label, hint, key_list, sort_order, created_at, updated_at)
VALUES
  ('cat_ver_86', 'keymap_version', '86', '86 版', '用户最多，教程与词库最全', '', 1, '2026-11-15T00:00:00.000Z', '2026-11-15T00:00:00.000Z'),
  ('cat_ver_98', 'keymap_version', '98', '98 版', '字根分布更规整', '', 2, '2026-11-15T00:00:00.000Z', '2026-11-15T00:00:00.000Z'),
  ('cat_ver_xsj', 'keymap_version', 'xsj', '新世纪', '编码思路更新，适合新学', '', 3, '2026-11-15T00:00:00.000Z', '2026-11-15T00:00:00.000Z');

-- 2) 重建 content，去掉 version 的 CHECK 约束
--    D1 无法关闭外键，DROP TABLE 会级联删除子表数据，因此先备份再恢复。
CREATE TABLE _bak_submissions AS SELECT * FROM submissions;
DROP TABLE submissions;

CREATE TABLE _bak_content_revisions AS SELECT * FROM content_revisions;
CREATE TABLE _bak_content_tags AS SELECT * FROM content_tags;

CREATE TABLE content_new (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL CHECK (type IN ('lesson', 'news', 'software', 'tool')),
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
SELECT content_id, tag_id FROM _bak_content_tags;

DROP TABLE _bak_content_revisions;
DROP TABLE _bak_content_tags;

-- 3) 重建 submissions，去掉 version 的 CHECK 约束
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
