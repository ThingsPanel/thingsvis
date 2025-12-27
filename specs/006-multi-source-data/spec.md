# Feature Specification: 多类型数据源集成 (Multi-type Data Source Integration)

**Feature Branch**: `006-multi-source-data`  
**Created**: 2025-12-26  
**Status**: Draft  
**Input**: User description: "多类型数据源集成功能，支持 REST API、WebSocket/MQTT、数据库代理、静态 JSON 模式、全局数据源管理、组件和资产属性绑定（支持表达式）以及 JS 沙箱数据转换。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 快速原型开发 (Priority: P1)

作为一名可视化看板开发者，我希望能够使用静态 JSON 数据来模拟真实的后端服务，以便在没有后端接口的情况下也能快速构建和测试组件的布局与交互。

**Why this priority**: 这是开发者的核心痛点，支持快速原型开发能极大提高生产力，是 MVP 的基础。

**Independent Test**: 可以通过创建一个“静态 JSON”数据源，并将其绑定到“文本组件”的属性上，观察组件是否能正确显示 JSON 中的内容。

**Acceptance Scenarios**:

1. **Given** 处于看板编辑模式, **When** 添加一个类型为 "Static JSON" 的数据源并输入示例数据 `{ "val": "Hello" }`, **Then** 数据源预览应正确显示该 JSON 内容。
2. **Given** 已配置静态数据源, **When** 将文本组件的文本属性绑定为 `{{ ds.static_mock.data.val }}`, **Then** 画布上的组件应显示 "Hello"。

---

### User Story 2 - 实时监控大屏 (Priority: P1)

作为一名运维工程师，我希望看板能够通过 WebSocket 或 MQTT 连接到传感器数据流，并实时更新仪表盘上的数值。

**Why this priority**: 实时性是 ThingsVis 的核心竞争力之一，是工业和物联网场景的刚需。

**Independent Test**: 通过启动一个本地 WebSocket 服务发送递增数值，观察看板上的仪表组件是否在不刷新页面的情况下动态变化。

**Acceptance Scenarios**:

1. **Given** 拥有一个活跃的 WebSocket 地址, **When** 在全局注册该数据源并配置 Topic/路径, **Then** 数据源状态应显示为“已连接”。
2. **Given** 数据源已连接并持续收到消息 `{ "speed": 60 }`, **When** 仪表组件绑定了该消息字段, **Then** 组件指针应平滑移动到 60 刻度。

---

### User Story 3 - 复杂数据结构转换 (Priority: P2)

作为一名高级开发者，我需要对接格式不规范的第三方 REST API，并使用 JS 代码对数据进行清洗和重构，以适配组件所需的特定格式。

**Why this priority**: 现实环境中的数据往往需要处理，JS 沙箱提供了极大的灵活性。

**Independent Test**: 配置一个返回嵌套数组的 REST API，在数据源中编写一段 `Array.map` 转换脚本，检查绑定组件最终接收到的数据是否为简化后的格式。

**Acceptance Scenarios**:

1. **Given** REST API 返回数据 `{ "items": [{ "meta": { "price": 100 } }] }`, **When** 在 JS 沙箱中编写 `return data.items.map(i => i.meta.price)`, **Then** 绑定到列表组件的数据应为 `[100]`。

---

### Edge Cases

- **数据源连接中断**: 当实时数据源（WebSocket/MQTT）连接断开时，系统应能自动尝试重连，并在 UI 上显示数据源异常状态，同时保留最后一次成功获取的数据。
- **大数据量性能**: 当数据源返回极大（如 > 5MB）的 JSON 数据时，JS 沙箱转换逻辑应有超时保护，防止阻塞 UI 主线程。
- **循环依赖**: 避免两个数据源之间存在相互依赖的表达式转换逻辑，防止死循环。

## Requirements *(mandatory)*

**Constitution Alignment**: Confirm solutions respect monorepo boundaries (pnpm+Turbo), Rspack+MF2 builds, TS 5.x strict typing, schemas in `packages/thingsvis-schema` validated with Zod, renderer discipline (Leafer/React Three Fiber; no direct DOM), state via zustand+immer, performance targets (<800KB core bundle, ≥50 FPS where applicable), and ErrorBoundary wrapping for plugins/components.

### Functional Requirements

- **FR-001**: 系统必须提供一个全局数据源管理器，支持数据源的增删改查及连接状态监控。
- **FR-002**: 系统必须支持以下数据源类型：REST API (GET/POST/Header 配置)、WebSocket (WS/WSS)、MQTT (Broker 地址/Topic)、以及静态 JSON。
- **FR-003**: 系统必须允许在全局范围内为每个数据源定义唯一的 ID（Key），以便组件引用。
- **FR-004**: 所有可视化组件和内置资产（图片、形状、文本）的所有可配置属性必须支持表达式绑定。
- **FR-005**: 表达式语法必须支持 `{{ ... }}` 格式，并能在表达式中访问所有已定义的数据源数据。
- **FR-006**: 系统必须内置一个安全的 JS 沙箱环境，允许用户为每个数据源编写转换脚本（Transformation）。
- **FR-007**: 对于 REST API 数据源，系统必须支持可配置的自动轮询（Polling）间隔。
- **FR-008**: 系统目前不支持直接的数据库 SQL 代理模式；所有数据库对接应通过标准的 REST API 接口进行转发。

### Key Entities *(include if feature involves data)*

- **DataSource (数据源)**: 核心实体，包含类型（REST/WS 等）、连接配置、当前最新数据快照、连接状态、以及可选的转换脚本。
- **DataBinding (数据绑定)**: 描述组件属性与数据源路径之间的映射关系，通常包含一个表达式字符串。
- **DataRegistry (数据仓库/注册表)**: 运行时管理所有活跃数据源实例的单例对象，负责分发更新。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 用户配置一个简单的 REST API 数据源并完成第一个属性绑定所需的时间应少于 60 秒。
- **SC-002**: 在 WebSocket 数据流下，从数据到达系统到组件完成渲染的延迟应低于 100ms（不含网络延迟）。
- **SC-003**: 表达式解析引擎应能处理 100% 的合法 JS 简单表达式，且在数据更新时能触发自动重新渲染。
- **SC-004**: 系统应能同时处理至少 20 个活跃的轮询/实时数据源，且不造成明显的 UI 卡顿（保持 60 FPS）。
- **SC-005**: JS 沙箱转换脚本应能处理 1MB 以内的 JSON 对象，且转换耗时低于 10ms。
