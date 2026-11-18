# Worker 路由表

约定：

- 权限标记：`P` 公开；`T` 一次性邮箱 token；`S` 任意在职员工；`A` 管理员；`E` 编辑；`R` 审校；`O` 运营。
- 公共页面走 SSR + 边缘缓存，缓存键带 `site_epoch`，发布时自增。
- `/api/*` 一律 `no-store`；只接受同源请求，非 GET 必须校验 `Origin`。
- 管理端 SPA 挂在 `/admin`，只通过 `/api/admin/*` 读写。
- `O` 只能创建、编辑 `type=news` 的内容，服务端按 `type` 二次校验。
- 删除均为软删除：内容 `archived`，用户 `disabled`。

## 1. 公共页面

| 方法 | 路径 | 权限 | 说明 | 缓存 |
|---|---|---|---|---|
| GET | `/` | P | 首页：学习路径、资讯流、工具位 | epoch |
| GET | `/learn` | P | 教学索引与四阶段路径 | epoch |
| GET | `/learn/:stage/:lesson` | P | 课时页，含例字表与折叠练习 | epoch |
| GET | `/news` | P | 资讯列表 | epoch |
| GET | `/news/tag/:tag` | P | 固定标签归档页 | epoch |
| GET | `/news/:slug` | P | 原创资讯详情；纯外链不生成此页 | epoch |
| GET | `/software` | P | 软件库与横向对比表 | epoch |
| GET | `/software/compare` | P | 指定软件的对比视图 | epoch |
| GET | `/software/:slug` | P | 软件详情与四段教程 | epoch |
| GET | `/tools` | P | 工具入口 | epoch |
| GET | `/tools/keymap` | P | 字根键位图 | epoch |
| GET | `/practice` | P | 在线打字：字根找键位、单字打编码、文章跟打 | epoch |
| GET | `/about` | P | 关于、更新记录、内容原则 | epoch |
| GET | `/rss.xml` | P | RSS | epoch |
| GET | `/sitemap.xml` | P | 站点地图 | epoch |
| GET | `/robots.txt` | P | 爬虫规则 | epoch |
| GET | `/api/health` | P | 存活检查，不暴露依赖细节 | 无 |

> 路由匹配顺序：`/software/compare` 必须在 `/software/:slug` 之前；`/news/tag/:tag` 同理。
>
> 当前已实现的前台页面：`/`、`/news`、`/software`、`/tools`、`/tools/keymap`、`/practice`、内容详情、`/about`、`/submit`、`/login`、`/profile`，以及 `/submit/confirm`、`/submit/status`、`/feedback/status`。RSS、sitemap、robots 仍为规划项。

## 2. 认证、账号与个人中心

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET | `/login` | P | 登录页 |
| POST | `/api/auth/login` | P | 邮箱 + 密码；需要 TOTP 时返回 `totp_required` 与 5 分钟挑战 token |
| POST | `/api/auth/totp` | P | 校验挑战 token + TOTP，完成登录 |
| POST | `/api/auth/logout` | S | 注销并吊销当前会话 |
| GET | `/api/auth/me` | S | 当前用户与角色 |
| POST | `/api/auth/invite/accept` | T | 接受邀请并设置密码 |
| POST | `/api/auth/password/reset-request` | P | 发送重置邮件，限流 |
| POST | `/api/auth/password/reset` | T | 用一次性 token 重置密码 |
| POST | `/api/auth/password/change` | S | 登录后修改密码 |
| GET | `/profile` | S | 个人中心页面（profile 布局） |
| GET | `/api/profile` | S | 个人资料与统计 |
| PATCH | `/api/profile` | S | 修改昵称等可编辑字段 |
| POST | `/api/profile/password` | S | 修改密码，保留当前会话并吊销其他会话 |
| POST | `/api/profile/totp/setup` | S | 密码确认后生成 TOTP 密钥与 otpauth 地址，暂存 10 分钟 |
| POST | `/api/profile/totp/enable` | S | 校验 6 位验证码并启用 TOTP |
| POST | `/api/profile/totp/disable` | S | 需要密码二次确认 |
| GET | `/api/profile/sessions` | S | 当前登录设备列表，含当前会话标记 |
| DELETE | `/api/profile/sessions/:id` | S | 吊销指定会话；吊销当前会话时同时退出 |
| DELETE | `/api/profile/sessions` | S | 吊销除当前会话外的全部设备 |

Cookie 与挑战：

