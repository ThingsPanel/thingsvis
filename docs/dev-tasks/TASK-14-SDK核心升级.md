# TASK-14：Widget SDK 核心升级

> **优先级**：🔴 P0
> **预估工时**：4-5 人天
> **前置依赖**：TASK-13（Auth 修复后可运行验证）
> **阻塞**：TASK-06（新组件）、TASK-15（Widget 迁移）

---

## 背景

`@thingsvis/widget-sdk` 包已有 `defineWidget()` / `createControlPanel()` / Mixins 等核心 API，但缺少以下能力导致后续开发受阻。做完此任务后，SDK 为终态 API，后续只增不改。

---

## 子任务一览

| # | 子任务 | 工时 | 风险 |
|---|--------|:----:|:----:|
| A | i18n key 化多语言 | 1.5天 | 🟢 低 |
| B | 主题预设系统 | 1天 | 🟢 低 |
| C | 用户自定义控件渲染器 | 1天 | 🟡 中 |
| D | 生命周期事件扩展 | 0.5天 | 🟢 低 |
| E | 版本迁移机制 | 0.5天 | 🟢 低 |

---

## A. i18n key 化多语言（1.5 天）

### 设计原则

- label 使用 i18n key（如 `'widget.echarts.title'`），不限定语言种类
- Widget 自带 `locales` 翻译资源，Studio 加载时合并到全局 i18n 实例
- 无翻译时 fallback 到 label 原始字符串

### 改动清单

- [ ] `@thingsvis/schema` — `ControlFieldSchema.label` 保持 `string`（key 或原文均为 string）
- [ ] `@thingsvis/widget-sdk/types.ts` — `WidgetMainModule` 新增可选 `locales?: Record<string, Record<string, string>>`
- [ ] `@thingsvis/widget-sdk/generate-controls.ts` — `getGroupLabel()` 接受 `locale` 参数，从内置映射表查找
- [ ] `@thingsvis/widget-sdk/define-widget.ts` — `DefineWidgetConfig` 新增 `locales` 可选字段
- [ ] `Studio ControlFieldRow.tsx` — 新增 `resolveLabel(label, locale)` 函数
- [ ] `Studio widgetResolver.ts` — 加载 Widget 时将 `locales` 合并到全局 i18n 实例

### 验收标准

1. Widget 声明 `locales: { zh: {...}, en: {...} }` 后，切换语言 label 跟着变
2. 未声明 locales 的 Widget，label 显示原始字符串（兼容）
3. 添加第三语言（如 `ja`）只需加一个对象

---

## B. 主题预设系统（1 天）

### 设计原则

- 预设主题为完整对象（含色板 + ECharts 主题名 + 模式）
- Widget 通过 `ctx.theme` 被动接收，不主动查询
- 用户可自定义主题（保存到 Dashboard JSON）

### 改动清单

- [ ] `@thingsvis/schema` — 新增 `ThemePreset` 类型定义
- [ ] `@thingsvis/schema` — 新增 `BUILT_IN_THEMES` 常量（light / dark / tech-blue / business）
- [ ] `@thingsvis/widget-sdk/types.ts` — `WidgetOverlayContext` 新增 `theme?: ThemePreset`
- [ ] `@thingsvis/schema` — 同步更新 `WidgetOverlayContext` 对应类型
- [ ] `Studio CanvasSettingsPanel.tsx` — 增加主题 dropdown 选择器
- [ ] `Studio` — 选择主题后更新 CSS class + 所有 Widget 的 WidgetOverlayContext.theme
- [ ] `Studio` — 主题选择持久化到 Dashboard JSON

### 验收标准

1. 画布设置面板可选 4 种内置主题
2. 切换后 Studio 界面 + Widget 背景色 + ECharts 色板同步变化
3. 保存再打开后主题保持

---

## C. 用户自定义控件渲染器（1 天）

### 设计原则

- Widget 开发者（第三方）可自带控件 UI 组件
- ControlKind 支持 `custom:xxx` 前缀，开放扩展
- Studio 通过 Module Federation 加载 Widget 时自动注册其自定义控件

### 改动清单

- [ ] `@thingsvis/schema` — `ControlKindSchema` 改为 `z.union([z.enum([...]), z.string().regex(/^custom:/)])`
- [ ] `@thingsvis/widget-sdk/types.ts` — `WidgetMainModule` 新增 `controlRenderers?: Record<string, { component: any }>`
- [ ] `Studio` — 新增 `controlRegistry.ts`（Map 存储 kind → React Component）
- [ ] `Studio widgetResolver.ts` — 加载 Widget 时注册 `controlRenderers`
- [ ] `Studio ControlFieldRow.tsx` — 优先查找 controlRegistry，有则用自定义组件渲染
- [ ] `@thingsvis/widget-sdk` — 导出 `ControlRendererProps` 类型定义（value + onChange + field）

### 验收标准

1. 新 Widget 声明 `controlRenderers: { 'custom:xxx': { component: MyControl } }` 后，属性面板正确渲染自定义控件
2. 未注册的 `custom:xxx` kind 回退到文本输入
3. 内置 22 种 kind 行为不受影响

---

## D. 生命周期事件扩展（0.5 天）

### 改动清单

- [ ] `@thingsvis/widget-sdk/types.ts` — `WidgetOverlayContext` 新增
  - `locale?: string`
  - `mode?: 'edit' | 'preview' | 'view'`
  - `visible?: boolean`
  - `emit?: (event: string, payload: unknown) => void`
  - `on?: (event: string, handler: Function) => void`
- [ ] `@thingsvis/schema` — 同步更新
- [ ] `Studio` — Widget 渲染时填充 mode / locale / visible

### 验收标准

1. Widget 可读取 `ctx.mode` 判断当前编辑/预览模式
2. Widget 可通过 `ctx.emit` / `ctx.on` 进行跨组件通信
3. 所有字段可选，现有 Widget 不受影响

---

## E. 版本迁移机制（0.5 天）

### 改动清单

- [ ] `@thingsvis/widget-sdk/types.ts` — `WidgetMainModule` 新增 `migrate?: (props: unknown, fromVersion: string) => unknown`
- [ ] `@thingsvis/widget-sdk/define-widget.ts` — `DefineWidgetConfig` 新增 `migrate` 可选字段
- [ ] `Studio widgetResolver.ts` — 加载 Widget 时如果 savedVersion !== widget.version，调用 migrate

### 验收标准

1. Widget 声明 `migrate` 后，旧版 props 被自动转换
2. 无 `migrate` 的 Widget 行为不变

---

## 整体风险评估

| 风险 | 缓解 |
|------|------|
| 改动 `WidgetOverlayContext` 影响现有 Widget | 所有新增字段为 `optional`，现有代码零影响 |
| `ControlKind` 改为 union 可能破坏 Zod 校验 | 使用 `z.union` 保持向后兼容，旧枚举值继续有效 |
| i18n 标签空白 | fallback 到原始字符串，无翻译不会显示空 |
