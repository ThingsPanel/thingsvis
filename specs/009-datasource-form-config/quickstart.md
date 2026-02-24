# Quickstart: 数据源表单配置增强 (REST & WebSocket Form Configuration)

**Feature**: 009-datasource-form-config  
**Estimated Implementation Time**: 3-4 days

## Overview

本功能增强 REST 和 WebSocket 数据源的表单配置能力，让用户能够通过可视化界面完整配置企业级 API 连接。

## Prerequisites

在开始实现之前，请确保：

1. ✅ 熟悉 `packages/thingsvis-schema/src/datasource/index.ts` 中的现有 Schema
2. ✅ 熟悉 `packages/thingsvis-kernel/src/datasources/` 中的 Adapter 实现
3. ✅ 熟悉 `apps/studio/src/widgets/DataSourceConfig/` 中的表单组件
4. ✅ 安装并运行过开发环境 (`pnpm dev`)

## Implementation Order

### Phase 1: Schema Layer (Day 1)

**目标**: 扩展 Schema 定义，确保向后兼容

**步骤**:

1. 在 `packages/thingsvis-schema/src/datasource/` 中创建新文件：
   - `auth-config.ts` - 认证配置 Schema
   - `reconnect-config.ts` - 重连策略 Schema
   - `heartbeat-config.ts` - 心跳配置 Schema

2. 修改 `packages/thingsvis-schema/src/datasource/index.ts`：
   - 扩展 `RESTConfigSchema` 添加 `body`, `timeout`, `auth`
   - 扩展 `WSConfigSchema` 添加 `reconnect`, `heartbeat`, `initMessages`

3. 运行验证：
   ```bash
   pnpm typecheck --filter @thingsvis/schema
   ```

**参考**: [contracts/rest-config.ts](./contracts/rest-config.ts), [contracts/ws-config.ts](./contracts/ws-config.ts)

---

### Phase 2: Kernel Layer (Day 2)

**目标**: 增强 Adapter 实现新配置功能

**RESTAdapter 增强** (`packages/thingsvis-kernel/src/datasources/RESTAdapter.ts`):

```typescript
// 1. 添加 timeout 支持 (AbortController)
private async fetchWithTimeout(url: string, options: RequestInit, timeoutSec: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutSec * 1000);
  
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

// 2. 添加 auth header 注入 (使用 generateAuthHeaders 工具函数)
// 3. 添加 body 发送支持 (POST/PUT 时)
```

**WSAdapter 增强** (`packages/thingsvis-kernel/src/datasources/WSAdapter.ts`):

```typescript
// 1. 添加重连逻辑
private reconnectAttempt = 0;
private reconnectTimer?: ReturnType<typeof setTimeout>;

private scheduleReconnect() {
  const policy = getEffectiveReconnectPolicy(this.config);
  if (!shouldReconnect(this.reconnectAttempt, policy)) {
    this.emitError(new Error('Max reconnect attempts reached'));
    return;
  }
  
  const delay = calculateReconnectDelay(this.reconnectAttempt, policy);
  this.reconnectTimer = setTimeout(() => this.connect(this.config), delay);
  this.reconnectAttempt++;
}

// 2. 添加心跳定时器
private heartbeatTimer?: ReturnType<typeof setInterval>;

// 3. 添加 initMessages 发送
private sendInitMessages() {
  const messages = this.config.initMessages ?? [];
  messages.forEach(msg => this.socket?.send(msg));
}
```

**验证**:
```bash
pnpm typecheck --filter @thingsvis/kernel
pnpm test --filter @thingsvis/kernel
```

---

### Phase 3: UI Components (Day 3)

**目标**: 创建可复用 UI 组件

**新建组件**:

1. `apps/studio/src/components/ui/KeyValueEditor.tsx`
   - 动态键值对编辑器
   - Props: `value: { key: string; value: string }[]`, `onChange`, `addLabel`, `keyPlaceholder`, `valuePlaceholder`