- 会话：`__Host-xwubi_session`，HttpOnly、Secure、SameSite=Lax，12 小时；本地 HTTP 回退为 `xwubi_session`。
- TOTP 挑战：登录接口返回随机 token，服务端存入 KV 5 分钟，不写 Cookie；连续 5 次错误后失效。

## 3. 投稿与纠错

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET | `/submit` | P | 投稿表单 |
| POST | `/api/site/submissions` | P | 蜜罐 + 限流；写入 `new`，生成确认/查询 token 并发送确认邮件 |
| GET | `/submit/confirm` | P | 确认结果页（SPA） |
| GET | `/api/site/submit/confirm?token=` | T | 邮箱确认，状态转 `confirmed` |
| GET | `/submit/status` | P | 投稿进度页（SPA） |
| GET | `/api/site/submit/status?token=` | T | 凭查询 token 查看投稿进度 |
| GET | `/api/site/feedback/status?token=` | T | 凭查询 token 查看纠错进度 |
| GET | `/feedback/status` | P | 纠错进度页（SPA） |
| POST | `/api/site/feedback` | P | 蜜罐 + 限流；生成纠错工单与查询 token |

投稿规则：

- 同一 IP 每小时最多 5 条投稿、10 条纠错。
- `version` 只接受站点设置中启用的码表版本，其他值（含旧版本）按“通用”处理。
- 投稿必须填写邮箱；确认邮件发出后投稿才进入审核队列。
- 投稿与纠错各生成两枚随机 token（确认 / 查询），数据库只存 SHA-256 哈希。
- 确认与查询链接 30 天过期，查询链接请勿转发。

## 4. 管理端外壳

| 方法 | 路径 | 权限 | 说明 | 缓存 |
|---|---|---|---|---|
| GET | `/admin` | S | SPA 入口 | 入口 no-cache |
| GET | `/admin/*` | S | SPA 路由回退 | 入口 no-cache |
| GET | `/preview/content/:id` | S | 草稿预览，带 `no-store` | 无 |

## 5. 工作台与审核中心

`kind` 取值：`content`、`submission`、`feedback`。

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET | `/api/admin/dashboard` | S | 我的待办、健康度、最近动态 |
| GET | `/api/admin/review` | S | 合并队列，按 kind/status 筛选 |
| PATCH | `/api/admin/submissions/:id` | A / R / O | 认领、状态与备注 |
| PATCH | `/api/admin/feedback/:id` | A / R / O | 指派、状态与备注 |
| POST | `/api/admin/content/:id/reject` | A / R | 退回内容，必须带原因 |

## 6. 内容

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET | `/api/admin/content` | S | 列表；支持 type/version/status/tag/assignee/过期筛选 |
| POST | `/api/admin/content` | A / E / O | 新建；`O` 仅限 `news` |
| GET | `/api/admin/content/:id` | S | 详情，含当前修订号 |
| PATCH | `/api/admin/content/:id` | A / E / O | 保存草稿；带 `expected_updated_at` 做乐观锁 |
| POST | `/api/admin/content/:id/submit` | A / E / O | 提交审核 |
| POST | `/api/admin/content/:id/publish` | A / R | 发布，触发 epoch 自增与审计 |
| POST | `/api/admin/content/:id/unpublish` | A / R | 下架 |
| POST | `/api/admin/content/:id/archive` | A / R | 归档 |
| POST | `/api/admin/content/:id/reject` | A / R | 退回，必须带原因 |
| GET | `/api/admin/content/:id/revisions` | S | 修订列表 |

发布前服务端校验：

- 必填：`version`、`verified_at`（software / lesson）、`summary`。
- `type=lesson` 的 `meta_json.examples` 至少 3 条。
- `type=software` 的 `meta_json.platforms` 非空。
- 任一失败返回 `422`，不改变状态。

## 7. 用户与权限

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET | `/api/admin/users` | A | 用户列表与状态筛选 |
| POST | `/api/admin/users/invite` | A | 邀请员工，写入 `invites` 并发邮件 |
| POST | `/api/admin/users/:id/invite` | A | 重发待激活账号的邀请 |
| PATCH | `/api/admin/users/:id` | A | 修改姓名、角色、状态 |
| POST | `/api/admin/users/:id/password` | A | 设置临时密码并要求下次登录修改 |

角色：`admin`、`editor`、`reviewer`、`ops`。权限矩阵见设计稿。

