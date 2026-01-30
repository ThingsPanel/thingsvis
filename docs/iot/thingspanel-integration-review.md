# ThingsPanel 集成现状与兼容性评估

> **版本**: v1.0.0  
> **最后更新**: 2026-01-30

---

## 一、现状梳理（ThingsPanel 当前集成实现）

### SSO 交换与登录
- SSO 交换 API 已实现，支持 platform=thingspanel 与 userInfo，返回 accessToken 与 refreshToken。route.ts:1-240
- 平台 Token 验证目前为开发态占位逻辑，未真正校验。thingspanel.ts:1-90
- 文档中以 URL 传 token 进入编辑器。thingspanel-integration-testing.md:220-310

### 嵌入与 UI 配置
- URL 参数解析与服务配置逻辑集中在 resolveEditorServiceConfig()，支持 mode、integration、UI 面板显示、saveTarget、platformFields。service-config.ts:1-186
- 实际 UI 渲染仍使用 embedVisibility 读取 URL 参数，未使用上述服务配置。Editor.tsx:173-240
- Vue Host 以 mode=embedded + integration=full/minimal + showLibrary/showProps 等参数运行。App.vue:1-120

### 保存与回调
- 编辑器触发保存使用 thingsvis:editor-trigger-save，导出数据后通过 thingsvis:host-save 发送给宿主。embed-mode.ts:1-80, Editor.tsx:560-640
- 新协议（thingsvis:requestSave + thingsvis:saveResponse）已实现于 SaveTargetHandler 与 host-bridge，但未被编辑器主流程调用。save-target-handler.ts:1-120, host-bridge.ts:1-130
- Vue Host 同时兼容 thingsvis:requestSave 与 thingsvis:host-save。App.vue:150-320

### 平台字段与数据推送
- URL 传 platformFields，编辑器侧用于属性面板字段选择。PropsPanel.tsx:390-430
- 数据推送使用 thingsvis:platformData，由 PlatformDataStore 与 PlatformFieldAdapter 消费。PlatformDataStore.ts:1-120, PlatformFieldAdapter.ts:1-130
- 平台字段 schema 在 thingsvis-schema 中已定义。platform-field-config.ts:1-40

### 默认项目注入
- defaultProject 解码逻辑已存在，但未被编辑器启动流程引用。bootstrap.ts:1-120

### 嵌入 SDK（现有但未落地到编辑器）
- thingsvis-embed 定义了另一套更完整的消息协议（init/ready/saveRequest/dataResponse 等）。index.d.ts:1-120

---

## 二、通用集成规范（适用于 ThingsPanel 与其他系统）

### 角色与边界
- 宿主平台：负责用户身份、设备上下文、字段列表、持久化。
- ThingsVis Editor：负责编辑与渲染、配置输出与绑定。
- 数据流：宿主提供字段与数据；编辑器输出配置与绑定规则。

### 运行模式
- standalone：完整 UI，自主保存。
- embedded：可配置 UI 与集成级别。
- integrationLevel：full 或 minimal。
- 需要在加载期确定，运行时不切换。

### 启动参数（URL 或 postMessage 注入）
- mode: standalone | embedded
- integration: full | minimal
- saveTarget: self | host
- platformFields: JSON 数组
- defaultProject: Base64URL(JSON(ProjectFile))
- showLibrary/showProps/showTopLeft/showToolbar/showTopRight/toolbarItems
- 建议：当 platformFields 或 defaultProject 过大时，改用 postMessage 注入（避免 URL 长度上限）。

### 认证（SSO）
- Token 交换：POST /api/v1/auth/sso
- 必须校验 platformToken（生产环境）。
- token 建议通过短期会话 token 传入 iframe，并在 iframe 内完成二次交换。

### 保存协议（Editor → Host）
- 请求：thingsvis:requestSave，带 requestId 与 payload（统一 schemaVersion、meta、canvas、nodes、dataSources、dataBindings）。
- 响应：thingsvis:saveResponse 对应 requestId，返回 success 与 error。

### 数据推送（Host → Editor）
- thingsvis:platformData，payload 含 fieldId、value、timestamp。
- Editor 可发送 thingsvis:requestFieldData 获取首批数据（支持 fieldIds）。

### 配置与数据模型
- tech.md 中的 web_chart_config。tech.md:1-90
- schemaVersion 必填；平台字段 ID 与绑定关系独立于数据值，避免将设备数据写入配置。

### 安全与兼容
- postMessage 校验 origin。
- 协议版本号与 capability handshake。
- 保留旧协议到一个明确的过渡期。

---

## 三、兼容性与易用性评估（发现的问题）

### 协议并存且不一致
- 编辑器主流程用 thingsvis:host-save，文档与新协议用 thingsvis:requestSave/saveResponse。
- thingsvis-embed 定义了第三套协议但未落地。
- 影响：宿主需要同时兼容多协议，增加集成成本。
- 证据：embed-mode.ts:1-80, thingspanel-integration-testing.md:900-1045, index.d.ts:1-120

### 保存目标未真正生效
- saveTarget 与 SaveTargetHandler 未在编辑器主流程使用。
- 影响：配置项对宿主无实际效果。
- 证据：save-target-handler.ts:1-120

### integration=minimal 未被 UI 统一执行
- resolveEditorServiceConfig() 有最简集成逻辑，但 UI 实际使用 embedVisibility。
- 影响：最简集成可能仍显示面板，体验不一致。
- 证据：service-config.ts:98-186, Editor.tsx:173-240

### defaultProject 支持未落地
- 解码函数存在但未接入编辑器启动流程。
- 影响：文档描述的默认项目注入不可用。
- 证据：bootstrap.ts:1-120

### 保存数据结构与文档不一致
- 编辑器导出 payload 缺少 meta/dataSources，与文档规范存在差异。
- 影响：平台侧解析不稳定。
- 证据：Editor.tsx:560-640, thingspanel-integration-testing.md:520-590

### 安全性不足
- postMessage 未做 origin 校验。
- SSO 对 platformToken 未验证，CORS 允许任意来源。
- 影响：存在安全风险。
- 证据：PlatformDataStore.ts:20-60, route.ts:1-120

---

## 四、建议的最小纠偏方案（兼容性优先）

### 协议收敛
- 统一使用 thingsvis:requestSave/thingsvis:saveResponse，保留 thingsvis:host-save 兼容层并标记弃用。
- 选择是否接入 thingsvis-embed 协议；否则删去或注记“未使用”。

### 配置入口唯一化
- 统一 UI 与嵌入参数读取：编辑器 UI 使用 resolveEditorServiceConfig() 的输出。

### defaultProject 实现闭环
- 在编辑器初始化时调用 resolveEmbeddedDefaultProject() 注入项目。

### 数据结构对齐
- 保存 payload 按文档与 tech 方案统一 schemaVersion、meta、canvas、nodes、dataSources、dataBindings。

### 安全与规模
- postMessage 校验 origin；SSO 验证 platformToken；CORS 白名单化。
