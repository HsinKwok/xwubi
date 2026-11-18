-- 码表分页与公开 keymap 查询都按「版本 + 排序」取数，补上覆盖索引。
CREATE INDEX IF NOT EXISTS idx_wubi_roots_version_order
  ON wubi_roots (version, sort_order, key);

CREATE INDEX IF NOT EXISTS idx_wubi_examples_version_order
  ON wubi_examples (version, sort_order, code);