## 8. 投稿与纠错管理

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET | `/api/admin/submissions` | A / R / O | 投稿队列 |
| PATCH | `/api/admin/submissions/:id` | A / R / O | 认领、状态与备注 |
| GET | `/api/admin/feedback` | A / R / O | 纠错工单 |
| PATCH | `/api/admin/feedback/:id` | A / R / O | 指派、状态与备注 |

## 9. 分类、标签、媒体、码表数据

统一分类体系分三层：

- **内容类型**：`categories.domain = 'content_type'`，`route` 字段决定前台列表与详情路径前缀（如 `/learn`）。`content.type` 只校验是否存在于分类表，因此后台可增删类型，无需改代码或数据库约束。
- **分类（单选）**：`lesson_stage`（教学阶段，`content.stage` 唯一维度和前台「阶段」筛选来源）、`practice_genre`（篇目分类）、`keymap_zone`、`keymap_version`。一个内容在一个维度下只能选一项。
- **标签（多选）**：`tags` 为扁平表，只有名称，所有内容类型共用；前台合集页的「标签」筛选按该类型已发布内容实际用到的标签生成。

管理台「分类与标签」一个入口分三组：内容分类 / 码表 / 标签。每个条目显示引用数，被引用时服务端拒绝删除。`site_config.collections.*.filters` 不再作为数据源，仅保留标题、描述与空状态文案。

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET | `/api/admin/tags` | S | 标签列表，含引用数 |
| POST | `/api/admin/tags` | A | 新建标签（仅名称） |
| PATCH | `/api/admin/tags/:id` | A | 标签重命名 |
| DELETE | `/api/admin/tags/:id` | A | 删除标签；仍被内容引用时返回 409 |
| GET | `/api/admin/media` | S | 媒体列表 |
| POST | `/api/admin/media` | A / E / O | 上传到 R2，返回 key 与元数据 |
| PATCH | `/api/admin/media/:id` | A / E / O | 修改媒体元数据 |
| DELETE | `/api/admin/media/:id` | A | 删除记录并清理 R2 |
| GET | `/api/site/keymap?version=` | P | 公开码表：字根、例字、分区与数量，边缘缓存 |
| GET | `/api/site/texts` | P | 文章练习篇目列表（不含正文）与文章分类，边缘缓存 |
| GET | `/api/site/texts/:id` | P | 单篇古文全文，含作者、朝代、字数 |
| GET | `/api/admin/categories?domain=` | S | 统一分类列表（内容类型 / 教学阶段 / 篇目分类 / 码表分区 / 码表版本），含引用数 |
| POST | `/api/admin/categories` | A | 新建分类；内容类型需指定唯一前台路径 |
| PATCH | `/api/admin/categories/:id` | A | 修改分类；标识变更会同步内容、篇目、字根与默认版本 |
| DELETE | `/api/admin/categories/:id` | A | 删除分类；仍被引用时返回 409 |
| GET | `/api/admin/practice-texts?q=&genre=` | S | 文章跟打篇目列表，支持标题/作者/朝代搜索与分类筛选 |
| GET | `/api/admin/practice-texts/:id` | S | 篇目详情（含正文） |
| POST | `/api/admin/practice-texts` | A / E | 新建篇目，自动统计汉字数 |
| PATCH | `/api/admin/practice-texts/:id` | A / E | 修改篇目，正文变更时重算字数 |
| DELETE | `/api/admin/practice-texts/:id` | A / E | 删除篇目 |
| GET | `/api/admin/data/roots?version=&q=` | S | 字根列表，支持搜索 |
| POST | `/api/admin/data/roots` | A | 新增字根；同版本键位唯一 |
| PATCH | `/api/admin/data/roots/:id` | A | 修改字根 |
| DELETE | `/api/admin/data/roots/:id` | A | 删除字根 |
| GET | `/api/admin/data/examples?version=&q=` | S | 例字列表，支持搜索 |
| POST | `/api/admin/data/examples` | A | 新增例字；同版本汉字唯一 |
| PATCH | `/api/admin/data/examples/:id` | A | 修改例字 |
| DELETE | `/api/admin/data/examples/:id` | A | 删除例字 |
| POST | `/api/admin/data/import` | A | CSV 导入；按版本 + 键位/汉字 upsert，单次 ≤1000 行 / 200KB |
| GET | `/api/admin/data/matrix` | S | 各版本字根/例字数量、缺失键位与更新时间 |

码表数据约定：

