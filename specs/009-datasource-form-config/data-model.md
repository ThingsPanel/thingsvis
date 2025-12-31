# Data Model: 数据源表单配置增强 (REST & WebSocket Form Configuration)

**Feature**: 009-datasource-form-config  
**Created**: 2025-12-31

## Entity Overview

本功能扩展现有的 `RESTConfigSchema` 和 `WSConfigSchema`，新增配置实体以支持企业级数据源连接。

```
┌─────────────────────────────────────────────────────────────────┐
│                        DataSource                                │
│  (existing entity from 006-multi-source-data)                   │
├─────────────────────────────────────────────────────────────────┤
│  id: string                                                      │
│  name: string                                                    │
│  type: 'REST' | 'WS' | 'MQTT' | 'STATIC'                        │
│  config: RESTConfig | WSConfig | MQTTConfig | StaticConfig      │◄───┐
│  transformation?: string                                         │    │
│  options?: { enabled, cacheTime }                                │    │
└─────────────────────────────────────────────────────────────────┘    │
                                                                        │
    ┌───────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│           RESTConfig (extended)          │
├─────────────────────────────────────────┤
│  url: string (required)                  │
│  method: 'GET'|'POST'|'PUT'|'DELETE'    │
│  headers?: Record<string, string>        │
│  params?: Record<string, any>            │
│  pollingInterval?: number                │
│  ──── NEW FIELDS ────                    │
│  body?: string (JSON)                    │
│  timeout?: number (1-300, default 30)    │
│  auth?: AuthConfig                       │◄───────┐
└─────────────────────────────────────────┘        │
                                                    │
┌─────────────────────────────────────────┐        │
│           WSConfig (extended)            │        │
├─────────────────────────────────────────┤        │
│  url: string (required)                  │        │
│  protocols?: string[]                    │        │
│  reconnectAttempts: number (deprecated)  │        │
│  ──── NEW FIELDS ────                    │        │
│  reconnect?: ReconnectPolicy             │◄───┐   │
│  heartbeat?: HeartbeatConfig             │◄─┐ │   │
│  initMessages?: string[]                 │  │ │   │
└─────────────────────────────────────────┘  │ │   │
                                              │ │   │
    ┌─────────────────────────────────────────┘ │   │
    │                                            │   │
    ▼                                            │   │
┌─────────────────────────────────────────┐     │   │
│         HeartbeatConfig (new)            │     │   │
├─────────────────────────────────────────┤     │   │
│  enabled: boolean (default false)        │     │   │
│  interval: number (seconds, default 30)  │     │   │
│  message: string (default "ping")        │     │   │
└─────────────────────────────────────────┘     │   │
                                                 │   │
    ┌────────────────────────────────────────────┘   │
    │                                                 │
    ▼                                                 │
┌─────────────────────────────────────────┐          │
│        ReconnectPolicy (new)             │          │
├─────────────────────────────────────────┤          │
│  enabled: boolean (default true)         │          │
│  maxAttempts: number (0-100, default 5)  │          │
│  initialInterval: number (sec, default 1)│          │
│  useExponentialBackoff: boolean (true)   │          │
│  maxInterval: number (sec, default 60)   │          │
└─────────────────────────────────────────┘          │
                                                      │
    ┌─────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│           AuthConfig (new)               │
│         (discriminated union)            │
├─────────────────────────────────────────┤
│  type: 'none' | 'bearer' | 'basic' | 'apiKey'
│                                          │
│  ── when type = 'bearer' ──              │
│  token: string                           │
│                                          │
│  ── when type = 'basic' ──               │
│  username: string                        │
│  password: string                        │
│                                          │
│  ── when type = 'apiKey' ──              │
│  key: string (header/param name)         │
│  value: string                           │
│  location: 'header' | 'query'            │
└─────────────────────────────────────────┘
```

## Entity Definitions

### 1. AuthConfig (认证配置)

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| type | `'none' \| 'bearer' \| 'basic' \| 'apiKey'` | Yes | `'none'` | 认证方式类型 |
| token | `string` | Conditional | - | Bearer Token (当 type='bearer') |
| username | `string` | Conditional | - | 用户名 (当 type='basic') |
| password | `string` | Conditional | - | 密码 (当 type='basic') |
| key | `string` | Conditional | - | API Key 名称 (当 type='apiKey') |
| value | `string` | Conditional | - | API Key 值 (当 type='apiKey') |
| location | `'header' \| 'query'` | Conditional | `'header'` | API Key 携带位置 |

**Validation Rules**:
- 当 `type='bearer'` 时，`token` 必填且非空
- 当 `type='basic'` 时，`username` 和 `password` 必填
- 当 `type='apiKey'` 时，`key` 和 `value` 必填

---

