# Project Context

## Architecture Overview
目前是一个基于 React 的 Dashboard 编辑器 (Studio)，通过 iframe 与预览环境或独立组件解耦。Widget (部件) 组件被注册并序列化到 Dashboard JSON。使用了 Zusand 作为状态管理。组件与画板数据使用 `@thingsvis/widget-sdk` 并通过 Context API 进行隔离。

## Key Technical Decisions
- **主题解耦**：采用隔离架构，将 IDE 工作区（深色/浅色模式）和画布部件主题解耦。IDE 主题只更改周围 UI 的颜色，画布维护独立的主题。
- **Widget 主题下发**：通过 `WidgetOverlayContext` 下发 `theme: 'dawn' | 'midnight'` 的标示，组件基于此进行样式变更。
- **CSS 局部变量（待定）**：为画布及其内容生成局部 CSS，利用 CSS variables 实现部件换肤效果，避免 `!important` 污染。

## Current State
- `TASK-14-B` 以及 `TASK-14-C` 的绝大部分已完成，主题变更为纯 CSS Variables 控制，抹平了二元特化逻辑，彻底移除了 isDark 硬编码。
- 修复了因为代码更新带来的 `echarts-line` 缺失 `@thingsvis/widget-sdk` package.json 依赖导致的 Rspack 构建失败问题。各小部件皆已顺利编译。
- 面板编辑器 `FieldPicker.tsx` 逻辑更新：对底层的 object、array 等复合类型的属性选择去除了前端警告和 UI 选择拦截（原提示：“(需选子字段)”），使得复杂 JSON 解构可以正常顺畅挂载和选择。

## Known Issues / Risks
- 部分小组件（例如：circle、line、rectangle 等）并未在 `package.json` 内引入 SDK，需注意未来是否会产生类似的报错（目前因为无 SDK 强关联 imports 未报错）。
- 当有第三方引入的图表组件 (Echarts/uPlot) 时，需要特别处理其实例的主题重新渲染。

## Domain Knowledge
- 渲染层 `GridStackCanvas`，Widget 组件定义 `@thingsvis/widget-sdk/types.ts`。
