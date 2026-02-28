# 🧠 ThingsVis 开发上下文文档

> **用途**：记录每次 AI 对话的改动历史，确保切换 AI 不丢失上下文
> **最后更新**：2026-03-01T00:00+08:00

---

## 项目概况

- **仓库**：`f:\coding\thingsvis`（monorepo，pnpm workspace + turborepo）
- **架构**：Module Federation 微前端，每个 Widget 是独立 Rspack 项目
- **SDK**：`packages/thingsvis-widget-sdk/`，提供 `defineWidget()` + `generateControls()` API
- **现有 Widget**：**15 个**
  - basic: text, rectangle, circle, line, switch, table（6个）
  - indicator: number-card（1个）
  - media: image, video-player, iframe（3个）
  - chart: echarts-line, echarts-bar, echarts-pie, echarts-gauge, uplot-line（5个）
- **注册机制**：`scripts/generate-registry.js` 从各 Widget 的 `package.json` 自动生成 `apps/studio/public/registry.json`
- **构建**：`pnpm build:widgets` 批量构建 + 生成 registry
- **服务端**：Next.js 15 + Prisma（SQLite 本地开发），端口 8000
- **主题架构**：CSS Variables 方案（`--w-bg` / `--w-fg` / `--w-axis`），IDE 主题与画布主题完全分离

## 任务总览状态

| 任务 | 状态 | 备注 |
|------|------|------|
| TASK-00 端到端可行性修复 | ✅ 完成 | |
| TASK-01 开源仓库迁移 | ⏸️ 需人工（最后做） | GitHub 新仓库 Squash 提交 |
| TASK-02 致命基础设施补全 | ✅ 完成 | |
| TASK-03 部署端口与服务器配置 | ✅ 代码完成 | 人工操作（服务器）最后做 |
| TASK-04 首页改造 | ✅ 完成 | |
| TASK-05 命名重构 Plugin→Widget | ✅ 完成 | |
| TASK-06 缺失组件补齐 | ✅ 完成 | 15个Widget全部就位；MQTT数据源适配器并入TASK-21 |
| TASK-07 代码质量与安全 | 🔲 未开始 | |
| TASK-08 发版工程 | 🔲 未开始 | |
| TASK-09 文档 | 🔲 未开始 | |
| TASK-10 GitHub仓库配置与社区推广 | ⏸️ 需人工（最后做） | |
| TASK-11 国际化i18n多语言 | ✅ 完成 | |
| TASK-12 健壮性加固 | 🔲 未开始 | |
| TASK-13 Auth修复与数据库初始化 | ✅ 完成 | |
| TASK-14 SDK核心升级 | ✅ 完成 | 14-B主题预设✅ 14-C零JS侵入CSS✅ 14-D生命周期ctx(locale/mode/visible/emit/on)✅ 14-E迁移机制(migrate hook)✅ |
| TASK-15 Widget迁移到SDK | ✅ 完成 | 所有15个Widget已使用@thingsvis/widget-sdk imports |
| TASK-16 Widget尺寸约束与元数据 | ✅ 完成 | 所有Widget有defaultSize + constraints；TransformControls强制minWidth/minHeight |
| TASK-17 数据预处理与组件间通信 | ✅ 合并到TASK-23 | 内容并入全局变量与联动系统；on/emit占位符已在TASK-14D实现 |
| TASK-18 画布背景与主题UI | ✅ 完成 | 画布背景色/网格修复/左侧面板折叠/暗色主题优化 |
| TASK-19 CLI增强与开发工具链 | ✅ 完成 | vis-cli 已有 validate/dev/build 三条命令 |
| TASK-20 开发者文档门户 | 🔲 未开始 | |
| **TASK-21 数据源协议v2（DSP v2）** | 🆕 新增 | 解耦ThingsPanel，通用适配器 |
| **TASK-22 交互控制组件体系** | 🆕 新增 | Switch/Button/Slider/Select等 |
| **TASK-23 全局变量与联动系统** | 🆕 新增 | DashboardVariables + ActionSystem |
| **TASK-24 JS数据转换沙箱** | 🆕 新增 | Web Worker安全执行用户脚本 |

---

## 改动记录

### 2026-03-01 会话 3 — TASK-14D/E + TASK-15~19 批量完成

#### 本次完成的任务

