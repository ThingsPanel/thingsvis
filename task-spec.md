# 任务规范 (Task Specification) — P0 健壮性+代码质量+文档 (2026-02-28)

## 范围

三项 P0 任务，影响开源项目的首次使用体验：TASK-12 / TASK-07 / TASK-09

---

## TASK-12 P0 子任务

| # | 子任务 | 验收标准 |
|---|--------|----------|
| 12-A | `.env.example` SQLite 化 | DATABASE_URL 指向 `file:./prisma/dev.db`，PostgreSQL 放注释 |
| 12-B | Widget 级 ErrorBoundary | VisualEngine overlay 失败显示红框，不白屏 |

> 全局 ErrorBoundary 已存在于 App.tsx + ErrorBoundary.tsx ✅

---

## TASK-07 P0 子任务

| # | 子任务 | 验收标准 |
|---|--------|----------|
| 07-A | 清理 console.log | studio/server 中无裸 `console.log`（ESLint 豁免注释可例外保留） |
| 07-B | README 修复 | 路径一致、Plugin→Widget、Apache-2.0 确认 |

---

## TASK-09 P0 子任务

| # | 子任务 | 验收标准 |
|---|--------|----------|
| 09-A | README.md 快速开始+架构+Roadmap | 含 docker-compose 步骤、架构描述、路线图 |
| 09-B | README_ZH.md 中文同步 | 与英文版内容对等 |
| 09-C | CHANGELOG.md v0.1.0 | 主要功能列表存在 |
| 09-D | CONTRIBUTING.md | 文件存在或 README 不再引用 |

## 2. 验收标准
1. **嵌入模式正常显示**：在 ThingsPanel 等宿主环境以内嵌 iframe 方式加载 ThingsVis 编辑器（带有 `saveTarget=host` 等参数）时，不再跳转到登录页，能够正常接收 `tv:init` 消息并显示。
2. **体验模式正常运作**：在 ThingsVis 独立界面点击“免登录体验模式”时，能正确进入本地存储沙箱环境，不被拦截到 `/login`。
3. **云端模式受控**：标准的云端访问 `/editor` 时，如果不处于已登录状态且不是上述两种特例，依然应该被重定向到 `/login` 页面。
4. **统一状态管理**：`AuthContext` 需要能够清晰区分当前处于何种 `storageMode`（`local`, `cloud`, `embed`），并对上层路由守卫提供合理的认证状态支持。

## 3. 关联子任务
- **子任务 1**：改造 `AuthContext.tsx`，细化认证状态暴露。在 Embed 模式下和 Guest 体验模式下，提供绕过强制检查的机制，或者将 `isAuthenticated` 的定义拓宽。
- **子任务 2**：改造 `ProtectedRoute.tsx`，支持动态校验。根据当前的运行模式（URL 参数或 context 给出的 `storageMode`），动态决定是否跳过拦截。
- **子任务 3**：验证与测试。在当前通过运行环境（`pnpm dev:all` 与 `pnpm dev`）双边验证修改结果，确保所有三种模式表现符合预期。
