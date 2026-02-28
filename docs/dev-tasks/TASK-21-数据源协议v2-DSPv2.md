# TASK-21：数据源协议 v2（DSP v2）

> **优先级**：🔴 P0（v0.2.0 最高优先级，不做=架构永久锁死）
> **预估工时**：3-4 人天
> **前置依赖**：TASK-13（Auth）、TASK-14（SDK 生命周期）
> **阻塞**：TASK-22（交互组件）、TASK-23（联动系统）、TASK-24（JS沙箱）

---

## 背景与问题

### 现状问题

```typescript
// 现在：硬编码 ThingsPanel
export const PlatformFieldConfigSchema = z.object({
  source: z.literal('ThingsPanel'),  // ← 死锁：只能用 TP
  fieldMappings: z.record(z.string()), // ← 只支持平铺字段，不支持数组/嵌套
});
```

**具体痛点**：
1. 字段映射是平铺 `{ componentProp: fieldId }` → 无法绑定 `data[0].temperature`（数组）
2. `source: 'ThingsPanel'` 写死 → 其他平台/用户无法接入
3. 无写操作接口 → 开关/按钮等交互组件无法控制设备
4. 无连接状态暴露 → Widget 无法知道数据源是否在线

### 目标

- **通用适配器协议**：所有数据源（静态/REST/WS/MQTT/平台注入）统一接口
- **JSONPath 字段映射**：支持数组、嵌套路径、内联转换
- **写操作支持**：双向通道，交互组件可以控制
- **ThingsPanel 向后兼容**：旧格式自动迁移，TP前端无需任何改动

---

## 核心接口设计

### 1. DataSourceAdapter 统一接口

```typescript
// packages/thingsvis-schema/src/datasource/adapter.ts

export interface DataSourceAdapter {
  readonly type: string  // 'static' | 'rest' | 'websocket' | 'mqtt' | 'script' | 'platform'

  // 生命周期
  connect(config: unknown, ctx: AdapterContext): Promise<void>
  disconnect(): Promise<void>

  // 数据生产（响应式）
  readonly data$: Observable<DataPayload>
  readonly status$: Observable<AdapterStatus>

  // 写操作（交互组件使用，可选）
  write?(key: string, value: unknown): Promise<WriteResult>
}

export interface DataPayload {
  raw: unknown                          // 原始响应
  mapped: Record<string, unknown>       // 经 FieldMapping 处理后的数据
  timestamp: number
}

export type AdapterStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'disconnected'

export interface WriteResult {
  success: boolean
  echo?: unknown      // 设备回写的确认值（用于乐观更新校验）
  error?: string
}

export interface AdapterContext {
  variables: Record<string, unknown>   // 大盘全局变量 $var.*
  secrets: Record<string, string>      // 敏感配置（不序列化到JSON）
  logger: AdapterLogger
}
```

### 2. FieldMapping（JSONPath + 转换）

```typescript
// packages/thingsvis-schema/src/datasource/field-mapping.ts

export interface FieldMapping {
  /** Widget 可用的属性名，如 "value", "items", "label" */
  target: string

  /** JSONPath 表达式，如 "$.data[0].temperature", "$.results[*].name" */
  source: string

  /** 可选：内联 JS 转换（小型转换，复杂的用 TASK-24 沙箱） */
  transform?: string   // 例: "v => v * 1.8 + 32"

  /** 无数据时的降级值 */
  defaultValue?: unknown
}

// 向后兼容：旧 fieldMappings 的迁移
// { temperature: 'attr_001' }  →  [{ target: 'temperature', source: '$.attr_001' }]
export function migrateLegacyFieldMappings(
  legacy: Record<string, string>
): FieldMapping[] {
  return Object.entries(legacy).map(([target, fieldId]) => ({
    target,
    source: `$.${fieldId}`,
  }))
}
```

### 3. 数据源配置 Schema（v2）

```typescript
// packages/thingsvis-schema/src/datasource/config-v2.ts

export const DataSourceConfigV2Schema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['static', 'rest', 'websocket', 'mqtt', 'script', 'platform']),
  config: z.unknown(),          // 各适配器自己的配置
  fieldMappings: z.array(FieldMappingSchema),  // 新的 JSONPath 方式
  refreshInterval: z.number().optional(),      // REST 轮询间隔(ms)
})

// 向后兼容解析器
export function parseDataSourceConfig(raw: unknown): DataSourceConfigV2 {
  // 检测旧格式
  if (isLegacyPlatformFieldConfig(raw)) {
    return migrateLegacyConfig(raw)  // 自动迁移，无需用户手动操作
  }
  return DataSourceConfigV2Schema.parse(raw)
}
```

---

## 适配器实现清单

### A. StaticAdapter（静态JSON）

```typescript
// packages/thingsvis-kernel/src/adapters/static.ts
// 已有基础，改造为实现 DataSourceAdapter 接口
// data$ 发出 config 中的静态数据，无 write
```

### B. RestAdapter（HTTP + 轮询）