2. `apps/studio/src/components/ui/AuthSelector.tsx`
   - 认证方式选择器
   - Props: `value: AuthConfig`, `onChange`
   - 根据 type 切换显示不同的输入字段

**验证**:
```bash
pnpm dev
# 在浏览器中检查组件是否正确渲染
```

---

### Phase 4: Form Integration (Day 4)

**目标**: 重构 RESTForm 和 WSForm，集成新组件

**RESTForm 重构** (`apps/studio/src/widgets/DataSourceConfig/RESTForm.tsx`):

```tsx
// 分区布局
<Section title="基本配置">
  <UrlInput />
  <MethodSelect />
  <PollingIntervalInput />
</Section>

<Section title="认证">
  <AuthSelector value={config.auth} onChange={...} />
</Section>

<Section title="请求头">
  <KeyValueEditor value={headersArray} onChange={...} />
</Section>

{['POST', 'PUT'].includes(method) && (
  <Section title="请求体">
    <JsonEditor value={config.body} onChange={...} />
  </Section>
)}

<Section title="高级选项">
  <TimeoutInput value={config.timeout} onChange={...} />
</Section>
```

**WSForm 重构** (`apps/studio/src/widgets/DataSourceConfig/WSForm.tsx`):

```tsx
<Section title="基本配置">
  <UrlInput />
  <ProtocolsInput />
</Section>

<Section title="重连策略">
  <ReconnectSection value={config.reconnect} onChange={...} />
</Section>

<Section title="心跳保活">
  <HeartbeatSection value={config.heartbeat} onChange={...} />
</Section>

<Section title="初始消息">
  <InitMessagesSection value={config.initMessages} onChange={...} />
</Section>
```

**验证**:
```bash
pnpm dev
# 完整测试所有表单功能
```

---

## Testing Checklist

| Test Case | Expected Result |
|-----------|-----------------|
| 保存带 Bearer Token 认证的 REST 配置 | 请求头包含正确的 Authorization |
| 配置 POST 请求体 | 请求发送时包含 JSON body |
| 设置 5 秒超时并测试慢速 API | 显示超时错误 |
| 配置 WS 重连并断开网络 | 按配置的策略自动重连 |
| 启用心跳并用开发者工具观察 | 每 N 秒发送心跳消息 |
| 配置初始订阅消息 | 连接后立即发送 |
| 加载旧版配置 (无新字段) | 正常工作，使用默认值 |

## File Checklist

完成后应修改/创建以下文件：

### Schema 层
- [ ] `packages/thingsvis-schema/src/datasource/auth-config.ts` (新建)
- [ ] `packages/thingsvis-schema/src/datasource/reconnect-config.ts` (新建)
- [ ] `packages/thingsvis-schema/src/datasource/heartbeat-config.ts` (新建)
- [ ] `packages/thingsvis-schema/src/datasource/index.ts` (修改)

### Kernel 层
- [ ] `packages/thingsvis-kernel/src/datasources/RESTAdapter.ts` (修改)
- [ ] `packages/thingsvis-kernel/src/datasources/WSAdapter.ts` (修改)

### UI 层
- [ ] `apps/studio/src/components/ui/KeyValueEditor.tsx` (新建)
- [ ] `apps/studio/src/components/ui/AuthSelector.tsx` (新建)
- [ ] `apps/studio/src/widgets/DataSourceConfig/RESTForm.tsx` (修改)
- [ ] `apps/studio/src/widgets/DataSourceConfig/WSForm.tsx` (修改)
- [ ] `apps/studio/src/widgets/DataSourceConfig/sections/` (新建目录及组件)

## Next Steps

1. 运行 `/speckit.tasks` 生成详细任务清单
2. 按 tasks.md 中的任务顺序实现功能
3. 完成后运行 `/speckit.implement` 进行代码生成
