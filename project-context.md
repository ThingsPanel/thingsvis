# Project Context

## Architecture Overview
ThingsVis 是一个基于 React 的工业 IoT Dashboard 编辑器 (Studio)，采用 monorepo 架构（pnpm workspaces + turbo）。

### 核心包
- **`apps/studio`**: 编辑器主应用，Vite + React
- **`packages/thingsvis-kernel`**: 状态管理核心（Zustand），包含 NodeState、ConnectionState 等
- **`packages/thingsvis-ui`**: 画布渲染引擎（VisualEngine + Leafer），提供 CanvasView 组件
- **`packages/thingsvis-widget-sdk`**: Widget 开发 SDK，提供 `defineWidget` 一站式定义 API
- **`packages/thingsvis-schema`**: 类型定义
- **`widgets/`**: 各类 Widget 组件源码

### 画布渲染架构（关键！）
```
CanvasView (apps/studio)
├── UI_CanvasView (packages/thingsvis-ui)
│   ├── Leafer Canvas (底层 - 交互占位 Rect)
│   ├── overlayRoot (z-index: 5 - DOM overlay, ECharts/HTML 内容渲染)
│   └── Grid background
├── proxy-layer (z-index: 20 - 透明 node-proxy-target div)
│   ├── .node-proxy-target[data-node-id] (每个节点对应一个透明 div)
│   └── TransformControls (Moveable + Selecto 拖拽/选择/缩放)
├── LineConnectionTool
└── CreateToolLayer
```

### Widget 加载流程
1. `registry.json` 定义组件元数据和加载地址
2. `componentLoader.ts` 根据 `debugSource` 决定加载方式（static/local/remote）
3. `VisualEngine.sync()` → `createWidgetRenderer()` → `createOverlay()` 渲染到 overlayRoot
4. proxy-layer 中对应的 `node-proxy-target` 接收拖拽/选择事件

## Key Technical Decisions
- **多重认证旁路设计**: ProtectedRoute 不再一刀切判定 `isAuthenticated`。遇到 `storageMode === 'embed'` 或 `isGuestMode === true` 自动开启免登录白名单，适配 ThingsVis 作为下层 UI Builder 和 Sandbox 的情况。
- **主题解耦**: IDE 主题与画布主题完全分离，画布使用 CSS Variables (`--w-bg`, `--w-fg`, `--w-axis`, `--workspace-bg`)
- **Widget 定义**: 新组件使用 `defineWidget()` API，旧组件使用 `create/createOverlay` 模式
- **拖拽分层**: overlay 负责视觉渲染，proxy-layer 负责交互事件（Moveable/Selecto）
- **构建部署**: Widget 通过 Rspack 构建，Module Federation 远程加载
- **字体策略**: 使用系统字体栈（Excalidraw 风格），14px 基础字号，开启抗锯齿
- **组件库布局**: 3列网格布局，紧凑卡片设计（64px 高度，12px 标签文字）

## Current State
- **TASK-09 文档完善完成** — README.md 添加 Roadmap；README_ZH.md 全面同步（Plugin→Widget、路径、许可证）；新建 CHANGELOG.md（v0.1.0）和 CONTRIBUTING.md。
- **TASK-12 健壮性加固完成** — `.env.example` 改为 SQLite 默认；Widget 渲染崩溃从白屏改为红色错误占位框；全局 React ErrorBoundary 已就位。
- **TASK-07 代码质量完成** — Studio 源码 console.log 全清理；message-router 有意日志加 eslint-disable；README.md Plugin→Widget 命名全部修正，路径 plugins/→widgets/ 已修正。
- **统一认证网关重构完成** — 修复了 ThingsPanel 嵌入模式以及独立沙盒体验模式与全局登录拦截器互相冲突的认证问题，实现了 `storageMode`（_local, cloud, embed_） 的动态认证分流。
- 主题架构重构完成（CSS Variables 方案）
- **isDark 残留全面清理完成** — 所有 Widget 改用 `resolveWidgetColors()` 从 CSS 变量获取颜色
- 编辑器 ↔ 画布主题彻底解耦完成
- 仪表盘/饼图等组件拖拽修复完成
- 上传图片不显示问题已修复（rsbuild proxy 增加 /uploads 代理）
- **网格(Grid)布局模式下拖拽平移及无阴影/无居中的表现错误已修复**
- **图层面板 (LayerPanel) 缺陷已修复**
- **UI 字体和布局优化完成**
- **左侧面板可折叠**

## Known Issues / Risks
1. **部分组件缺少 SDK 依赖**: circle、line、rectangle 等未在 package.json 引入 SDK
2. **生产环境上传图片路径**: 生产环境需要 Nginx 等反向代理统一将 `/uploads` 转发到后端服务提供的静态文件路径
3. **GridStackCanvas lint**: `disableOneColumnMode` 属性在 gridstack.js 新版中可能已改名或移除（已有 lint 警告，暂未修复）
4. **echarts-line locales 重复**: metadata 和 Main 导出中 locales 重复声明（已有 lint 警告，暂未修复）

## Domain Knowledge
- 渲染引擎: `VisualEngine` (packages/thingsvis-ui/src/engine/)
- Widget 加载: `componentLoader.ts` + `registryClient.ts`
- 拖拽系统: `TransformControls.tsx` (Moveable + Selecto)
- Widget SDK: `defineWidget` (packages/thingsvis-widget-sdk/src/define-widget.ts)
- **开发代理架构**: Studio(3000) 通过 rsbuild proxy 转发 `/api` 和 `/uploads` 到 Server(8000)
- **浏览器存储与 Guest 账户机制**: 无 token 用户可通过 localStorage 存取体验模式临时状态。
