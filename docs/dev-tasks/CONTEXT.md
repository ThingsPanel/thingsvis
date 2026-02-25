# 🧠 ThingsVis 开发上下文文档

> **用途**：记录每次 AI 对话的改动历史，确保切换 AI 不丢失上下文
> **最后更新**：2026-02-25T15:27+08:00

---

## 项目概况

- **仓库**：`f:\coding\thingsvis`（monorepo，pnpm workspace + turborepo）
- **架构**：Module Federation 微前端，每个 Widget 是独立 Rspack 项目
- **SDK**：`packages/thingsvis-widget-sdk/`，提供 `defineWidget()` + `generateControls()` API
- **现有 Widget**：8 个（text, rectangle, circle, line, image, echarts-line, **echarts-bar**, **echarts-pie**）
- **注册机制**：`scripts/generate-registry.js` 从各 Widget 的 `package.json` 自动生成 `apps/studio/public/registry.json`
- **构建**：`pnpm build:widgets` 批量构建 + 生成 registry
- **服务端**：Next.js 15 + Prisma（SQLite 本地开发），端口 8000

## 任务总览状态

| 任务 | 状态 | 备注 |
|------|------|------|
| TASK-00 端到端可行性修复 | ✅ 完成 | |
| TASK-01 开源仓库迁移 | ⏸️ 需人工 | |
| TASK-02 致命基础设施补全 | ✅ 完成 | |
| TASK-03 部署端口与服务器配置 | ✅ 代码完成 | |
| TASK-04 首页改造 | ✅ 完成 | |
| TASK-05 命名重构 Plugin→Widget | ✅ 完成 | |
| TASK-06 缺失组件补齐 | 🔄 P1 完成（bar+pie），MQTT 待做 | |
| TASK-07~12 | 🔲 未开始 | |
| TASK-13 Auth修复与数据库初始化 | ✅ 完成 | |
| TASK-14~20 | 🔲 未开始 | |

---

## 改动记录

### 2026-02-25 会话 1 — TASK-06 + TASK-13

#### TASK-06 — P1 组件开发

**策略**：策略 A（旧模式 `lib/types.ts`），待 TASK-15 统一迁移

**新增 16 个文件**：

| 组件 | 目录 | 关键属性 |
|------|------|---------|
| 柱状图 | `widgets/chart/echarts-bar/` | barColor, barWidth, showLabel, barBorderRadius |
| 饼图 | `widgets/chart/echarts-pie/` | radius, innerRadius(环形), roseType(玫瑰), labelType(4种) |

构建 ✅，registry 更新至 8 个 Widget

#### TASK-13 — Auth 修复

**修改文件（5 个）**：

| 文件 | 改动 |
|------|------|
| `prisma/schema.prisma` | provider `postgresql` → `sqlite` |
| `.env` | DATABASE_URL → `file:./dev.db`, AUTH_SECRET → `thingsvis-dev-secret-key` |
| `.env.example` | 同上，加 PostgreSQL 注释 |
| `src/middleware.ts` | `AUTH_SECRET` 加 fallback + 生产环境警告 |
| `src/app/api/v1/auth/login/route.ts` | catch 块加 `console.error` |
| `src/app/api/v1/auth/register/route.ts` | catch 块加 `console.error` |

**数据库初始化**：prisma generate + db push + seed ✅

**验证结果**：
- Login: `POST /api/v1/auth/login` → 200 + JWT ✅
- Register: `POST /api/v1/auth/register` → 201 ✅
- 重复邮箱: 400 `Email already registered` ✅

---

## 技术备忘

### 默认登录凭据
- **Email**: `admin@thingsvis.io`
- **Password**: `admin123`

### 数据库初始化命令
```bash
cd apps/server
npx prisma generate
npx prisma db push
npx tsx scripts/seed.ts
```

### 新建 Widget 标准步骤

1. 创建 `widgets/<category>/<name>/` 目录
2. 创建 `package.json`（设置 name, scripts.dev 端口, thingsvis.displayName/icon）
3. 创建 `rspack.config.js`（调用 `createWidgetConfig(__dirname, { port: N })`）
4. 创建 `tsconfig.json`
5. 创建 `src/metadata.ts`（id, name, category, icon, version）
6. 创建 `src/schema.ts`（Zod schema + 默认 Props）
7. 创建 `src/controls.ts`（调用 `generateControls()`）
8. 创建 `src/lib/types.ts`（目前旧模式需要复制，TASK-15 后改为 SDK import）
9. 创建 `src/index.ts`（buildOption + createOverlay + export Main）
10. 运行 `pnpm registry:generate` 更新 registry
11. 运行 `pnpm build:widgets` 构建验证

### Port 分配规范
- basic: 3100-3199（text=3102, rectangle=3104, circle=3105, line=3110）
- chart: 3200-3299（line=3201, bar=3202, pie=3203）
- media: 3106+（image=3106）
- server: 8000
- studio: 3000

