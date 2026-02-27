# TASK-14-B: 主题预设系统与画布隔离架构

> **优先级**：🔴 P0 
> **预估工时**：1-2 人天
> **后置依赖**：TASK-18（画布背景与主题 UI）

---

## 1. 背景与目标

当前编辑器（Studio）的明暗主题与画布内组件（Widget）的主题未完全解耦，容易导致编辑器切换主题时画布渲染受到异常影响。为了打造类似 GoView、Excalidraw 的专业级大屏和白板工具，需要解决渲染独立性的问题。
目标：实现基于 CSS 变量与 Context API 的新型主题架构，隔离工作区主题与画布主题，并且落地两套精美的预设主题。

## 2. 核心架构设计

- **完全解耦画布与工作区主题**：工作区的 Light/Dark 模式不再使用全局类名直接污染画布容器。
- **数据驱动的主题系统**：
  - 扩展 SDK，定义 `WidgetOverlayContext.theme`，将选中的画布主题属性向下透传给所有 Widget。
  - 在画布容器挂载局部 CSS Custom Properties (CSS变量) 进行样式绑定，避免 CSS 覆盖地狱。
- **高质量预设主题落地**：
  1. **Dawn (晨曦白)**：亮色首发主题，以 `#6965DB` (Indigo) 为 Primary Color，强调极致干净、高对比度与现代极简感（类似 Vercel / Linear 的 Light 风格）。
  2. **Midnight (午夜蓝)**：暗黑首发主题，以 `#6965DB` 为主轴配合深蓝灰背景与磨砂毛玻璃 (Glassmorphism) 效果，体现专业大屏的深邃感与层级感。

## 3. 任务执行拆解

- [ ] **Phase 1: SDK Context 扩展**
  - [ ] 在 `packages/thingsvis-widget-sdk/src/types.ts` 中定义 `WidgetTheme` 类型。
  - [ ] 在 `WidgetOverlayContext` 接口中添加 `theme` 属性，用于下发主题状态。

- [ ] **Phase 2: 画布层级与局部变量隔离**
  - [ ] 设计并写入 CSS 变量色板提取，定义亮色和暗色主题的关键颜色变量。
  - [ ] 在画布外层包裹特定的 Theme Provider 或独立的样式作用域，隔离工作区的样式注入。

- [ ] **Phase 3: 集成状态与 KernelStore**
  - [ ] 在状态管理器中引入专门针对画布的 `canvasTheme` 字段，区别于原本控制面板的纯编辑区主题。

- [ ] **Phase 4: 内置 Widget 适配与应用**
  - [ ] 升级现有组件（尤其是 ECharts 系列和 Text 基础组件），从 Context 或局部 CSS 变量中读取背景和默认字色。
  - [ ] 测试主题切换，并验证用户直接在配置面版强制覆盖颜色时，不会被预设主题破坏。
