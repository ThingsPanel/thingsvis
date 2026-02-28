# TASK-23：全局变量与联动系统（ActionSystem）

> **优先级**：🟡 P1（v0.2.0 核心，让平台从"看板"升级为"应用构建器"）
> **预估工时**：2-3 人天
> **前置依赖**：TASK-21（DSP v2）
> **包含**：原 TASK-17（数据预处理与组件间通信）的内容合并于此

---

## 背景

当前 ThingsVis 各 Widget 是完全孤立的"展示孤岛"，组件之间无法通信，无法构建复杂的交互大盘。

**目标**：让用户能构建诸如：
- 下拉框选设备 → 所有图表数据刷新
- 表格行点击 → 侧边详情卡片联动显示
- 时间选择器 → 控制所有时序图的时间范围
- 开关点击 → 发命令 + 刷新状态

这是 Grafana Variables 系统、GoView 事件配置、乐吾乐组态联动的精华，在一个通用不绑定 IoT 的架构上实现。

---

## 核心设计

### 1. DashboardVariables（全局响应式变量）

```typescript
// packages/thingsvis-kernel/src/variables.ts

interface DashboardVariable {
  name: string           // 变量名，如 "deviceId", "timeRange"
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  defaultValue: unknown
  label?: string         // 编辑器显示名称
  persistent?: boolean   // 是否存入 URL，刷新保留
}

// 在 KernelStore 中：
interface KernelStore {
  // 已有
  nodes: Record<string, NodeState>
  dataSources: Record<string, DataSourceRuntimeState>
  // 新增
  variables: Record<string, unknown>  // $var.deviceId = 'dev-001'
}

// 运行时 API
store.getState().setVariable('deviceId', 'dev-001')
store.getState().getVariable('deviceId')  // → 'dev-001'
```

**引用方式**（在任何配置字符串中）：
```
{{ $var.deviceId }}          → 字符串替换
{{ $var.timeRange.start }}   → 嵌套访问
{{ $data.value > 80 }}       → 组件自身数据
{{ $node.text01.data.value }} → 其他节点数据（高级）
```

---

### 2. ActionSystem（动作系统）

所有交互组件触发的不是直接的副作用，而是一个 `ActionConfig` 列表，由 `ActionExecutor` 统一执行。

```typescript
// packages/thingsvis-kernel/src/actions/types.ts

// 四种基础动作类型
type ActionConfig =
  | SetVariableAction    // 修改全局变量
  | CallWriteAction      // 写数据源（调 adapter.write）
  | NavigateAction       // 跳转大盘状态/外部链接
  | RunScriptAction      // 执行用户 JS（受沙箱限制）

interface SetVariableAction {
  action: 'setVariable'
  target: string         // 变量名，如 "$var.deviceId"
  value: string          // 支持表达式，如 "{{ $event.row.id }}"
}

interface CallWriteAction {
  action: 'callWrite'
  datasource: string     // 数据源 ID
  key: string            // write key
  value: string          // 支持表达式
}

interface NavigateAction {
  action: 'navigate'
  to: string             // "state:detail" | "https://..." | "/page/1"
  newTab?: boolean
}

interface RunScriptAction {
  action: 'runScript'
  script: string         // 用户 JS，在 Web Worker 执行（TASK-24）
}
```

**执行器**：
```typescript
// packages/thingsvis-kernel/src/actions/executor.ts

async function executeActions(
  actions: ActionConfig[],
  context: ActionContext,   // { $event, $var, $data, $node }
  store: KernelStore,
  adapterRegistry: AdapterRegistry
): Promise<void>
```

---

### 3. 表达式引擎（Expression Engine）

已有 `useExpressionEvaluator`，需要扩展变量上下文：

```typescript
// 扩展 ExpressionEvaluator 支持：
// $var.xxx  → store.variables[xxx]
// $data.xxx → 当前节点数据
// $event.xxx → 触发事件的数据（如表格点击的行数据）
// $node.nodeId.data.xxx → 其他节点数据（用于跨组件引用）

ExpressionEvaluator.evaluate(
  "{{ $var.deviceId }}",
  {
    $var: store.getState().variables,
    $data: currentNodeData,
    $event: eventPayload,
  }
)
```

**关键变化**：当 `$var.xxx` 变化时，所有引用了 `{{ $var.xxx }}` 的数据源和组件属性**自动触发刷新**。

