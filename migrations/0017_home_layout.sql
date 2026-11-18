-- 首页改为「精简页头 + 左侧混排流 / 右侧推广位 + 学习路线长卡」。
-- 首页区块完全由 site_config.home.sections 驱动，这里整体替换为新的配置。
UPDATE settings
SET value = json_set(
      value,
      '$.home.sections',
      json('[
        {
          "kind": "hero",
          "eyebrow": "WUBI · 86 / 98 / XSJ",
          "title": "五笔不是背字根，\n是把输入练成习惯。",
          "lead": "从指法、字根到成词与提速，按四个阶段拆开练；每个版本标注适用码表，软件与资讯只留核对过的。",
          "actions": [
            { "label": "从第一阶段开始", "href": "/learn", "variant": "primary" },
            { "label": "先看版本区别", "href": "/software", "variant": "ghost" }
          ]
        },
        {
          "kind": "stats",
          "items": [
            { "label": "课时", "value": "12", "hint": "四阶段拆解" },
            { "label": "资讯", "value": "人工核对", "hint": "标注来源与时间" },
            { "label": "软件", "value": "横向对比", "hint": "平台与版本" },
            { "label": "工具", "value": "字根 / 键位", "hint": "随时可查" }
          ]
        },
        {
          "kind": "feed",
          "eyebrow": "LATEST",
          "title": "最新收录",
          "description": "教学、资讯、软件与工具按最近核对时间混排，打开就是当前码表下的内容。",
          "limit": 8,
          "sources": [
            { "type": "lesson", "label": "教学" },
            { "type": "news", "label": "资讯" },
            { "type": "software", "label": "软件" },
            { "type": "tool", "label": "工具" }
          ],
          "more": { "label": "全部资讯", "href": "/news" }
        },
        {
          "kind": "rail",
          "eyebrow": "SHORTCUT",
          "cards": [
            {
              "label": "工具",
              "title": "字根键位图",
              "description": "按 25 个键位查口诀、代表字根与例字",
              "href": "/tools/keymap"
            },
            {
              "label": "练习",
              "title": "在线打字",
              "description": "字根找键位、单字打编码，实时统计正确率",
              "href": "/practice"
            },
            {
              "label": "投稿",
              "title": "纠错与推荐",
              "description": "发现错误或想补充软件，直接提交给我们",
              "href": "/submit"
            }
          ],
          "recent": {
            "source": "software",
            "title": "软件库更新",
            "limit": 3,
            "more": { "label": "全部软件", "href": "/software" }
          }
        },
        {
          "kind": "steps",
          "variant": "path",
          "eyebrow": "START",
          "title": "四周的节奏",
          "description": "按阶段推进，每一周只解决一件事；练完再回到对应课时查漏。",
          "items": [
            { "label": "01", "title": "指法与键位", "description": "先把手放对，速度暂时不重要。" },
            { "label": "02", "title": "字根与拆字", "description": "按字根分区记忆，配合例字回看。" },
            { "label": "03", "title": "成词与标点", "description": "把常用词打顺，减少单字回退。" },
            { "label": "04", "title": "提速与纠错", "description": "用短文练习暴露问题，再回到对应课时。" }
          ],
          "actions": [
            { "label": "从第一阶段开始", "href": "/learn", "variant": "primary" },
            { "label": "字根速查", "href": "/tools/keymap", "variant": "ghost" }
          ]
        },
        {
          "kind": "quote",
          "text": "先把每一个字打对，再谈快。",
          "attribution": "xwubi 编辑原则"
        },
        {
          "kind": "cta",
          "title": "发现错误或想补充？",
          "description": "投稿与纠错都会进入审核队列，核对后标注来源上线。",
          "actions": [{ "label": "提交内容", "href": "/submit", "variant": "primary" }]
        }
      ]')
    ),
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE key = 'site_config';

-- 自增内容版本号，让已缓存的 bootstrap 响应立即失效（与 bumpEpoch 行为一致）
UPDATE settings
SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT),
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE key = 'site_epoch';
