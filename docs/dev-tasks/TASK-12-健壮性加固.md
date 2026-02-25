# TASK-12：健壮性加固（防重构清单）

> **优先级**：🟡 P1
> **预估工时**：0.5-1 人天
> **前置依赖**：TASK-07（代码质量完成后）

---

## 背景

在全面审查代码库后，发现以下 **7 项** 不在现有任务覆盖范围内。如果不在 v0.1.0 中解决，部分将导致后续修改或影响开源项目的首次体验。

---

## 12.1 全局 ErrorBoundary（P0）

**现状**：`App.tsx` 无 `ErrorBoundary`，任何未捕获 React 错误 → 白屏

- [ ] 创建 `ErrorBoundary` 组件（或使用 `react-error-boundary`）
- [ ] 创建错误回退页面（含重试按钮 + 错误信息）
- [ ] 在 `App.tsx` 中包裹根组件

---

## 12.2 .env.example 创建（P0）

**现状**：仓库中无 `.env.example`，新用户 clone 后不知道配什么

- [ ] 创建 `apps/server/.env.example`，列出所有环境变量及说明
- [ ] 创建根目录 `.env.example`（如果需要）
- [ ] README 中引用 `.env.example`

```bash
# apps/server/.env.example
NODE_ENV=development
PORT=8000
DATABASE_URL=file:./prisma/dev.db
AUTH_SECRET=your-secret-key-here
AUTH_URL=http://localhost:3000
AUTH_TRUST_HOST=true
# ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
# SEED_ADMIN_EMAIL=admin@thingsvis.io
# SEED_ADMIN_PASSWORD=admin123
```

---

## 12.3 暗色模式切换与持久化（P1）

**现状**：CSS `.dark` 主题变量已定义，但无用户切换入口

- [ ] EditorTopNav 添加主题 toggle 按钮（🌞/🌙 图标）
- [ ] 读取 `localStorage('theme')` 初始化
- [ ] 切换时写入 `localStorage` + toggle `document.documentElement.classList`
- [ ] 尊重系统偏好 `prefers-color-scheme`

---

## 12.4 首屏 Loading 态（P1）

**现状**：应用启动时无加载指示，短暂白屏/跳动

- [ ] `index.html` 添加内联 CSS + spinner（JS 加载前就可见）
- [ ] Editor 组件添加 skeleton 加载态（在 bootstrap 期间显示）
- [ ] 项目切换时显示加载状态

---

## 12.5 SEO 基础（P1）

**现状**：未验证 favicon、Open Graph meta tags

- [ ] 确认/添加 `favicon.ico` + `apple-touch-icon.png`
- [ ] `index.html` 添加 `<title>` + `<meta name="description">` + `<meta og:*>`
- [ ] 添加 Social Preview 图片（1280×640px）

---

## 12.6 ProtectedRoute 补全（P0）

**现状**：`/data-sources`、`/settings/*` 等路由未经 `ProtectedRoute` 保护

- [ ] 审查 `App.tsx` 中所有路由
- [ ] 需认证的路由包裹 `<ProtectedRoute>`
- [ ] 未登录时自动重定向到 `/login`

---

## 12.7 CODE_OF_CONDUCT + CONTRIBUTING（P1）

**现状**：开源项目缺少社区基础文件

- [ ] 创建 `CODE_OF_CONDUCT.md`（使用 Contributor Covenant 模板）
- [ ] 创建 `CONTRIBUTING.md`（开发环境搭建 + PR 规范 + Issue 模板）
- [ ] GitHub Issue 模板（`.github/ISSUE_TEMPLATE/`）

---

## 验收标准

1. 任何组件报错不会导致白屏
2. clone 项目后可参照 `.env.example` 快速配置
3. 暗色模式可正常切换且刷新后保持
4. 首次加载有 loading 指示器
5. 分享链接时有正确的标题/描述/图标
6. 未登录访问受保护路由自动跳转登录页
7. GitHub 仓库 Community health 显示绿色标识
