-- 统一分类：码表分区与文章分类
-- domain = 'keymap_zone'：前台字根键位图的五个分区（横/竖/撇/捺/折）
-- domain = 'practice_genre'：前台文章跟打的篇目分类（散文/赋…）

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  domain TEXT NOT NULL,
  slug TEXT NOT NULL,
  label TEXT NOT NULL,
  hint TEXT NOT NULL DEFAULT '',
  key_list TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_domain_slug
  ON categories (domain, slug);

CREATE INDEX IF NOT EXISTS idx_categories_domain_sort
  ON categories (domain, sort_order);

INSERT OR IGNORE INTO categories
  (id, domain, slug, label, hint, key_list, sort_order, created_at, updated_at)
VALUES
  ('cat_zone_heng', 'keymap_zone', 'heng', '横区', '11-15', 'G,F,D,S,A', 1, '2026-11-15T00:00:00.000Z', '2026-11-15T00:00:00.000Z'),
  ('cat_zone_shu', 'keymap_zone', 'shu', '竖区', '21-25', 'H,J,K,L,M', 2, '2026-11-15T00:00:00.000Z', '2026-11-15T00:00:00.000Z'),
  ('cat_zone_pie', 'keymap_zone', 'pie', '撇区', '31-35', 'T,R,E,W,Q', 3, '2026-11-15T00:00:00.000Z', '2026-11-15T00:00:00.000Z'),
  ('cat_zone_na', 'keymap_zone', 'na', '捺区', '41-45', 'Y,U,I,O,P', 4, '2026-11-15T00:00:00.000Z', '2026-11-15T00:00:00.000Z'),
  ('cat_zone_zhe', 'keymap_zone', 'zhe', '折区', '51-55', 'N,B,V,C,X', 5, '2026-11-15T00:00:00.000Z', '2026-11-15T00:00:00.000Z'),
  ('cat_genre_prose', 'practice_genre', 'prose', '散文', '', '', 1, '2026-11-15T00:00:00.000Z', '2026-11-15T00:00:00.000Z'),
  ('cat_genre_fu', 'practice_genre', 'fu', '赋', '', '', 2, '2026-11-15T00:00:00.000Z', '2026-11-15T00:00:00.000Z');
