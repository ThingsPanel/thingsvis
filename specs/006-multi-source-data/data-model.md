# Data Model: 多类型数据源集成 (Multi-type Data Source Integration)

**Feature**: 006-multi-source-data

## Entities

### 1. DataSourceConfig (数据源配置)
描述数据源的静态配置信息，持久化于看板 Schema。

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | 全局唯一标识符 (UUID) |
| `name` | `string` | 数据源名称 |
| `type` | `REST | WS | MQTT | STATIC` | 数据源类型 |
| `config` | `object` | 类型相关的配置（URL, Headers, Topic 等） |
| `transformation` | `string (code)` | 可选的 JS 转换脚本代码 |
| `options` | `object` | 轮询间隔、重连策略等 |

### 2. DataSourceState (数据源运行状态)
内存中的实时状态。

| Field | Type | Description |
|-------|------|-------------|
| `status` | `connected | disconnected | error | loading` | 连接状态 |
| `data` | `any` | 最新获取的数据快照 |
| `error` | `string | null` | 最近一次错误信息 |
| `lastUpdated` | `number (timestamp)` | 最后一次成功更新的时间戳 |

### 3. DataBinding (数据绑定关系)
存在于组件属性（Node Props）中的绑定描述。

| Field | Type | Description |
|-------|------|-------------|
| `targetProp` | `string` | 组件属性名 (如 `text`, `fill`) |
| `expression` | `string` | `{{ ... }}` 格式的表达式字符串 |

## Validation Rules (Zod)

- `DataSourceSchema`: 必须包含有效的 `type` 和对应的 `config`。
- `ExpressionSchema`: 必须符合 `{{` 开头 `}}` 结尾的格式。
- `TransformationSchema`: 必须是合法的 JavaScript 函数体字符串。

## State Transitions

1. **Initialization**: `Config -> Loading -> Connected`
2. **Data Update**: `Connected -> (Polling/Streaming) -> Data Snapshot Update`
3. **Error Handling**: `Connected -> Error (with automatic retry) -> Connected`
4. **Disconnection**: `Connected -> Disconnected`