- 版本统一存于 `categories`（`domain = 'keymap_version'`），管理台「分类与标签 → 码表」维护标识、名称、备注与顺序；`/api/admin/versions` 与前台版本选择均由分类表派生，默认版本仍是 `site_config.defaultVersion`，指向某个版本标识。迁移内置 `86`、`98`、`xsj` 三个版本各 25 个键位字根，以及 1000 个常用字 + 250 个生僻字示例。
- 例字编码来自 CNMan/UnicodeCJK-WuBi；前台按每页 50 条分页展示，可翻页或搜索定位，避免一次渲染过多节点。
- 字根键位为 `A`-`Y` 单个字母，排序按 `sort_order`。
- CSV 表头：字根为 `key,mnemonic,roots,note,sort_order`，例字为 `char,code,roots,note,sort_order`；含逗号的字段用英文引号包裹。
- 导入只覆盖文件内出现的项，不删除文件外的记录。

文章练习：

- 篇目存于 `practice_texts`，迁移内置 100 篇（26 篇赋、74 篇散文）全文，按朝代排序。
- 分类统一存于 `categories`：`content_type` 为内容类型及其前台路径，`lesson_stage` 为教学阶段，`keymap_zone` 为码表五区（横/竖/撇/捺/折），`practice_genre` 为文章分类，`keymap_version` 为码表版本。管理台「分类与标签」页面统一维护，前台码表与文章跟打直接读取；写入后清理当前节点的 `/api/site/keymap`、`/api/site/bootstrap`（均含各版本）与 `/api/site/texts` 缓存，其他节点仍需等待 TTL 自然过期。
- 管理台「文章跟打」页面提供篇目增删改查（管理员与编辑可用），分类选项来自「分类与标签 → 内容分类」，字数按汉字统计；写入后会清理当前边缘节点的 `/api/site/texts` 与详情缓存，其他节点仍需等待 TTL（300 秒）自然过期。
- 前台「文章跟打」只比对汉字，标点、空格与拼音候选不计入判定；打满全篇自动结束。
- 「编码提示」复用 `/api/site/keymap` 的例字编码，未收录的生僻字不显示提示。

## 10. 系统、审计与缓存

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET | `/api/admin/settings` | A | 站点设置、默认码表版本 |
| GET | `/api/admin/versions` | S | 码表版本清单：`versions`、`contentVersions`（含 all）、`defaultVersion`，由分类表派生，供管理台各页面使用 |
| PATCH | `/api/admin/settings` | A | 更新设置；`versions` 以分类表为准，保存时只采用 `defaultVersion`，变更后自增 epoch |

审计日志目前只写入 `audit_logs`，尚未提供读取或导出接口。

## 11. 定时任务（非 HTTP）

| 触发 | 频率 | 说明 |
|---|---|---|
| `scheduled` | 每日 03:10 UTC | 将超过 12 个月未验证的 published 内容标记为 `needs_review` |
| `scheduled` | 每日 03:20 UTC | 外链 HEAD 检查，失效项写入审核队列（二期） |
| `scheduled` | 每周一 03:30 UTC | D1 导出到 R2，保留 8 份 |
| `scheduled` | 每日 08:00 UTC | 员工待办邮件摘要（二期） |

## 12. 中间件顺序

```
requestId
→ securityHeaders（CSP / HSTS / nosniff / Referrer-Policy）
→ rateLimit（仅公开写接口与登录）
→ session（读 Cookie，查 D1）
→ requireStaff / requireRole
→ verifyOrigin（所有非 GET）
→ handler
→ audit（写操作成功后异步记录）
```

## 13. 错误格式

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "当前角色不能发布内容",
    "request_id": "01JC..."
  }
}
```

状态码：`400` 参数错误、`401` 未登录、`403` 权限不足、`404` 不存在、`409` 版本冲突、`422` 发布校验失败、`429` 限流。

## 14. 缓存规则

- 公共页：`Cache-Control: public, max-age=0, s-maxage=600, stale-while-revalidate=60`。
- 管理端与 `/preview/*`：`no-store`。
- `/profile` 与 token 状态页走 SPA 外壳：`max-age=0, must-revalidate`，其中的 API 均为 `no-store`。
- API：`no-store`。
- 缓存键：`https://cache.internal/{site_epoch}{path}{sorted_query}`。
- 发布、下架、归档、标签或版本变更：`site_epoch + 1`，不逐页清理。
- 静态资源使用哈希文件名，长缓存。
