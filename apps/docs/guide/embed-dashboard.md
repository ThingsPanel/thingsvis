# 嵌入模式接入指南

本页介绍如何把 ThingsVis 作为 `iframe` 嵌入到第三方系统中。

## 适用场景

- 将 ThingsVis 作为业务系统中的可视化模块
- 宿主平台负责鉴权、项目存储或设备数据推送
- 通过 `postMessage` 和 iframe 完成宿主与 ThingsVis 通信

## 当前实现中的两类接入方式

### 方式一：通过 URL 中的 `id` 从 API 拉取 dashboard

适合：

- 宿主系统只提供鉴权 token 和 dashboard 标识
- Dashboard 数据由 ThingsVis 后端接口返回

### 方式二：通过 `postMessage` 直接注入 schema

适合：

- 宿主系统自己持有 dashboard JSON
- 希望由宿主接管保存和初始化

## 关键 URL 参数

当前实现中常见的参数包括：

- `mode=embedded`
- `saveTarget=host`
- `token`
- `apiBaseUrl`

这些参数会在 React 渲染前参与初始化，因此适合宿主在 iframe `src` 中直接传入。

## 基本 iframe 示例

```html
<iframe
  src="http://your-thingsvis-host/main#/embed?mode=embedded&saveTarget=host"
  style="width:100%;height:600px;border:none;"
></iframe>
```

## 宿主与 ThingsVis 的消息通信

当前实现中同时存在两套消息风格：

### Editor / Host 风格

- `tv:init`
- `tv:ready`
- `tv:save`
- `tv:platform-data`
- `tv:platform-history`
- `tv:platform-write`

### Viewer 风格

- `LOAD_DASHBOARD`
- `UPDATE_VARIABLES`
- `SET_TOKEN`
- `READY`
- `LOADED`
- `ERROR`

这意味着集成时必须先明确你接的是哪条链路，不要把两套消息混写成同一种协议。

## 推荐阅读

如果你是第一次接入，建议先看：

1. 本页
2. [ThingsPanel 集成案例](/integration/thingspanel-integration)
3. 根目录中的现有协议文档

## 保存、鉴权与数据推送边界

嵌入模式通常需要宿主明确接管以下能力中的一部分：

- 鉴权 token
- dashboard 初始化数据
- dashboard 保存
- 平台字段和实时数据推送

如果你的目标是“宿主接管一切”，就应优先采用 host 驱动的 `tv:*` 交互方式。

## 常见问题

### iframe 打开但没有内容

优先检查：

- `src` 是否指向正确的 `#/embed`
- 是否带上了所需的 `token` 或 `apiBaseUrl`
- 宿主是否真的向 iframe 发送了初始化消息

### 宿主发了消息但没有响应

优先检查：

- 消息类型是否匹配当前链路
- `payload` 结构是否与实现一致
- 是否在 iframe ready 之后再发送初始化消息

## 截图占位

> TODO: 在此补“宿主页 + ThingsVis iframe”整体截图，以及一张 postMessage 调试流程图或录屏。
