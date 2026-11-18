-- xwubi / D1 初始 schema
-- 约定：
--   1. 业务主键由应用侧生成（ULID / UUID），修订与审计使用自增。
--   2. 时间统一存 UTC ISO 8601 字符串，例如 2026-11-15T03:12:45.123Z。
--   3. content.type  = lesson | news | software | tool
--      content.version = 86 | 98 | xsj | all
--   4. 不做物理删除：content 用 archived，users 用 disabled。
--   5. 类型专属字段放 meta_json，公共查询字段单独建列。

CREATE TABLE users (
  id                    TEXT PRIMARY KEY,
  email                 TEXT NOT NULL UNIQUE,
  name                  TEXT NOT NULL,
  role                  TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'reviewer', 'ops')),
  password_hash         TEXT,
  totp_secret           TEXT,
  totp_enabled          INTEGER NOT NULL DEFAULT 0 CHECK (totp_enabled IN (0, 1)),
  status                TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'disabled')),
  must_change_password  INTEGER NOT NULL DEFAULT 1 CHECK (must_change_password IN (0, 1)),
  last_login_at         TEXT,
  created_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_status ON users (status);

CREATE TABLE invites (
  id          TEXT PRIMARY KEY,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'reviewer', 'ops')),
  token_hash  TEXT NOT NULL UNIQUE,
  invited_by  TEXT REFERENCES users (id),
  expires_at  TEXT NOT NULL,
  accepted_at TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_invites_email ON invites (email);

CREATE TABLE sessions (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TEXT NOT NULL,
  ip          TEXT,
  user_agent  TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_sessions_user ON sessions (user_id);
CREATE INDEX idx_sessions_expires ON sessions (expires_at);

CREATE TABLE password_resets (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TEXT NOT NULL,
  used_at     TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_password_resets_user ON password_resets (user_id);

CREATE TABLE login_events (
  id          TEXT PRIMARY KEY,
  email       TEXT NOT NULL,
  ip          TEXT,
  user_agent  TEXT,
  success     INTEGER NOT NULL CHECK (success IN (0, 1)),
  reason      TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_login_events_email ON login_events (email, created_at);
CREATE INDEX idx_login_events_ip ON login_events (ip, created_at);

CREATE TABLE content (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL CHECK (type IN ('lesson', 'news', 'software', 'tool')),
  slug        TEXT NOT NULL,
  version     TEXT NOT NULL DEFAULT '86' CHECK (version IN ('86', '98', 'xsj', 'all')),
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

CREATE INDEX idx_content_type_status ON content (type, status);
CREATE INDEX idx_content_status_updated ON content (status, updated_at);
CREATE INDEX idx_content_version ON content (version);
CREATE INDEX idx_content_assignee ON content (assignee_id);
CREATE INDEX idx_content_verified ON content (verified_at);

CREATE TABLE content_revisions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id  TEXT NOT NULL REFERENCES content (id) ON DELETE CASCADE,
  revision_no INTEGER NOT NULL,
  title       TEXT NOT NULL,
  summary     TEXT NOT NULL DEFAULT '',
  body_md     TEXT NOT NULL DEFAULT '',
  meta_json   TEXT NOT NULL DEFAULT '{}',
  editor_id   TEXT REFERENCES users (id),
  note        TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (content_id, revision_no)
);

CREATE INDEX idx_content_revisions_content ON content_revisions (content_id, revision_no DESC);

CREATE TABLE tags (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  kind       TEXT NOT NULL DEFAULT 'topic' CHECK (kind IN ('topic', 'software', 'version')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE content_tags (
  content_id TEXT NOT NULL REFERENCES content (id) ON DELETE CASCADE,
  tag_id     TEXT NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, tag_id)
);

CREATE INDEX idx_content_tags_tag ON content_tags (tag_id);

CREATE TABLE submissions (
  id                 TEXT PRIMARY KEY,
  kind               TEXT NOT NULL CHECK (kind IN ('news', 'correction', 'software')),
  title              TEXT NOT NULL,
  url                TEXT,
  page_url           TEXT,
  version            TEXT CHECK (version IN ('86', '98', 'xsj', 'all')),
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

CREATE INDEX idx_submissions_status ON submissions (status, created_at);
CREATE INDEX idx_submissions_email ON submissions (email, created_at);
CREATE UNIQUE INDEX idx_submissions_access_token ON submissions (access_token_hash)
  WHERE access_token_hash IS NOT NULL;

CREATE TABLE feedback (
  id                TEXT PRIMARY KEY,
  page_url          TEXT NOT NULL,
  version           TEXT,
  body              TEXT NOT NULL,
  email             TEXT,
  screenshot_key    TEXT,
  status            TEXT NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open', 'assigned', 'fixed', 'closed', 'spam')),
  access_token_hash TEXT,
  assignee_id       TEXT REFERENCES users (id),
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_feedback_status ON feedback (status, created_at);
CREATE INDEX idx_feedback_assignee ON feedback (assignee_id);

CREATE TABLE audit_logs (
  id          TEXT PRIMARY KEY,
  actor_id    TEXT REFERENCES users (id),
  action      TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id   TEXT,
  summary     TEXT NOT NULL DEFAULT '',
  diff_json   TEXT,
  ip          TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_audit_target ON audit_logs (target_type, target_id, created_at);
CREATE INDEX idx_audit_actor ON audit_logs (actor_id, created_at);

CREATE TABLE media (
  id          TEXT PRIMARY KEY,
  r2_key      TEXT NOT NULL UNIQUE,
  filename    TEXT NOT NULL,
  mime        TEXT NOT NULL,
  size        INTEGER NOT NULL,
  version     TEXT,
  alt         TEXT NOT NULL DEFAULT '',
  uploaded_by TEXT REFERENCES users (id),
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_media_version ON media (version);

CREATE TABLE settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_by TEXT REFERENCES users (id),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- 初始数据：站点开关与固定资讯标签
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('site_title', 'xwubi'),
  ('site_epoch', '1'),
  ('enabled_versions', '["86","98","xsj"]');

INSERT OR IGNORE INTO tags (id, name, kind) VALUES
  ('tag-version', '版本更新', 'topic'),
  ('tag-code', '码表与词库', 'topic'),
  ('tag-tool', '软件与工具', 'topic'),
  ('tag-community', '方案与社区', 'topic'),
  ('tag-opinion', '长文与观点', 'topic');
