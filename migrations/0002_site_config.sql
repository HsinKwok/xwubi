-- 站点配置：前台的文案、主题、导航、首页区块、集合页与页脚全部由此下发。
-- 修改后不需要重新构建前端，下一次请求即生效。

INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('site_config', '{
  "brand": {
    "name": "xwubi",
    "mark": "五",
    "tagline": "把五笔拆成可以练的步子",
    "description": "面向 86、98 与新世纪版的五笔学习路径、资讯筛选与工具集合，内容人工核对，持续更新。"
  },
  "theme": {
    "light": {
      "brand": "#0FDC78",
      "brandStrong": "#08A45A",
      "ink": "#111110",
      "inkMuted": "#6A6A65",
      "line": "#E7E7E2",
      "surface": "#FFFFFF",
      "surfaceMuted": "#F6F6F2",
      "onBrand": "#062A16"
    },
    "dark": {
      "brand": "#32F08C",
      "brandStrong": "#0FDC78",
      "ink": "#F1F1EC",
      "inkMuted": "#98988F",
      "line": "#2A2A27",
      "surface": "#111110",
      "surfaceMuted": "#181816",
      "onBrand": "#062A16"
    },
    "fonts": {
      "sans": "\"Inter\", \"PingFang SC\", \"Hiragino Sans GB\", \"Microsoft YaHei\", system-ui, sans-serif",
      "mono": "\"JetBrains Mono\", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    },
    "radius": "4px",
    "maxWidth": "1080px",
    "defaultMode": "light"
  },
  "versions": [
    { "value": "86", "label": "86 版", "note": "用户最多，教程与词库最全" },
    { "value": "98", "label": "98 版", "note": "字根分布更规整" },
    { "value": "xsj", "label": "新世纪", "note": "编码思路更新，适合新学" }
  ],
  "defaultVersion": "86",
  "nav": [
    { "key": "learn", "label": "教学", "href": "/learn", "collection": "lesson" },
    { "key": "news", "label": "资讯", "href": "/news", "collection": "news" },
    { "key": "software", "label": "软件库", "href": "/software", "collection": "software" },
    { "key": "tools", "label": "工具", "href": "/tools", "collection": "tool" },
    { "key": "submit", "label": "投稿", "href": "/submit" },
    { "key": "about", "label": "关于", "href": "/about" }
  ],
  "header": {
    "versionLabel": "码表",
    "loginLabel": "登录",
    "staffLabel": "管理台",
    "themeLabel": "切换深浅色",
    "menuLabel": "菜单"
  },
  "home": {
    "sections": [
      {
        "kind": "hero",
        "eyebrow": "WUBI · 86 / 98 / XSJ",
        "title": "五笔不是背字根，\n是把输入练成习惯。",
        "lead": "从指法、字根到成词与提速，按四个阶段拆开练；每个版本标注适用码表，软件与资讯只留核对过的。",
        "actions": [
          { "label": "从第一阶段开始", "href": "/learn", "variant": "primary" },
          { "label": "先看版本区别", "href": "/software", "variant": "ghost" }
        ],
        "aside": {
          "label": "站点状态",
          "items": [
            { "label": "码表版本", "value": "3", "hint": "86 / 98 / 新世纪" },
            { "label": "固定标签", "value": "5", "hint": "资讯归档口径" },
            { "label": "更新方式", "value": "随发布", "hint": "内容核对后上线" }
          ]
        }
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
        "kind": "feature-grid",
        "eyebrow": "STRUCTURE",
        "title": "三条主线，各管一件事",
        "description": "教学负责练，资讯负责筛，软件库负责选；互不混在一起。",
        "items": [
          {
            "title": "教学",
            "description": "按阶段推进，每课有例字与练习，标明适用码表。",
            "meta": "四阶段 · 12 课时",
            "href": "/learn",
            "badge": "练"
          },
          {
            "title": "资讯",
            "description": "版本更新、码表词库与社区动态，固定五个标签归档。",
            "meta": "每周整理",
            "href": "/news",
            "badge": "筛"
          },
          {
            "title": "软件库",
            "description": "输入法、词库与辅助工具的横向对比，含四段上手教程。",
            "meta": "平台与版本对照",
            "href": "/software",
            "badge": "选"
          }
        ]
      },
      {
        "kind": "collection",
        "source": "lesson",
        "eyebrow": "LEARN",
        "title": "从这一课开始",
        "description": "按课时编号推进，不确定方向就先做第一阶段。",
        "limit": 3,
        "more": { "label": "完整学习路径", "href": "/learn" }
      },
      {
        "kind": "collection",
        "source": "news",
        "eyebrow": "NEWS",
        "title": "最近整理",
        "description": "只收有出处的内容，外链会标注原文。",
        "limit": 3,
        "more": { "label": "全部资讯", "href": "/news" }
      },
      {
        "kind": "steps",
        "eyebrow": "START",
        "title": "四周的节奏",
        "items": [
          { "label": "01", "title": "指法与键位", "description": "先把手放对，速度暂时不重要。" },
          { "label": "02", "title": "字根与拆字", "description": "按字根分区记忆，配合例字回看。" },
          { "label": "03", "title": "成词与标点", "description": "把常用词打顺，减少单字回退。" },
          { "label": "04", "title": "提速与纠错", "description": "用短文练习暴露问题，再回到对应课时。" }
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
        "description": "投稿与纠错入口正在接入，先浏览已经核对过的内容。",
        "actions": [{ "label": "浏览资讯", "href": "/news", "variant": "primary" }]
      }
    ]
  },
  "collections": {
    "lesson": {
      "eyebrow": "LEARN",
      "title": "教学",
      "description": "四个阶段、按课时编号推进。切换码表版本会只显示对应内容。",
      "filters": [
        {
          "key": "stage",
          "label": "阶段",
          "options": [
            { "value": "", "label": "全部" },
            { "value": "basic", "label": "指法与键位" },
            { "value": "shape", "label": "字根与拆字" },
            { "value": "practice", "label": "成词与标点" },
            { "value": "speed", "label": "提速与纠错" }
          ]
        }
      ],
      "empty": {
        "title": "这个版本还没有课时",
        "description": "换一个码表版本，或回到 86 版查看现有内容。"
      }
    },
    "news": {
      "eyebrow": "NEWS",
      "title": "资讯",
      "description": "版本更新、码表词库、软件工具与社区动态，固定五个标签归档。",
      "filters": [
        {
          "key": "tag",
          "label": "标签",
          "options": [
            { "value": "", "label": "全部" },
            { "value": "tag-version", "label": "版本更新" },
            { "value": "tag-code", "label": "码表与词库" },
            { "value": "tag-tool", "label": "软件与工具" },
            { "value": "tag-community", "label": "方案与社区" },
            { "value": "tag-opinion", "label": "长文与观点" }
          ]
        }
      ],
      "empty": {
        "title": "暂时没有这类资讯",
        "description": "换个标签看看，或稍后再来。"
      }
    },
    "software": {
      "eyebrow": "SOFTWARE",
      "title": "软件库",
      "description": "输入法、词库与辅助工具，按平台与码表版本列出差异。",
      "empty": {
        "title": "还没有收录软件",
        "description": "收录标准是能长期维护，并有明确的版本说明。"
      }
    },
    "tool": {
      "eyebrow": "TOOLS",
      "title": "工具",
      "description": "字根键位、拆字查询与练习辅助，打开即用。",
      "empty": {
        "title": "工具还在整理",
        "description": "先把学习路径走完，再回来看看。"
      }
    }
  },
  "pages": {
    "about": {
      "key": "about",
      "eyebrow": "ABOUT",
      "title": "关于 xwubi",
      "description": "一个把五笔资料重新整理、核对并保持更新的小站。",
      "sections": [
        {
          "kind": "quote",
          "text": "宁可少收一条，也不放未经核对的内容。",
          "attribution": "内容原则"
        },
        {
          "kind": "feature-grid",
          "title": "我们怎么整理",
          "items": [
            { "title": "标注版本", "description": "每条内容都写明适用的码表版本，通用内容标为 all。" },
            { "title": "核对来源", "description": "资讯保留原文链接与发布时间，软件注明版本与平台。" },
            { "title": "持续修订", "description": "内容改动留修订记录，发布与下架都会写入审计日志。" }
          ]
        },
        {
          "kind": "steps",
          "title": "更新节奏",
          "items": [
            { "label": "01", "title": "收集", "description": "来自投稿、社区反馈与编辑日常浏览。" },
            { "label": "02", "title": "核对", "description": "确认版本、来源与可复现的步骤。" },
            { "label": "03", "title": "发布", "description": "发布后进入资讯流，过期内容标记待复核。" }
          ]
        },
        {
          "kind": "cta",
          "title": "想参与整理？",
          "description": "投稿与纠错入口接入后会在这里公布。",
          "actions": [{ "label": "先看资讯", "href": "/news", "variant": "ghost" }]
        }
      ]
    }
  },
  "footer": {
    "note": "xwubi 是一个独立维护的五笔资料站，与任何输入法厂商无关。",
    "columns": [
      {
        "title": "浏览",
        "links": [
          { "label": "教学", "href": "/learn" },
          { "label": "资讯", "href": "/news" },
          { "label": "软件库", "href": "/software" },
          { "label": "工具", "href": "/tools" }
        ]
      },
      {
        "title": "关于",
        "links": [
          { "label": "关于本站", "href": "/about" },
          { "label": "投稿与纠错", "href": "/submit" },
          { "label": "登录", "href": "/login" },
          { "label": "管理台", "href": "/admin" }
        ]
      }
    ],
    "copyright": "© 2026 xwubi"
  },
  "labels": {
    "countUnit": "条",
    "skipToContent": "跳到主要内容",
    "backToCollection": "返回列表",
    "versionLabel": "适用版本",
    "updatedLabel": "更新于",
    "sourceLabel": "原文链接",
    "readMore": "阅读全文",
    "loading": "加载中",
    "retry": "重试",
    "errorTitle": "内容加载失败",
    "emptyTitle": "暂无内容",
    "emptyDescription": "换个筛选条件，或稍后再来。",
    "notFoundTitle": "页面不存在",
    "notFoundDescription": "链接可能已经调整，回到首页重新找找。",
    "backHome": "回到首页",
    "loginTitle": "登录",
    "loginDescription": "员工账号登录后可进入管理台。",
    "loginEmail": "邮箱",
    "loginPassword": "密码",
    "loginSubmit": "登录",
    "loginSubmitting": "正在登录…",
    "loginFailed": "登录失败，请重试",
    "logout": "退出登录",
    "menu": "菜单",
    "close": "关闭",
    "home": "首页",
    "allVersions": "全部版本",
    "generalVersion": "通用",
    "statsAria": "站点概览",
    "feedbackEyebrow": "FEEDBACK",
    "feedbackTitle": "页面有错误？",
    "feedbackDescription": "告诉我们哪里不对，我们会核对并修正。",
    "feedbackOpen": "反馈问题",
    "feedbackClose": "收起",
    "feedbackBody": "问题描述",
    "feedbackBodyPlaceholder": "例如：这一课的例字与字根对不上",
    "feedbackBodyRequired": "请先描述遇到的问题",
    "feedbackEmail": "邮箱（可选，便于回复）",
    "feedbackSubmit": "提交反馈",
    "feedbackSubmitting": "提交中…",
    "feedbackSuccess": "已收到反馈，谢谢！",
    "feedbackFailed": "提交失败，请稍后再试",
    "feedbackSubmitLink": "投稿或推荐内容 →",
    "submitEyebrow": "SUBMIT",
    "submitTitle": "投稿与推荐",
    "submitDescription": "有值得收录的资讯、软件，或发现页面有错误，都可以在这里提交。我们会人工核对后处理。",
    "submitKind": "投稿类型",
    "submitKindNews": "资讯投稿",
    "submitKindSoftware": "软件推荐",
    "submitKindCorrection": "页面纠错",
    "submitItemTitle": "标题",
    "submitItemTitlePlaceholder": "一句话说明要投稿或纠正的内容",
    "submitUrl": "相关链接",
    "submitPageUrl": "出现问题的页面",
    "submitNote": "补充说明",
    "submitNotePlaceholder": "可以补充理由、出处或需要修正的细节",
    "submitName": "怎么称呼你",
    "submitEmail": "邮箱（必填）",
    "submitAction": "提交",
    "submitSubmitting": "提交中…",
    "submitSuccessTitle": "已收到，谢谢！",
    "submitSuccessDescription": "我们会核对内容，处理结果会在站内更新。",
    "submitAgain": "再提交一条",
    "submitFailed": "提交失败，请稍后再试"
  }
}', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
