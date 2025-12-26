# Research: 多类型数据源集成 (Multi-type Data Source Integration)

**Feature**: 006-multi-source-data
**Status**: Completed

## Research Tasks

### 1. JS Sandbox Implementation for Data Transformation
**Question**: 如何在内核层实现安全、高性能且不阻塞主线程的 JS 转换沙箱？

- **Decision**: 使用基于 `new Function` 的受限执行器，结合 `Proxy` 对象拦截全局变量。对于极高性能要求或复杂逻辑，考虑 Web Worker。
- **Rationale**: ThingsVis 运行在浏览器环境，`vm2` 等 Node.js 库不可用。`QuickJS-WASM` 虽然安全但包体积较大（约 500KB+），会违反 <800KB 核心包限制。`Proxy` 沙箱能以极小的体积成本提供基础的安全隔离。
- **Alternatives Considered**: 
    - `QuickJS-WASM`: 体积过大。
    - `Web Worker`: 适合重计算，但单次小型转换的通信开销较高。

### 2. Expression Engine for `{{ }}` Bindings
**Question**: 如何解析和评估属性绑定中的 `{{ query.data.value }}` 表达式？

- **Decision**: 采用基于正则匹配的轻量级解析器，配合 `get` 辅助函数（如 `lodash.get` 的轻量实现）访问数据路径。
- **Rationale**: 绑定通常只是简单的属性访问（Path Access），无需引入完整的 AST 解析器（如 `jexl`）。这有助于保持核心包体积。
- **Alternatives Considered**: 
    - `expr-eval`: 支持复杂数学运算，但对于简单数据访问过于沉重。
    - `jexl`: 功能强大但增加体积。

### 3. MQTT over WebSockets in Browser
**Question**: 在浏览器环境下，如何通过内核层统一管理 MQTT 连接？

- **Decision**: 使用 `mqtt.js` 库，配置为 `ws://` 或 `wss://` 连接模式。
- **Rationale**: `mqtt.js` 是行业标准，对 WebSocket 提供了开箱即用的支持，且支持自动重连机制，符合规格书中的 Edge Case 要求。
- **Alternatives Considered**: 
    - 原生 `WebSocket` 手写 MQTT 协议：过于复杂且难以维护。

### 4. React Query (TanStack Query) Integration
**Question**: 如何将内核层的适配器与 UI 层的 React Query 无缝结合？

- **Decision**: `useDataSource` Hook 内部使用 `useQuery` 或 `useSubscription`。对于 REST API，利用 React Query 的缓存和轮询能力；对于 WS/MQTT，由内核层推送更新至全局 Store，UI 层通过 `useStore` 订阅。
- **Rationale**: 结合了 React Query 处理异步状态的优势和 Zustand 处理高频同步更新的优势。

## Consolidated Findings

1. **安全性**: 采用 `SafeExecutor` 模式，所有用户代码执行必须包裹在 `try-catch` 中，并设有执行时长限制（通过 `Promise.race` 模拟超时）。
2. **包体积**: 严控第三方依赖，MQTT 和表达式解析将尽可能采用按需加载或轻量实现。
3. **性能**: 对高频实时流采用“批量更新（Batching）”策略，避免每条消息都触发全量渲染。

