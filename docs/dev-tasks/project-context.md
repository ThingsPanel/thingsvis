# Project Context

## Architecture Overview
目前是一个基于 React 的 Dashboard 编辑器 (Studio)，通过 iframe 与预览环境或独立组件解耦。Widget (部件) 组件被注册并序列化到 Dashboard JSON。使用了 Zusand 作为状态管理。组件与画板数据使用 `@thingsvis/widget-sdk` 并通过 Context API 进行隔离。

## Key Technical Decisions
- **主题解耦**：采用隔离架构，将 IDE 工作区（深色/浅色模式）和画布部件主题解耦。IDE 主题只更改周围 UI 的颜色，画布维护独立的主题。
- **Widget 主题下发**：通过 `WidgetOverlayContext` 下发 `theme: 'dawn' | 'midnight'` 的标示，组件基于此进行样式变更。
- **CSS 局部变量（待定）**：为画布及其内容生成局部 CSS，利用 CSS variables 实现部件换肤效果，避免 `!important` 污染。

## Current State
- `TASK-14-B` 的 Phase 1 (SDK扩展) 已完成，通过了编译。当前正在进入 Phase 2 图形面板局部变量隔离的开发。
- 将原本稍显老套的名字变更为更接近大厂现代美学标准的 `Dawn` (晨曦白) 和 `Midnight` (午夜蓝)。

## Known Issues / Risks
- 当有第三方引入的图表组件 (Echarts/uPlot) 时，需要特别处理其实例的主题重新渲染。

## Domain Knowledge
- 渲染层 `GridStackCanvas`，Widget 组件定义 `@thingsvis/widget-sdk/types.ts`。
