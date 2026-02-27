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
- **主题解耦**: IDE 主题与画布主题完全分离，画布使用 CSS Variables (`--w-bg`, `--w-fg`, `--w-axis`)
- **Widget 定义**: 新组件使用 `defineWidget()` API，旧组件使用 `create/createOverlay` 模式
- **拖拽分层**: overlay 负责视觉渲染，proxy-layer 负责交互事件（Moveable/Selecto）
- **构建部署**: Widget 通过 Rspack 构建，Module Federation 远程加载

## Current State
- 主题架构重构完成（CSS Variables 方案）
- **当前任务**: 修复仪表盘/饼图等组件无法拖拽
  - 确认 dist 构建产物损坏（8个组件的 dist 变成文件而非目录）
  - 需要修复 deploy:widgets 脚本 + 重新构建

## Known Issues / Risks
1. **dist 构建产物损坏**: 8个组件的 `apps/studio/public/widgets/xxx/dist` 是文件而非目录
2. **deploy:widgets 脚本缺陷**: 无法正确处理目标路径已存在为文件的情况
3. **ECharts pointerEvents**: `defineWidget` 产生的 overlay 设置了 `pointerEvents: 'auto'`，可能与 proxy-layer 的拖拽事件冲突
4. **部分组件缺少 SDK 依赖**: circle、line、rectangle 等未在 package.json 引入 SDK

## Domain Knowledge
- 渲染引擎: `VisualEngine` (packages/thingsvis-ui/src/engine/)
- Widget 加载: `componentLoader.ts` + `registryClient.ts`
- 拖拽系统: `TransformControls.tsx` (Moveable + Selecto)
- Widget SDK: `defineWidget` (packages/thingsvis-widget-sdk/src/define-widget.ts)
