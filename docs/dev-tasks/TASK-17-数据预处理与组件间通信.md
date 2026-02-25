# TASK-17：数据预处理与组件间通信

> **优先级**：🟡 P1
> **预估工时**：2 人天
> **前置依赖**：TASK-14（SDK 生命周期事件）

---

## 背景

### 数据预处理

Widget 渲染前常需对数据做聚合/过滤/排序。当前只能在 `render` 函数内手写。Grafana 通过 `transformProps` 将数据转换与渲染分离。

### 组件间通信

内核 EventBus（on/off/emit）已存在，但 SDK 没有暴露给 Widget。场景：点击图表某数据点 → 过滤另一个表格。

---

## 子任务 A：数据预处理钩子（1 天）

### 改动清单

- [ ] `@thingsvis/widget-sdk/types.ts` — `WidgetMainModule` 新增
  ```typescript
  transformData?: (rawData: unknown[], props: Record<string, unknown>) => unknown[];
  ```
- [ ] `@thingsvis/widget-sdk/define-widget.ts` — `DefineWidgetConfig` 新增 `transformData` 可选字段
- [ ] `Studio` Widget 渲染流程 — 在调用 `update()` 前，先经过 `transformData` 处理数据
- [ ] 为 `echarts-line` 写示例 transformData（过滤空值 + 排序）

### 验收标准

1. Widget 声明 `transformData` 后，render 收到的是处理后的数据
2. 不声明 `transformData` 时行为不变

---

## 子任务 B：组件间通信 API（1 天）

### 设计原则

- Widget 通过 `ctx.emit(event, payload)` 发送事件
- Widget 通过 `ctx.on(event, handler)` 监听事件
- Studio 将 emit/on 绑定到 Kernel EventBus
- 事件在 Dashboard 范围内广播（不跨 Dashboard）

### 改动清单

- [ ] `@thingsvis/widget-sdk/types.ts` — WidgetOverlayContext 新增 `emit` / `on`（TASK-14 已定义类型）
- [ ] `Studio widgetRenderer` — 实例化 Widget 时将 EventBus 的 emit/on 包装后传入 ctx
- [ ] Widget destroy 时自动清理已注册的 event handlers
- [ ] 验证：echarts-line 的 click 事件能被另一个 text Widget 接收

### 验收标准

1. Widget A emit('chart:click', data) → Widget B 的 on('chart:click') 接收到 data
2. Widget 销毁后不再接收事件（无内存泄漏）
3. 现有 Widget 不使用通信 API 时无任何行为变化

---

## 风险评估

- **数据预处理**：纯函数插入，不影响原有数据流
- **组件间通信**：基于已有 EventBus，只是暴露接口层
