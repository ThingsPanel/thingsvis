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
- **主题解耦**: IDE 主题与画布主题完全分离，画布使用 CSS Variables (`--w-bg`, `--w-fg`, `--w-axis`, `--workspace-bg`)
- **Widget 定义**: 新组件使用 `defineWidget()` API，旧组件使用 `create/createOverlay` 模式
- **拖拽分层**: overlay 负责视觉渲染，proxy-layer 负责交互事件（Moveable/Selecto）
- **构建部署**: Widget 通过 Rspack 构建，Module Federation 远程加载
- **字体策略**: 使用系统字体栈（Excalidraw 风格），14px 基础字号，开启抗锯齿
- **组件库布局**: 3列网格布局，紧凑卡片设计（64px 高度，12px 标签文字）

## Current State
- 主题架构重构完成（CSS Variables 方案）
- **工作区背景颜色已改为红色 (#ff3b30)** - 新增 `--workspace-bg` CSS 变量
- **网格只在画布区域显示** - Fixed/Grid 模式下网格限定在 artboard 区域内绘制
- **isDark 残留全面清理完成** — 所有 Widget 改用 `resolveWidgetColors()` 从 CSS 变量获取颜色
- 编辑器 ↔ 画布主题彻底解耦完成
- 仪表盘/饼图等组件拖拽修复完成
- 上传图片不显示问题已修复（rsbuild proxy 增加 /uploads 代理）
- **网格(Grid)布局模式下拖拽平移及无阴影/无居中的表现错误已修复**（修正了 `GridStackCanvas.tsx` 中静默 CSS 解析问题）
- **图层面板 (LayerPanel) 缺陷已修复** — 修复了未绑定关联 i18n 导致的多语言文本漏译，以及通过将底层 `getProjectState` 中 `nodes` 序列与 `layerOrder` 强写对齐的方法，根治了图层重新拖拽排序后保存失败的痛点。
- **清除连线组件无关 Debug 信息** — 在 `LineConnectionTool.tsx` 中删除了左上角伴随产生的黄色 Debug 提示窗，避免干扰用户视线。
- **UI 字体和布局优化完成** — 借鉴 Excalidraw 设置系统字体栈（14px 基础字号），组件库改为 3 列紧凑布局。
- **左侧面板可折叠** — 默认隐藏，点击工具栏按钮可展开，增加关闭按钮
- **UI 视觉风格优化** — 采用 Excalidraw 风格的柔和色调和阴影效果，圆角加大，边框更柔和
- **组件命名规范化** — `uPlot时序图` 重命名为 `时序图`（英文 Time Series），去除技术实现细节暴露。

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
- **图片上传流程**: 前端上传 → Server 保存到 `apps/server/public/uploads/` → 返回相对 URL → 前端拼接为绝对 URL → rsbuild proxy 转发到 Server 提供静态文件
- **字体配置**: 系统字体栈定义在 `apps/studio/src/index.css` 的 `@layer base` 中
- **组件库布局**: 位于 `apps/studio/src/components/LeftPanel/ComponentsList.tsx`