### 2. ReconnectPolicy (重连策略)

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| enabled | `boolean` | No | `true` | 是否启用自动重连 |
| maxAttempts | `number` | No | `5` | 最大重连次数 (0=无限) |
| initialInterval | `number` | No | `1` | 初始重连间隔 (秒) |
| useExponentialBackoff | `boolean` | No | `true` | 是否启用指数退避 |
| maxInterval | `number` | No | `60` | 最大重连间隔 (秒) |

**Validation Rules**:
- `maxAttempts` 范围: 0-100
- `initialInterval` 范围: 0.1-60 秒
- `maxInterval` 范围: 1-300 秒
- `maxInterval` 必须 >= `initialInterval`

---

### 3. HeartbeatConfig (心跳配置)

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| enabled | `boolean` | No | `false` | 是否启用心跳保活 |
| interval | `number` | No | `30` | 心跳发送间隔 (秒) |
| message | `string` | No | `"ping"` | 心跳消息内容 |

**Validation Rules**:
- `interval` 范围: 5-300 秒
- `message` 可以是纯文本或 JSON 字符串

---

### 4. RESTConfig (扩展后)

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| url | `string` | Yes | - | API 端点 URL |
| method | `'GET' \| 'POST' \| 'PUT' \| 'DELETE'` | No | `'GET'` | HTTP 方法 |
| headers | `Record<string, string>` | No | `{}` | 自定义请求头 |
| params | `Record<string, any>` | No | `{}` | URL 查询参数 |
| pollingInterval | `number` | No | `0` | 轮询间隔 (s, 0=不轮询) |
| **body** | `string` | No | - | 请求体 (JSON 字符串) |
| **timeout** | `number` | No | `30` | 超时时间 (秒) |
| **auth** | `AuthConfig` | No | `{ type: 'none' }` | 认证配置 |

**New Validation Rules**:
- `body` 在 method='POST' 或 'PUT' 时可用，必须是有效 JSON
- `timeout` 范围: 1-300 秒

---

### 5. WSConfig (扩展后)

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| url | `string` | Yes | - | WebSocket URL (ws:// 或 wss://) |
| protocols | `string[]` | No | `[]` | WebSocket 子协议列表 |
| reconnectAttempts | `number` | No | `5` | (已废弃，使用 reconnect.maxAttempts) |
| **reconnect** | `ReconnectPolicy` | No | (defaults) | 重连策略配置 |
| **heartbeat** | `HeartbeatConfig` | No | (defaults) | 心跳保活配置 |
| **initMessages** | `string[]` | No | `[]` | 连接成功后发送的初始消息列表 |

**New Validation Rules**:
- `initMessages` 中的每条消息可以是纯文本或 JSON 字符串
- 连接/重连成功后，按数组顺序发送所有 initMessages

---

## State Transitions

### WebSocket Connection States

```
┌─────────┐                    ┌────────────┐
│  IDLE   │───── connect() ───►│ CONNECTING │
└─────────┘                    └──────┬─────┘
     ▲                                │
     │                                ▼ onopen
     │                         ┌────────────┐
     │                         │ CONNECTED  │◄───────────────┐
     │                         └──────┬─────┘                │
     │                                │                      │
     │                                ▼ onclose/onerror      │
     │                         ┌────────────┐                │
     │                         │ RECONNECTING│───────────────┘
     │                         └──────┬─────┘  (if attempt < max)
     │                                │
     │                                ▼ (attempts exhausted)
     │                         ┌────────────┐
     └─────── disconnect() ────│   FAILED   │
                               └────────────┘
```

### Heartbeat Timer Lifecycle

```
CONNECTED ──► startHeartbeat() ──► [timer running] ──► sendHeartbeat() every N seconds
     │                                     │
     ▼ onclose                             ▼
RECONNECTING ──► stopHeartbeat() ──► [timer cleared]
     │
     ▼ onopen
CONNECTED ──► startHeartbeat() ──► [timer restarted]
```

---

## Backward Compatibility

所有新增字段使用 `.optional()` 和合理默认值：

| Entity | New Field | Default Value | Migration Impact |
|--------|-----------|---------------|------------------|
| RESTConfig | body | `undefined` | None - existing configs work |
| RESTConfig | timeout | `30` | None - sensible default |
| RESTConfig | auth | `{ type: 'none' }` | None - no auth by default |
| WSConfig | reconnect | `{ enabled: true, maxAttempts: 5, ... }` | Compatible with old `reconnectAttempts` |
| WSConfig | heartbeat | `{ enabled: false, ... }` | None - disabled by default |
| WSConfig | initMessages | `[]` | None - no messages by default |

**Migration Note**: 旧的 `WSConfig.reconnectAttempts` 字段保留但标记为 deprecated。新代码应使用 `WSConfig.reconnect.maxAttempts`。Kernel 层解析时优先使用新字段，若不存在则回退到旧字段。
