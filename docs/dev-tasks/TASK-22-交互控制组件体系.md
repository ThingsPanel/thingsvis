# TASK-22：交互控制组件体系

> **优先级**：🟡 P1（v0.2.0 差异化核心功能）
> **预估工时**：4-5 人天
> **前置依赖**：TASK-21（DSP v2 write接口）、TASK-14（SDK）、TASK-23（ActionSystem）

---

## 背景

当前 ThingsVis 组件全部是**只读展示**组件。对标 GoView/乐吾乐/ThingsBoard，缺少控制交互组件是最大能力缺口。

**可视化平台的定位**：不仅"看"数据，还要"控"设备/触发动作/构建交互应用。开关/按钮/滑块类组件让 ThingsVis 成为真正的应用构建器。

---

## 设计原则

1. **动作与展示分离**：所有交互组件触发的是 `Action`（见 TASK-23），不直接调设备 API
2. **乐观更新**：用户操作后 UI 立即响应，后台确认后稳定，失败时回滚
3. **状态安全**：组件有明确的 `idle / pending / success / error` 四态
4. **通用性**：不硬编码 IoT 概念，Button 可以发 API，也可以修改变量，也可以跳页面
5. **SDK 优先**：全部使用 `defineWidget()` 新 SDK 模式（TASK-15 之后），当前先用旧模式

---

## 组件清单与规格

### 1. Switch（开关）— 旗舰交互组件，最复杂

**功能**：
- 显示当前开/关状态（来自数据源）
- 点击触发写操作（通过 TASK-23 ActionSystem）
- **乐观更新**：点击后 UI 立即切换，等待确认
- **超时回滚**：N 秒内无确认 → 恢复原状态 + 错误提示
- **确认对话框**（可配置）：高危操作弹确认框
- **只读模式**（可配置）：只展示状态不可点击

**状态机**：
```
idle(off) → [用户点击] → pending → [成功确认] → idle(on)
                                 → [超时/失败] → idle(off) + ErrorToast
idle(off) → [数据源更新] → idle(on)  ← 外部状态变化直接更新
```

**Schema 配置项**：
```typescript
interface SwitchProps {
  // 数据绑定
  value: boolean              // 绑定数据源，当前开关状态
  // 外观
  onColor: string             // 开启颜色（默认 #22c55e）
  offColor: string            // 关闭颜色（默认 #6b7280）
  size: 'sm' | 'md' | 'lg'
  label: string               // 标签文字
  labelPosition: 'left' | 'right' | 'top' | 'bottom'
  // 行为
  readOnly: boolean           // 只读模式
  confirmBeforeAction: boolean  // 操作前确认
  confirmMessage: string        // 确认框文案
  optimisticTimeout: number     // 乐观更新超时(ms)，默认 3000
  // 动作（TASK-23 ActionSystem）
  onToggle: ActionConfig[]    // 切换时触发的动作列表
}
```

---

### 2. Button（按钮）

**功能**：点击触发 ActionSystem 中任意动作组合

**Schema 配置项**：
```typescript
interface ButtonProps {
  label: string
  icon?: string               // 图标（可选）
  variant: 'filled' | 'outline' | 'ghost'
  color: string
  size: 'sm' | 'md' | 'lg'
  disabled: boolean           // 可绑定数据源（条件禁用）
  loading: boolean            // 加载状态（可绑定异步动作执行状态）
  confirmBeforeAction: boolean
  confirmMessage: string
  onClick: ActionConfig[]     // 点击动作列表
}
```

---

### 3. Slider（滑块）

**功能**：拖拽数值，防抖后触发写操作或修改变量

```typescript
interface SliderProps {
  value: number               // 绑定当前值
  min: number
  max: number
  step: number
  unit: string               // 显示单位，如 "°C" "%"
  showValue: boolean         // 显示当前数值
  debounce: number           // 防抖延迟(ms)，默认 500
  color: string
  readOnly: boolean
  onChange: ActionConfig[]   // 拖动结束后触发
}
```

---

### 4. Input / NumberInput

**功能**：文本或数值输入框，提交触发动作

```typescript
interface InputProps {
  value: string | number     // 绑定数据源
  placeholder: string
  type: 'text' | 'number' | 'password'
  min?: number               // type=number 时
  max?: number
  prefix?: string            // 前缀图标/文字
  suffix?: string            // 后缀（单位等）
  submitOnEnter: boolean     // 回车提交
  submitOnBlur: boolean      // 失焦提交
  onSubmit: ActionConfig[]
}
```

---

### 5. Select / Dropdown

**功能**：选择器，主要用于修改全局变量（过滤联动）