| 任务 | 内容 |
|------|------|
| **TASK-14D 生命周期上下文** | `WidgetOverlayContext` 新增 `locale/mode/visible/emit/on`；widgetRenderer.ts/GridStackCanvas.tsx/VisualEngine.ts 均已填充 |
| **TASK-14E 迁移机制** | `WidgetMainModule.migrate?` + `DefineWidgetConfig.migrate?` + `NodeSchema.widgetVersion?`；widgetRenderer.ts 在 createOverlay 时自动调用 |
| **TASK-15 SDK迁移** | 发现所有15个Widget已导入 `@thingsvis/widget-sdk`，确认完成 |
| **TASK-16 尺寸约束** | SDK/Schema 新增 `WidgetConstraints` 类型；所有15个Widget的 metadata.ts 补全 `defaultSize` + `constraints(minWidth/minHeight)`；`TransformControls.tsx` resize 时强制执行约束 |
| **TASK-17 合并** | TASK-17 文件标注"已合并到TASK-23"；`on/emit` 占位符在TASK-14D完成 |
| **TASK-19 CLI** | 发现 vis-cli 已包含 `validate/dev/build` 三条命令，确认完成 |

#### 关键文件改动

| 文件 | 改动 |
|------|------|
| `packages/thingsvis-widget-sdk/src/types.ts` | 新增 `WidgetConstraints` 类型；`WidgetOverlayContext` 新增5个字段；`WidgetMainModule` 新增 `defaultSize/constraints/resizable/migrate?` |
| `packages/thingsvis-widget-sdk/src/define-widget.ts` | `DefineWidgetConfig` 新增 `migrate?`；`defineWidget` 透传 `migrate` |
| `packages/thingsvis-schema/src/widget-module.ts` | `WidgetOverlayContext` + `WidgetMainModule` 同步添加新字段 |
| `packages/thingsvis-schema/src/node-schema.ts` | 新增 `widgetVersion?: string` 字段 |
| `packages/thingsvis-ui/src/engine/renderers/widgetRenderer.ts` | `nodeToOverlayContext` 填充 mode/locale/visible/emit/on；createOverlay 时调用 migrate |
| `packages/thingsvis-ui/src/components/GridStackCanvas.tsx` | `nodeToOverlayContext` 填充 mode/locale/visible/emit/on |
| `packages/thingsvis-ui/src/engine/VisualEngine.ts` | contextWithLinks 添加 mode/locale/visible/emit/on |
| `apps/studio/src/lib/registry/componentLoader.ts` | 新增 `resolvedWidgets` 同步缓存 + `getResolvedWidget()` 导出 |
| `apps/studio/src/components/tools/TransformControls.tsx` | `nodeConstraintsRef` + resize时读取并强制 minW/minH/maxW/maxH |
| 所有15个Widget `metadata.ts` | 统一补全 `defaultSize` + `constraints` |

#### 后续优先级（P0 剩余）

```
🔴 P0（影响开源可用性）：
1. TASK-12 健壮性加固（ErrorBoundary — Widget崩溃=白屏）
2. TASK-07 代码质量（console.log 清理 + ESLint 规则）
3. TASK-09 文档（README + Widget开发手册）
4. TASK-08 发版工程（CI/CD + pnpm build:all 验证）
```

---

### 2026-02-28 会话 2 — 战略规划 + 新任务创建

#### 新增任务（v0.2.0 核心能力）

| 文件 | 内容 |
|------|------|
| `TASK-21-数据源协议v2-DSPv2.md` | 数据源适配器协议，解耦ThingsPanel，JSONPath字段映射，write接口 |
| `TASK-22-交互控制组件体系.md` | Switch/Button/Slider/Input/Select/DateRangePicker/ValueCard/ProgressBar |
| `TASK-23-全局变量与联动系统.md` | DashboardVariables + ActionSystem（4种动作）+ 合并TASK-17内容 |
| `TASK-24-JS数据转换沙箱.md` | Web Worker安全执行用户脚本 |

#### 关键决策

1. **ThingsPanel 向后兼容**：DSP v2 中 ThingsPanel 降为 PlatformAdapter 插件，旧格式自动迁移，**TP 前端零改动**
2. **TASK-01（仓库迁移）推迟到最后**：发布前人工 Squash + Apache-2.0 新建 GitHub 仓库
3. **TASK-17 合并到 TASK-23**：数据预处理和组件间通信都属于联动系统范畴，合并避免重复
4. **Port 分配补充**：switch=3111（basic 区段）

#### 待执行优先级（当前推荐顺序）

```
立刻可执行：TASK-07（代码质量）+ TASK-09（文档）+ TASK-12（健壮性）→ v0.1.0 发版
然后：TASK-21（DSP v2）→ TASK-14（SDK）→ TASK-22（控制组件）→ TASK-23（联动）
```

---

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
- basic: 3100-3199
  - text=3102, rectangle=3104, circle=3105, line=3110
  - switch=3111, button=3112, slider=3113, input=3114, select=3115
  - value-card=3116, progress-bar=3117, date-range-picker=3118
- chart: 3200-3299（line=3201, bar=3202, pie=3203, gauge=3204）
- media: 3300-3399（image=3106→迁移到3301, iframe=3302, video=3303）
- server: 8000
- studio: 3000

