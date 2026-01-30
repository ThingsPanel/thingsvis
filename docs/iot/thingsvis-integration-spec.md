# ThingsVis 嵌入式集成规范（适配 ThingsPanel 与其他系统）

> **版本**: v1.2.0  
> **状态**: Draft  
> **最后更新**: 2026-01-30  
> **适用范围**: ThingsPanel、任意宿主平台（Web/移动端/WebView）

本规范定义 ThingsVis 嵌入式编辑器/预览与宿主平台之间的**启动参数、认证、数据交换、保存回调、数据推送**与**兼容策略**，用于统一 ThingsPanel 与其他系统的集成方式。

---

## 1. 术语与角色

- **宿主平台（Host）**：集成 ThingsVis 的系统（如 ThingsPanel）。负责身份、设备上下文、数据源字段、持久化。
- **编辑器（Editor）**：ThingsVis Studio 的嵌入模式，负责画布编辑、配置输出。
- **预览（Preview）**：只读渲染模式（设备详情页/看板展示）。
- **平台字段（Platform Fields）**：宿主提供的设备属性/遥测/命令字段。
- **画布配置（web_chart_config）**：统一保存结构，不包含设备数据值。

---

## 2. 模式与集成级别

### 2.1 运行模式
- `standalone`：独立编辑器，默认完整 UI。
- `embedded`：嵌入模式，UI 由宿主控制。

### 2.2 集成级别
- `full`：可显示组件库、属性面板、工具栏。
- `minimal`：仅画布区域，其他 UI 隐藏。

> 规则：`minimal` 强制隐藏非必要 UI，忽略宿主传入的非最简 UI 开关。

---

## 3. 启动参数（URL 方式）

> 适用于 iframe 或 WebView 直接加载。参数可放在 URL query 或 hash query 中。

| 参数 | 类型 | 可选值 | 说明 |
|------|------|--------|------|
| `mode` | string | `standalone` / `embedded` | 运行模式 |
| `integration` | string | `full` / `minimal` | 集成级别 |
| `saveTarget` | string | `self` / `host` | 保存目标 |
| `platformFields` | string | JSON 数组 | 平台字段列表 |
| `showLibrary` | boolean | `0` / `1` | 组件库显示 |
| `showProps` | boolean | `0` / `1` | 属性面板显示 |
| `showTopLeft` | boolean | `0` / `1` | 左上角区域 |
| `showToolbar` | boolean | `0` / `1` | 工具栏 |
| `showTopRight` | boolean | `0` / `1` | 右上角区域 |
| `toolbarItems` | string | CSV | 工具栏项过滤 |
| `defaultProject` | string | Base64URL(JSON) | 默认项目配置 |
| `token` | string | JWT | SSO 交换后的 ThingsVis 访问令牌 |
| `deviceId` | string | 任意 | 设备上下文标识（可选） |

> **推荐**：当 `platformFields` 或 `defaultProject` 较大时，改用 postMessage 注入。

---

## 4. SSO 认证规范

### 4.1 Token 交换 API
- **接口**：`POST /api/v1/auth/sso`
- **请求体**：
  - `platform`: 固定 `thingspanel`（其他平台可扩展）
  - `platformToken`: 宿主 JWT
  - `userInfo`: `{ id, email, name?, tenantId }`

### 4.2 认证流程
1. 用户在宿主平台登录。
2. 宿主调用 ThingsVis SSO API 获取 `accessToken`。
3. 宿主把 `accessToken` 注入 iframe URL 或 postMessage。
4. Editor 使用 token 自动登录。

### 4.3 安全要求
- 生产环境必须验证 `platformToken`。
- CORS 应限制允许来源白名单。

---

## 5. 平台字段（Platform Fields）

### 5.1 字段结构
```json
[
  {
    "id": "temp",
    "name": "温度",
    "type": "number",
    "dataType": "telemetry",
    "unit": "°C",
    "description": "设备当前温度"
  }
]
```

