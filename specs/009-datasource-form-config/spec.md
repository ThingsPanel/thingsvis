# Feature Specification: 数据源表单配置增强 (REST & WebSocket Form Configuration)

**Feature Branch**: `009-datasource-form-config`  
**Created**: 2025-12-31  
**Status**: Draft  
**Input**: User description: "完善数据源配置的 REST 和 WebSocket 表单功能。REST 配置需支持：请求头(Headers)动态键值对编辑、请求体(Body)配置（POST/PUT 时可用）、认证方式选择（None/Bearer Token/Basic Auth/API Key）、请求超时时间设置。WebSocket 配置需支持：子协议(protocols)配置、重连策略（重连次数、间隔、指数退避）、心跳保活（开关、间隔、心跳消息内容）、连接成功后的初始订阅消息。目标是让用户能完整配置企业级 REST API 和 WebSocket 连接，无需手写 JSON。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 配置带认证的 REST API (Priority: P1)

作为一名可视化看板开发者，我需要配置一个需要 Bearer Token 认证的企业内部 REST API，并能够设置自定义请求头和超时时间，以便安全地获取业务数据。

**Why this priority**: 大多数企业级 REST API 都需要认证，这是连接真实后端服务的基本需求，是 MVP 的核心功能。

**Independent Test**: 在数据源配置表单中选择 REST 类型，配置 Bearer Token 认证和自定义 Header，发送测试请求，验证请求头中包含正确的 Authorization 和自定义头部。

**Acceptance Scenarios**:

1. **Given** 用户正在配置 REST 数据源, **When** 选择认证方式为 "Bearer Token" 并输入令牌, **Then** 发出的请求头中应包含 `Authorization: Bearer <token>`。
2. **Given** 用户正在配置 REST 数据源, **When** 添加自定义请求头 `X-Tenant-ID: 12345`, **Then** 发出的请求中应包含该自定义头部。
3. **Given** 用户配置了 5 秒超时时间, **When** 目标服务器响应超过 5 秒, **Then** 请求应超时并显示友好的超时错误提示。

---

### User Story 2 - 配置 POST/PUT 请求体 (Priority: P1)

作为一名可视化看板开发者，我需要配置 POST 或 PUT 类型的 REST API 请求，并能够编辑请求体内容（JSON 格式），以便向后端发送数据或执行写操作。

**Why this priority**: 很多 API 查询需要 POST 方法并携带请求体参数，这是 REST 配置的基本能力。

**Independent Test**: 选择 POST 方法后，在请求体编辑区域输入 JSON 数据，发送测试请求，验证后端接收到正确的请求体。

**Acceptance Scenarios**:

1. **Given** 用户选择 HTTP 方法为 POST 或 PUT, **When** 查看配置表单, **Then** 应显示请求体编辑区域。
2. **Given** 用户选择 HTTP 方法为 GET 或 DELETE, **When** 查看配置表单, **Then** 请求体编辑区域应隐藏。
3. **Given** 用户在请求体中输入 `{"query": "status", "page": 1}`, **When** 发送请求, **Then** 请求的 Content-Type 应为 `application/json`，请求体应包含该 JSON 数据。

---

### User Story 3 - 配置 WebSocket 重连策略 (Priority: P1)

作为一名运维工程师，我需要配置 WebSocket 数据源的自动重连策略，包括重连次数、间隔和指数退避，以确保在网络波动时看板能够自动恢复连接。

**Why this priority**: 实时数据场景下网络不稳定是常态，可靠的重连机制是生产环境的必备功能。

**Independent Test**: 配置 WebSocket 数据源并设置重连策略，手动断开网络后恢复，观察是否按照配置的策略自动重连。

**Acceptance Scenarios**:

1. **Given** 用户配置重连次数为 5 次，初始间隔为 1 秒，指数退避系数为 2, **When** WebSocket 连接断开, **Then** 系统应依次尝试在 1s、2s、4s、8s、16s 后重连。
2. **Given** 重连次数已耗尽, **When** 仍无法连接, **Then** 系统应显示连接失败状态，并提供手动重连按钮。
3. **Given** 重连过程中连接成功恢复, **When** 数据开始流入, **Then** 重连计数器应重置，状态应显示为"已连接"。

---