```typescript
interface SelectProps {
  value: string              // 当前选中值，可绑定 $var
  options: Array<{ label: string; value: string }> | string // 静态或绑定数据源
  placeholder: string
  multiple: boolean
  onChange: ActionConfig[]
}
```

---

### 6. DateRangePicker

**功能**：时间范围选择，驱动其他图表的时间窗口

```typescript
interface DateRangePickerProps {
  startTime: number          // 绑定 $var.startTime
  endTime: number            // 绑定 $var.endTime
  presets: boolean           // 显示 "最近1小时/24h/7天" 快捷选项
  maxRange: number           // 最大范围限制(ms)
  onChange: ActionConfig[]
}
```

---

### 7. ValueCard（数值卡片）

**功能**：展示关键指标，含趋势箭头

```typescript
interface ValueCardProps {
  title: string
  value: number | string     // 主要数值
  unit: string
  trend: number              // 环比变化百分比（正=上涨 负=下跌）
  trendLabel: string         // 如 "较昨日"
  thresholds: Array<{        // 条件着色
    min: number
    max: number
    color: string
  }>
  icon: string               // 图标名
  backgroundColor: string
}
```

---

### 8. ProgressBar

```typescript
interface ProgressBarProps {
  value: number              // 0-100
  max: number
  label: string
  showPercent: boolean
  color: string
  thresholds: Array<{ value: number; color: string }>  // 超过阈值变色
  orientation: 'horizontal' | 'vertical'
}
```

---

## 乐观更新通用方案

所有需要写操作的组件（Switch/Button/Slider/Input）共用一套机制：

```typescript
// packages/thingsvis-ui/src/hooks/useOptimisticWrite.ts

interface UseOptimisticWriteOptions<T> {
  currentValue: T
  onWrite: (value: T) => Promise<WriteResult>
  timeout?: number   // 默认 3000ms
  onRollback?: (reason: string) => void
}

function useOptimisticWrite<T>(options: UseOptimisticWriteOptions<T>) {
  // 1. 记录原始值
  // 2. 立即更新本地 state（乐观）
  // 3. 调用 onWrite()
  // 4. 成功 → 清除 pending
  // 5. 失败/超时 → 恢复原始值 + 触发 onRollback
  return { optimisticValue, isPending, trigger }
}
```

---

## 子任务清单

### A. 公共基础（0.5 天）

- [ ] `useOptimisticWrite` Hook（乐观更新+回滚）
- [ ] `ConfirmDialog` 公共确认对话框组件
- [ ] 控制组件基础样式 token（与主题系统对接）
- [ ] `useActionExecutor` Hook（执行 ActionConfig[]，对接 TASK-23）

### B. Switch 完整实现（1 天）

- [ ] 四态状态机实现（idle/pending/success/error）
- [ ] 乐观更新 + 超时回滚
- [ ] 确认对话框集成
- [ ] 数据源绑定（只读值来自 `data.value`）
- [ ] 写操作绑定（`onToggle` ActionConfig）
- [ ] 控制面板：外观 + 行为 + 事件配置

### C. Button（0.5 天）

- [ ] 基础样式（filled/outline/ghost）
- [ ] loading 状态与 disabled 绑定
- [ ] 确认对话框集成
- [ ] onClick ActionConfig 配置

### D. Slider（0.5 天）

- [ ] 拖拽 + 防抖
- [ ] value 双向绑定（读数据源 + 写动作）
- [ ] 刻度/单位显示

### E. ValueCard（0.5 天）

- [ ] 数值 + 趋势箭头 + 条件着色
- [ ] thresholds 阈值配置

### F. Select + DateRangePicker（0.5 天）

- [ ] Select：options 支持静态和数据源绑定
- [ ] DateRangePicker：快捷预设按钮

### G. Input + ProgressBar（0.5 天）

- [ ] Input：提交触发动作
- [ ] ProgressBar：进度 + 阈值变色

---

## 验收标准

1. **Switch**：点击后 UI 立即切换 → 3s 后无确认 → 自动回滚 + 红色 Toast
2. **Button**：点击触发 ActionConfig 执行（不直接调 API，通过 ActionSystem）
3. **Slider**：拖动结束 500ms 后触发动作（防抖生效）
4. **ValueCard**：绑定数值后显示，数值超过 `threshold.max` 变红
5. **Select**：选项变化后 `$var.deviceId` 同步更新，其他绑定此变量的数据源自动刷新
6. **所有组件**：`readOnly: true` 时 UI 可见但不可操作（不发送任何动作）
7. **性能**：1000 个 Switch 组件同时渲染不卡顿
