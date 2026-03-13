# 数据源配置

本页介绍当前仓库中已经具备实际使用路径的数据源类型，以及在 Studio 中如何配置它们。

## 当前建议以这些类型为主

虽然底层 Schema 支持更多数据源类型，但当前 Studio 中最清晰的用户路径是：

- `STATIC`
- `REST`
- `WS`
- `PLATFORM_FIELD`（更多见于嵌入和宿主集成场景）

> 注意：不要把尚未形成完整 Studio 配置路径的能力当作已经完成的用户文档。

## STATIC

适合：

- 本地演示
- 组件静态数据调试
- 没有后端时先联调视觉效果

配置内容通常是一个 JSON 对象。

## REST

当前 REST 表单围绕这些字段展开：

- `url`
- `method`
- `pollingInterval`
- `auth`
- `headers`
- `body`
- `timeout`

适合：

- 拉取接口数据
- 定时轮询
- 需要鉴权头或请求体的接口

![REST 数据源配置](/images/guide/datasource-rest.png)

## WS

当前 WebSocket 表单围绕这些字段展开：

- `url`
- `protocols`
- `reconnect`
- `heartbeat`
- `initMessages`

适合：

- 实时推送数据
- 设备状态流
- 高频事件更新

![WebSocket 数据源配置](/images/guide/datasource-ws.png)

## transformation

数据源支持一段转换脚本：

- 输入：原始数据
- 输出：转换后的数据

这段脚本会在运行时进入受限执行环境处理，因此非常适合做：

- 字段重命名
- 数据扁平化
- 将接口结构转成组件更容易绑定的结构

## 绑定时如何引用数据

最常见的读取方式是：

```text
{{ ds.<id>.data.<path> }}
```

例如：

```text
{{ ds.weather_api.data.temperature }}
{{ ds.ws_status.data.online }}
```

## 平台字段场景

如果你在嵌入模式下由宿主推送平台字段，那么常见数据源 ID 会是：

```text
__platform__
```

例如：

```text
{{ ds.__platform__.data.temperature }}
```

## 常见问题

### 数据源已创建，但组件没拿到值

优先检查：

- 数据源是否真的成功连接
- 绑定表达式中的数据源 ID 是否一致
- 字段路径是否存在
- transformation 是否把原始结构改掉了

### 文档里为什么没有 MQTT 独立教程

因为当前开源版以“实际已形成完整用户路径的能力”为准。底层支持不等于 Studio 已经形成完整公开使用路径。
