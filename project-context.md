# Project Context
## Architecture Overview
ThingsVis: A dynamic widget visualization platform. Custom Widget SDK (`@thingsvis/widget-sdk`) exposes building blocks using a single `defineWidget` to register options, definitions, schemas (via `zod`), and renderings.

## Key Technical Decisions
- 弃用单独的 Overlay 等方式注册组件，使用高度一致的 `defineWidget` 以减少开发难度。
- `SDK` 核心支持 `isDark` 主题及 `locales` 多语言配置。
- 各图表及卡片预设独立的 `PropsSchema` 并导出，生成动态控制面板，自动注册。

## Current State
`TASK-06 (缺失组件补齐)` 已完成所有的必选 P1 组件。

## Known Issues / Risks
- 目前缺少集成测试及真实验证环境下的渲染测试。
- Workspace 多仓库在 Windows 下部分命令行兼容问题暂时绕过，以后需要全局升级配置或增加 `cross-env` 等。

## Domain Knowledge
- Zod 可以自动生成控制面板，`schema.ts` 结合 `controls.ts` 的策略已被证明非常高效和灵活。