### 5.2 使用规则
- **仅传字段定义，不传实时数据值**。
- 编辑器属性面板仅展示宿主传入字段。
- 字段绑定后保存到 `dataBindings` 中。

---

## 6. 保存协议（Editor → Host）

### 6.1 请求保存
```json
{
  "type": "thingsvis:requestSave",
  "requestId": "req_123456",
  "payload": {
    "schemaVersion": "1.0.0",
    "meta": {
      "projectId": "project-xxx",
      "name": "设备监控看板",
      "createdAt": 1706428800000,
      "updatedAt": 1706428800000,
      "externalId": "device-001"
    },
    "canvas": { "mode": "infinite", "width": 1920, "height": 1080, "background": "#1e1e2e" },
    "nodes": [ /* NodeSchema */ ],
    "dataSources": [ /* DataSource */ ],
    "dataBindings": [ /* Binding */ ]
  }
}
```

### 6.2 保存响应
```json
{
  "type": "thingsvis:saveResponse",
  "requestId": "req_123456",
  "payload": {
    "success": true,
    "data": { "templateId": "tpl_001" }
  }
}
```

### 6.3 失败处理
- `success: false` 时须携带 `error` 字段。
- Editor 必须给出明确提示，并避免数据丢失。

---

## 7. 平台数据推送（Host → Editor）

### 7.1 推送消息
```json
{
  "type": "thingsvis:platformData",
  "payload": {
    "fieldId": "temp",
    "value": 25.3,
    "timestamp": 1706428800000
  }
}
```

### 7.2 初始数据请求（Editor → Host）
```json
{
  "type": "thingsvis:requestFieldData",
  "payload": {
    "dataSourceId": "ds_001",
    "fieldIds": ["temp", "humi"]
  }
}
```

---

## 8. 默认项目注入

- 支持 `defaultProject` Base64URL(JSON) 传入。
- 数据必须符合 `ProjectFile` schema。
- 无效数据必须被拒绝并提供错误提示。

---

## 9. 预览模式（设备详情页/看板）

### 9.1 运行态原则
- 仅渲染画布与组件，不显示编辑 UI。
- 数据由宿主平台负责实时推送。

### 9.2 推荐输入结构
```json
{
  "canvasConfig": { "schemaVersion": "1.0.0", "nodes": [], "bindings": [] },
  "deviceContext": { "deviceId": "xxx", "name": "PM2.5 传感器" },
  "fields": [ { "type": "telemetry", "key": "pm25", "label": "PM2.5" } ],
  "deviceData": {
    "telemetry": { "pm25": [ { "ts": 123, "value": 115 } ] },
    "attribute": { "location": "xxx" }
  }
}
```

---

## 10. 兼容性与版本策略

- **协议版本**：建议 `schemaVersion` + `messageVersion` 字段。
- **兼容策略**：允许旧 `thingsvis:host-save` 作为过渡协议。
- **能力协商**：建议引入 `editorReady` / `capabilities` 消息。

---

## 11. 安全要求

- **postMessage** 必须校验 `event.origin`。
- **SSO** 必须校验平台 Token。
- **CORS** 必须限制可信来源。

---

## 12. 常见问题

**Q1: 平台字段不显示？**  
- 检查 `platformFields` JSON 是否正确。
- 检查嵌入模式与 integration 参数。

**Q2: 保存无响应？**  
- 确认宿主监听 `thingsvis:requestSave` 并回 `saveResponse`。

**Q3: 数据推送无效？**  
- 检查 `fieldId` 与绑定字段一致。
- 确保 message origin 允许。

---

## 13. 参考实现

- ThingsPanel 集成测试文档：docs/iot/thingspanel-integration-testing.md
- 服务配置解析：apps/studio/src/lib/embedded/service-config.ts
- 平台数据推送监听：packages/thingsvis-ui/src/engine/PlatformDataStore.ts
- SSO 交换 API：apps/server/src/app/api/v1/auth/sso/route.ts