### User Story 4 - 配置 WebSocket 心跳保活 (Priority: P2)

作为一名可视化看板开发者，我需要配置 WebSocket 心跳保活机制，定期发送心跳消息以防止连接被服务器或中间代理断开。

**Why this priority**: 长连接在企业网络环境中容易被代理/防火墙超时断开，心跳是保持连接稳定的重要手段。

**Independent Test**: 启用心跳功能并配置间隔为 30 秒，通过网络抓包工具观察是否每 30 秒发送一次心跳消息。

**Acceptance Scenarios**:

1. **Given** 用户启用心跳保活并设置间隔为 30 秒, **When** WebSocket 连接建立, **Then** 系统应每隔 30 秒自动发送心跳消息。
2. **Given** 用户配置心跳消息内容为 `{"type": "ping"}`, **When** 发送心跳时, **Then** 发送的消息应为该 JSON 字符串。
3. **Given** 用户禁用心跳保活, **When** WebSocket 连接建立, **Then** 系统不应发送任何心跳消息。

---

### User Story 5 - 配置 WebSocket 初始订阅消息 (Priority: P2)

作为一名可视化看板开发者，我需要配置 WebSocket 连接成功后自动发送的初始订阅消息，以便告知服务器我需要订阅的数据频道或主题。

**Why this priority**: 许多实时数据服务需要在连接后发送订阅命令才能开始接收数据，这是完整配置的必要部分。

**Independent Test**: 配置初始订阅消息后建立连接，验证服务器端收到正确的订阅消息。

**Acceptance Scenarios**:

1. **Given** 用户配置了初始订阅消息 `{"action": "subscribe", "channels": ["sensor.temperature"]}`, **When** WebSocket 连接成功建立, **Then** 系统应立即自动发送该订阅消息。
2. **Given** 用户配置了多条初始消息, **When** 连接建立, **Then** 系统应按顺序依次发送所有消息。
3. **Given** 连接重连成功后, **When** 连接恢复, **Then** 系统应重新发送初始订阅消息。

---

### User Story 6 - 配置 WebSocket 子协议 (Priority: P3)

作为一名高级开发者，我需要为 WebSocket 连接配置子协议（Subprotocols），以便与需要特定协议协商的服务器通信。

**Why this priority**: 子协议是 WebSocket 规范的一部分，虽然使用场景较少，但对于特定服务器是必需的。

**Independent Test**: 配置子协议后建立连接，通过浏览器开发者工具观察 WebSocket 握手请求中是否包含正确的 Sec-WebSocket-Protocol 头部。

**Acceptance Scenarios**:

1. **Given** 用户配置子协议为 `graphql-ws`, **When** WebSocket 发起连接, **Then** 握手请求头应包含 `Sec-WebSocket-Protocol: graphql-ws`。
2. **Given** 用户配置多个子协议 `graphql-ws, subscriptions-transport-ws`, **When** WebSocket 发起连接, **Then** 握手请求头应包含这两个协议（逗号分隔）。

---

### Edge Cases

- **请求头键值冲突**: 当用户手动添加的请求头与系统认证生成的头部（如 Authorization）冲突时，应优先使用用户配置的值，并给予警告提示。
- **请求体 JSON 格式校验**: 当用户输入的请求体不是有效的 JSON 时，应实时显示格式错误提示，并阻止保存配置。
- **心跳与重连交互**: 当连接断开进入重连阶段时，心跳定时器应暂停；连接恢复后心跳定时器应重新启动。
- **超时时间边界**: 超时时间应有合理的最小值（如 1 秒）和最大值（如 300 秒）限制，防止无效配置。
- **空表单校验**: 必填字段（如 URL）为空时，应禁用保存/测试按钮，并显示字段校验错误。

## Requirements *(mandatory)*

**Constitution Alignment**: 本功能遵循 monorepo 边界 (pnpm+Turbo)、Rspack+MF2 构建规范、TS 5.x 严格类型、Zod 验证（在 `packages/thingsvis-schema` 中定义配置 Schema）、zustand+immer 状态管理，以及项目现有的 UI 组件库和设计规范。

### Functional Requirements

#### REST API 配置