```typescript
// packages/thingsvis-kernel/src/adapters/rest.ts
// 支持 GET/POST，轮询，Auth（Bearer/Basic/ApiKey）
// write: 可选，发 POST/PUT/PATCH 请求
```

### C. WebSocketAdapter

```typescript
// packages/thingsvis-kernel/src/adapters/websocket.ts
// 重连策略 + 心跳，data$ 推送每条消息
// write: 通过同一 WS 连接 send
```

### D. MqttAdapter

```typescript
// packages/thingsvis-kernel/src/adapters/mqtt.ts
// mqtt.js over WebSocket
// write: publish 到指定 topic
```

### E. PlatformAdapter（★ ThingsPanel 向后兼容核心）

```typescript
// packages/thingsvis-kernel/src/adapters/platform/index.ts

// 插件注册机制
const platformProviders = new Map<string, PlatformProvider>()

export function registerPlatformProvider(id: string, provider: PlatformProvider) {
  platformProviders.set(id, provider)
}

// ThingsPanel 提供者
// packages/thingsvis-kernel/src/adapters/platform/thingspanel.ts
export const ThingsPanelProvider: PlatformProvider = {
  id: 'thingspanel',
  // 通过 postMessage 接收 tv:init / tv:data 消息
  // write：通过 postMessage 向宿主发送 tv:command
  // 协议完全不变，TP前端无需改动
}
```

### F. ScriptAdapter（接 TASK-24）

```typescript
// packages/thingsvis-kernel/src/adapters/script.ts
// 用户编写 JS 脚本，在 Web Worker 中执行
// 脚本返回数据 → data$
```

---

## 子任务清单

### 子任务 A：Schema 层（0.5 天）

- [ ] 新建 `packages/thingsvis-schema/src/datasource/adapter.ts`（接口定义）
- [ ] 新建 `packages/thingsvis-schema/src/datasource/field-mapping.ts`（JSONPath映射）
- [ ] 新建 `packages/thingsvis-schema/src/datasource/config-v2.ts`（v2 Schema）
- [ ] 向后兼容解析器 `parseDataSourceConfig()`
- [ ] 旧格式迁移函数 `migrateLegacyFieldMappings()`
- [ ] 更新 `packages/thingsvis-schema/src/datasource/index.ts` 导出

### 子任务 B：适配器实现（1.5 天）

- [ ] `StaticAdapter` — 改造现有实现
- [ ] `RestAdapter` — 实现（支持轮询 + Auth）
- [ ] `WebSocketAdapter` — 改造现有 WS 实现
- [ ] `MqttAdapter` — 新建（mqtt.js over WS）
- [ ] `PlatformAdapter` + `ThingsPanelProvider` — 保持协议兼容
- [ ] `AdapterRegistry` — 适配器注册/获取

### 子任务 C：Kernel 集成（1 天）

- [ ] `DataSourceManager`：管理所有数据源的生命周期（connect/disconnect）
- [ ] FieldMapping 执行器：JSONPath 解析 + transform 执行
- [ ] `KernelStore` 中 `dataSources` 状态类型升级为 v2
- [ ] Widget 渲染时 `data$` → `mapped` 数据自动注入

### 子任务 D：编辑器 UI（0.5 天）

- [ ] 数据源配置面板：`source` 下拉（static/rest/websocket/mqtt/platform）
- [ ] FieldMapping 编辑器：target + source(JSONPath) + transform + defaultValue
- [ ] 连接状态指示器（小圆点，idle/connecting/connected/error）

### 子任务 E：迁移脚本（0.5 天）

- [ ] `scripts/migrate-datasource-v2.mjs`：扫描所有已保存的 Dashboard JSON，自动将旧格式升级为 v2

---

## 验收标准

1. **向后兼容**：加载含 `source:'ThingsPanel'` 旧格式 Dashboard，自动解析正常，无任何报错
2. **ThingsPanel 端不改代码**：`thingspanel-frontend-community` 仓库零改动，嵌入ThingsVis行为完全不变
3. **REST 数据源**：配置 URL+轮询后，Widget 每 N 秒自动刷新
4. **数组字段映射**：`$.results[*].name` 能正确映射到数组属性
5. **写操作**：`adapter.write('switch', true)` 发出后返回 `WriteResult`（TASK-22 Switch用）
6. **状态指示**：数据源断连时，引用它的 Widget 显示连接断开状态

---

## 迁移影响分析

| 受影响模块 | 改动性质 | 工作量 |
|------------|---------|--------|
| `thingsvis-schema` | 新增接口，旧 Schema 保留兼容 | 无破坏性 |
| `thingsvis-kernel` | 适配器重构，外部接口不变 | 内部重构 |
| `thingsvis-ui` hooks | `useDataSource` 类型升级 | 微小 |
| 已有 Widget | 消费 `data.mapped` 不变 | 无影响 |
| ThingsPanel 前端 | **零改动** | ✅ |
| 已有 Dashboard 数据 | 迁移脚本自动处理 | ✅ |