---

### 4. 数据预处理钩子（合并自 TASK-17）

```typescript
// packages/thingsvis-widget-sdk/src/types.ts
// WidgetMainModule 新增可选字段：

interface WidgetMainModule {
  // 已有...
  // 新增：数据预处理钩子
  transformData?: (rawData: unknown, props: Record<string, unknown>) => unknown
}
```

Studio 渲染流程中，在调用 `widget.update()` 前先经过 `transformData`：
```
datasource.data$ → FieldMapping → transformData(widget) → widget.update()
```

---

### 5. 组件间事件总线（合并自 TASK-17）

```typescript
// Widget SDK context 新增：
interface WidgetOverlayContext {
  // 已有...
  // 新增
  emit: (event: string, payload?: unknown) => void   // 发送事件
  on: (event: string, handler: (payload: unknown) => void) => () => void  // 监听（返回取消函数）
}

// Widget destroy 时自动清理已注册的 handler（无内存泄漏）
```

---

## 编辑器 UI

### 变量管理面板

- 顶部工具栏或设置面板中："大盘变量" Tab
- 列表：变量名、类型、默认值、当前值
- 支持新增/删除/重命名

### 组件事件配置

右侧属性面板新增「事件」Tab（图示）：
```
[ 基础 ] [ 数据 ] [ 样式 ] [ 事件 ]  ← 新增 Tab
                              │
                    ┌─────────▼──────────┐
                    │  onClick           │
                    │  ┌──────────────┐  │
                    │  │ + 添加动作   │  │
                    │  └──────────────┘  │
                    │                    │
                    │  动作 1:           │
                    │  类型: [修改变量▼]  │
                    │  目标: $var.device │
                    │  值:   {{row.id}}  │
                    │                    │
                    │  动作 2:           │
                    │  类型: [写数据源▼]  │
                    │  ...               │
                    └────────────────────┘
```

---

## 子任务清单

### A. 全局变量系统（0.5 天）

- [ ] `packages/thingsvis-kernel/src/variables.ts` — 变量 CRUD
- [ ] `KernelStore` 新增 `variables` 字段 + `setVariable` / `getVariable` action
- [ ] 变量持久化到 Dashboard JSON
- [ ] URL 参数同步（`persistent: true` 的变量）

### B. 表达式引擎扩展（0.5 天）

- [ ] `ExpressionEvaluator` 扩展 `$var` / `$event` / `$node` 上下文
- [ ] `$var.*` 变化时，自动 invalidate 引用它的数据源和属性
- [ ] 循环引用检测（A 引用 B，B 引用 A → 报错不死循环）

### C. ActionSystem 实现（0.5 天）

- [ ] `packages/thingsvis-kernel/src/actions/types.ts` — 四种动作类型
- [ ] `packages/thingsvis-kernel/src/actions/executor.ts` — 顺序执行动作列表
- [ ] `useActionExecutor` Hook（供 Widget 调用）

### D. 编辑器 UI（1 天）

- [ ] 大盘变量管理面板（侧边栏或顶部）
- [ ] 属性面板「事件」Tab
- [ ] ActionConfig 可视化编辑器（类型选择 + 参数配置）
- [ ] 表达式输入框（支持 `{{...}}` 高亮）

### E. Widget SDK 集成（0.5 天）

- [ ] `WidgetOverlayContext` 新增 `emit` / `on`
- [ ] Studio `widgetRenderer` 将 EventBus 包装后传入 ctx
- [ ] Widget destroy 时自动清理 handlers
- [ ] `WidgetMainModule` 新增 `transformData` 可选字段
- [ ] 渲染流程加入 `transformData` 调用

---

## 验收标准

1. **变量联动**：Select 选择设备 → `$var.deviceId` 更新 → 绑定此变量的数据源自动刷新
2. **事件通信**：ECharts 柱状图点击某柱 → `emit('bar:click', {category})` → Text 组件 `on('bar:click')` 接收并更新文字
3. **动作执行**：Button onClick 配置两个动作（setVariable + callWrite），两个均按顺序执行
4. **transformData**：Widget 声明 `transformData` 后，`update()` 收到的是处理后数据，不声明时行为不变
5. **无内存泄漏**：Widget 销毁后不再接收事件，`on()` 注册的 handler 自动清理
6. **URL 持久化**：`persistent: true` 的变量存入 URL，刷新页面后恢复