- **FR-001**: 系统必须提供动态键值对编辑器，允许用户添加、编辑、删除自定义请求头（Headers）。
- **FR-002**: 系统必须在 HTTP 方法为 POST 或 PUT 时显示请求体（Body）编辑区域，支持 JSON 格式输入。
- **FR-003**: 系统必须提供认证方式选择器，支持以下四种认证类型：
  - **None**: 不添加任何认证头部
  - **Bearer Token**: 添加 `Authorization: Bearer <token>` 头部
  - **Basic Auth**: 根据用户名和密码生成 `Authorization: Basic <base64>` 头部
  - **API Key**: 可配置在请求头或 URL 参数中携带 API Key
- **FR-004**: 系统必须提供请求超时时间配置，允许用户设置 1-300 秒范围内的超时值。
- **FR-005**: 系统必须对请求体进行实时 JSON 格式校验，并在格式无效时显示错误提示。

#### WebSocket 配置

- **FR-006**: 系统必须提供子协议（Protocols）配置输入，支持配置一个或多个 WebSocket 子协议。
- **FR-007**: 系统必须提供重连策略配置，包含以下可配置项：
  - **启用/禁用重连**: 开关控制
  - **最大重连次数**: 0-100 范围内的整数（0 表示无限重连）
  - **初始重连间隔**: 以秒为单位的等待时间
  - **指数退避开关**: 是否启用指数退避
  - **最大重连间隔**: 退避计算的上限值
- **FR-008**: 系统必须提供心跳保活配置，包含以下可配置项：
  - **启用/禁用心跳**: 开关控制
  - **心跳间隔**: 以秒为单位的发送间隔
  - **心跳消息内容**: 可自定义的消息字符串（支持纯文本或 JSON）
- **FR-009**: 系统必须提供初始订阅消息配置，允许用户添加多条连接成功后自动发送的消息。
- **FR-010**: 初始订阅消息必须在每次连接成功（包括重连）后自动发送。

#### 通用要求

- **FR-011**: 所有配置表单必须进行输入校验，必填字段为空或格式无效时应禁用保存操作并显示错误提示。
- **FR-012**: 用户配置的所有数据必须能够完整保存和恢复，重新打开配置面板时应显示之前保存的值。
- **FR-013**: 系统必须提供"测试连接"功能，允许用户在保存前验证配置是否正确。

### Key Entities *(include if feature involves data)*

- **RESTConfig (REST 配置)**: 包含 URL、HTTP 方法、请求头列表、请求体、认证配置、超时时间、轮询设置等属性。
- **WebSocketConfig (WebSocket 配置)**: 包含 URL、子协议列表、重连策略、心跳配置、初始订阅消息列表等属性。
- **AuthConfig (认证配置)**: 认证方式的联合类型，包含各认证方式的特定参数（token、username/password、apiKey 等）。
- **ReconnectPolicy (重连策略)**: 包含启用开关、最大重连次数、初始间隔、是否指数退避、最大间隔等属性。
- **HeartbeatConfig (心跳配置)**: 包含启用开关、心跳间隔、心跳消息内容等属性。

## Assumptions

- 本功能基于 `006-multi-source-data` 规格中定义的数据源管理功能进行扩展，复用其数据源管理器和数据源实体基础结构。
- 表单 UI 组件采用项目现有的 UI 组件库（如已有的 Input、Select、Switch 等组件），保持视觉风格一致。
- API Key 认证支持两种携带方式：请求头（Header）和 URL 参数（Query Parameter），默认为请求头方式。
- 心跳消息发送失败不触发重连逻辑，仅记录警告日志。
- 指数退避算法采用公式：`delay = min(initialInterval * (backoffMultiplier ^ attemptCount), maxInterval)`，其中 `backoffMultiplier` 固定为 2。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 用户配置一个带有 Bearer Token 认证和自定义请求头的 REST API 数据源所需时间应少于 90 秒。
- **SC-002**: 用户配置 WebSocket 重连策略和心跳保活所需时间应少于 60 秒。
- **SC-003**: 配置表单的输入校验应在 200ms 内完成并显示反馈。
- **SC-004**: 保存的数据源配置在重新加载后应 100% 完整恢复，无数据丢失。
- **SC-005**: WebSocket 在网络恢复后应在配置的重连策略指定时间内自动恢复连接。
- **SC-006**: 95% 的用户能够在不查阅文档的情况下完成 REST 认证配置。
