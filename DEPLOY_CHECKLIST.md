# xwubi 部署前检查清单

> 适用范围：Cloudflare Workers + Hono + D1 + KV(CACHE) + R2，双入口 `site.html` / `admin.html`。
> 推荐部署方式：`powershell -ExecutionPolicy Bypass -File scripts/deploy-remote.ps1`

## 1. 代码与构建

- [ ] 工作区改动已 review 并提交，`git status` 无意外文件
- [ ] `npm run typecheck` 通过（前台 + Worker 两个 tsconfig）
- [ ] `npm run build` 通过，无 Vite 警告/报错
- [ ] 构建产物包含 `dist/site.html`，且 **不再有** `dist/index.html`（本次外壳 SSR 改动）
- [ ] `dist/site.html` 内含 React 入口、`modulepreload` 与 `site.*.css`
- [ ] 没有把 `seeds/`、`.dev.vars`、密钥文件带进提交

## 2. 数据库（D1）

- [ ] 远程迁移已包含 `0026_content_lesson_order.sql`（教学排序索引）
- [ ] 部署脚本会自动执行：`npx wrangler d1 migrations apply xwubi --remote`
- [ ] 若手动部署，务必先迁移再发布 Worker
- [ ] 迁移列表确认：`npx wrangler d1 migrations list xwubi --remote`
- [ ] 重要数据变更前已备份（D1 控制台 Time Travel 或导出 SQL）
- [ ] 确认游标分页依赖字段有值：`SELECT COUNT(*) FROM content WHERE status='published' AND published_at IS NULL` 结果为 0（非 0 时依赖 `updated_at` 兜底，顺序仍稳定）

## 3. Cloudflare 资源与绑定

- [ ] `wrangler.toml` 中 D1 `database_id`、KV `id`、R2 `bucket_name` 均为真实值（无全 0 占位）
- [ ] `CACHE` KV 命名空间已存在，部署后预渲染片段可读写
- [ ] `BUCKET`（xwubi-media）已创建，媒体上传/读取权限正常
- [ ] `[placement] mode = "smart"` 保留
- [ ] `[assets] directory = "./dist"`、`not_found_handling = "none"` 保留

## 4. 环境变量与密钥

- [ ] 部署脚本已带 `--var ENVIRONMENT:production`
- [ ] 部署脚本已带 `--var SITE_ORIGIN:<正式域名>`（默认 `https://xwubi.hsinkwok.workers.dev`，改用自定义域名时务必覆盖）
- [ ] 需要邮件功能时已设置：`npx wrangler secret put RESEND_API_KEY`
- [ ] `MAIL_FROM` 非空且发件域名已在 Resend 验证；不需要发信可留空
- [ ] 自定义域名 / DNS 记录已就绪（若使用）
- [ ] 登录 Cookie 的 Secure 行为在 HTTPS 域下正常（部署后验证）

## 5. 部署前本地回归

- [ ] 首页 `/` 返回的 HTML 含 `site-shell`、`site-header`、`site-footer`（外壳 SSR）
- [ ] 内容页（如 `/news/news-86-opinion-21`）只有 1 个 `<h1>`，`<title>`、description、canonical、JSON-LD 正确
- [ ] 合集页 `/news` 首屏 24 条，「加载更多」后条目递增且无重复标题；第二页起请求只带 `cursor`
- [ ] 教学列表仍按 `page` 翻页正常（游标只在非教学列表启用）
- [ ] `/admin` 可打开，接口 401/登录流程正常，页面带 `noindex`
- [ ] `/media/*` 图片可访问，长缓存与 304 正常
- [ ] 移动端：导航折叠、版本切换（86/98/新世纪）、主题切换正常
- [ ] 浏览器控制台无报错，Network 无 4xx/5xx

本地验证命令示例（PowerShell）：

```powershell
curl.exe -s http://127.0.0.1:8790/ | Select-String 'site-shell'
curl.exe -s http://127.0.0.1:8790/news/news-86-opinion-21 | Select-String '<h1'
curl.exe -s "http://127.0.0.1:8790/api/site/collection?type=news&version=86&per_page=2"
```

## 6. 部署

- [ ] 关闭/确认本地 `wrangler dev` 不占用构建产物
- [ ] 执行部署（二选一）：
  - `powershell -ExecutionPolicy Bypass -File scripts/deploy-remote.ps1`
  - 或 `npx wrangler d1 migrations apply xwubi --remote` 后 `npm run deploy`
- [ ] 记录本次部署版本 / Deployment ID

## 7. 部署后冒烟检查

- [ ] `GET /api/health` 返回 `{"ok":true,"service":"xwubi"}`
- [ ] 首页、内容页、合集页各打开一次，首屏无整页位移
- [ ] HTML 响应头为 `Cache-Control: public, max-age=0, must-revalidate`
- [ ] `/assets/*` 为 `public, max-age=31536000, immutable`
- [ ] `/site.html` 直连返回 200 且带 `X-Robots-Tag: noindex`
- [ ] `/index.html` 返回 404（已改名，属预期；确认无外部链接依赖该路径）
- [ ] 登录 → 后台列表/编辑/发布 → 前台 5 分钟内可见（预渲染片段 TTL 300s；改站点配置会立即 bump epoch）
- [ ] 媒体上传后 `/media/...` 可访问
- [ ] 安全响应头存在：`X-Content-Type-Options`、`X-Frame-Options`、`Referrer-Policy`

## 8. 回滚预案

- [ ] 确认可回滚 Worker：`npx wrangler deployments list` / `npx wrangler rollback`
- [ ] 本次迁移 `0026` 仅新增索引，回滚代码时无需回滚数据库
- [ ] 回滚后清理/忽略新键：KV 中 `prerender:*` 片段带 `epoch` 与 `version`，旧代码不会读取，可让其自然过期（300s）
- [ ] 回滚后重新跑第 7 节冒烟检查
