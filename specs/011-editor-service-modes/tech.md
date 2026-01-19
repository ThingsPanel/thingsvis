# 技术方案：ThingsPanel 集成 + ThingsVis 画布（嵌入编辑器/预览）

**Feature**: `011-editor-service-modes`  
**Created**: 2026-01-15  
**Owner**: ThingsPanel + ThingsVis

## 目标与原则

- 画布配置与物联网数据解耦：`web_chart_config` 只保存 ThingsVis 画布结构与绑定规则，不保存设备数据值
- 设备详情页渲染由平台提供数据上下文，渲染器只负责绑定与展示
- 嵌入编辑器通过回调保存，平台决定保存目标
- 不兼容旧格式，直接替换为新画布结构

## UI 形态定义（替换两张图）

- **图1：预览最终效果**
  - 运行态只读视图
  - 不显示组件库、属性面板、工具栏
  - 数据来自设备上下文与平台接口
- **图2：嵌入编辑器**
  - 组件库 + 画布 + 属性面板（数据源/组件设置）
  - 数据源仅展示平台下发的属性/遥测字段

## 数据模型

### web_chart_config（统一保存格式）

```json
{
  "schemaVersion": "1.0.0",
  "canvas": { "width": 1920, "height": 1080, "bg": "#ffffff" },
  "nodes": [],
  "bindings": [
    {
      "componentId": "card-1",
      "fieldType": "telemetry",
      "fieldKey": "pm25",
      "mapping": { "series": "value" }
    }
  ],
  "meta": {
    "source": "thingspanel",
    "updatedAt": "2026-01-15T15:55:49+08:00"
  }
}
```

### 字段标准（平台下发）

```json
[
  {
    "type": "telemetry",
    "key": "pm25",
    "label": "PM2.5",
    "unit": "ug/m3",
    "dataType": "number"
  },
  {
    "type": "attribute",
    "key": "location",
    "label": "位置",
    "dataType": "string"
  }
]
```

## 关键组件

- **FieldProvider**: 接收平台字段列表（属性/遥测）
- **BindingResolver**: 解析 bindings，将字段映射到组件数据
- **CanvasRenderer**: 渲染画布与组件
- **PreviewRenderer**: 预览最终运行态（图1）
- **SaveAdapter**: 输出画布配置到平台回调

## 设备详情页渲染输入

```json
{
  "canvasConfig": { "schemaVersion": "1.0.0", "nodes": [], "bindings": [] },
  "deviceContext": { "deviceId": "xxx", "name": "PM2.5传感器" },
  "fields": [ { "type": "telemetry", "key": "pm25", "label": "PM2.5" } ],
  "deviceData": {
    "telemetry": { "pm25": [ { "ts": 123, "value": 115 } ] },
    "attribute": { "location": "xxx" }
  }
}
```

## 嵌入编辑器工作流

1. 平台打开嵌入编辑器（图2）
2. 下发字段列表 + web_chart_config
3. 编辑器加载画布并初始化绑定面板
4. 保存时触发回调，将 `web_chart_config` 返回平台

## 设备详情页渲染工作流

1. 平台获取设备详情与模板配置
2. 读取 `web_chart_config` + 设备上下文数据
3. 渲染器按 bindings 绑定字段
4. 输出运行态预览（图1）

## 保存回调机制

```ts
onSave((payload) => {
  // payload = web_chart_config
  // 平台自行调用 API 保存
})
```

## 刷新策略（可配置）

```json
{
  "realtime": {
    "mode": "ws-primary",
    "wsHeartbeatSec": 30,
    "wsHealthCheckSec": 60,
    "pollOnDisconnectSec": 15,
    "pollOnBackgroundSec": 90,
    "immediateRefreshOnVisible": true
  }
}
```

**说明**:
- WebSocket 为主通道
- 心跳与健康校验用于断线检测
- 断线进入轮询兜底
- 页面后台降频，恢复可见立即刷新

## 接口建议

- 获取模板配置（含 `web_chart_config`）
  - `GET /api/template/:id`
- 获取设备详情（含设备上下文 + 数据）
  - `GET /api/device/:id/detail`
- 保存模板配置（回调触发）
  - `PUT /api/template/:id/web_chart_config`

## 非目标

- 兼容旧画布结构
- 组件运行时自建数据源连接
