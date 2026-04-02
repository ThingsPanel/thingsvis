# ThingsVis 分享链接集成指南

## 概述

分享链接功能允许您通过无状态令牌（share token）嵌入 ThingsVis 仪表板，无需复杂的 SSO 认证流程。

## 核心概念

### 分享链接 vs SSO Token

| 特性 | 分享链接 | SSO Token |
|------|---------|-----------|
| 用例 | 仅展示/预览 | 编辑仪表板 |
| 认证 | 无需认证 | 需要认证 |
| 权限粒度 | Dashboard 级别 | 用户级别 |
| 嵌入复杂度 | 低 | 高 |

### 数据模型

```typescript
interface Dashboard {
  shareToken: string | null;      // UUID v4 访问令牌
  shareExpiry: Date | null;        // 过期时间，null = 永不过期
  shareEnabled: boolean;           // 是否启用分享
}
```

## API 接口

### 1. 创建分享链接

```http
POST /api/v1/dashboards/:id/share
Authorization: Bearer <token>
Content-Type: application/json

{
  "expiresIn": 86400  // 可选，过期时间（秒）
}
```

响应：
```json
{
  "shareUrl": "https://thingsvis.example.com/#/embed?id=<id>&shareToken=<token>",
  "expiresAt": "2026-04-03T10:00:00Z"
}
```

### 2. 查询分享信息

```http
GET /api/v1/dashboards/:id/share
Authorization: Bearer <token>
```

响应：
```json
{
  "enabled": true,
  "url": "https://thingsvis.example.com/#/embed?id=<id>&shareToken=****",
  "expiresAt": "2026-04-03T10:00:00Z"
}
```

### 3. 吊销分享链接

```http
DELETE /api/v1/dashboards/:id/share
Authorization: Bearer <token>
```

响应：`204 No Content`

### 4. 验证分享链接（公开接口，无需认证）

```http
GET /api/v1/dashboards/:id/validate-share?shareToken=<token>
```

成功响应：
```json
{
  "valid": true,
  "dashboard": {
    "id": "dash_123",
    "name": "我的仪表板",
    "canvasConfig": { ... },
    "nodes": [ ... ]
  }
}
```

失败响应：
```json
{
  "valid": false,
  "error": "Share link has expired"
}
```

## 前端集成

### 使用 API 客户端

```typescript
import { createShareLink, validateShareLink, revokeShareLink } from '@/lib/api/dashboards';

// 创建分享链接
const result = await createShareLink('dash_123', { expiresIn: 86400 });
console.log(result.data?.shareUrl);

// 验证分享链接
const validation = await validateShareLink('dash_123', 'token-here');
if (validation.data?.valid) {
  console.log(validation.data.dashboard);
}

// 吊销分享链接
await revokeShareLink('dash_123');
```

### 嵌入页面

```html
<!-- 分享链接嵌入（推荐） -->
<iframe 
  src="https://thingsvis.example.com/#/embed?id=dash_123&shareToken=xxx"
  width="100%" 
  height="600">
</iframe>

<!-- SSO Token 嵌入（向后兼容） -->
<iframe 
  src="https://thingsvis.example.com/#/embed?id=dash_123&token=<jwt>"
  width="100%" 
  height="600">
</iframe>
```

**URL 参数优先级**：`shareToken` > `token`

## ThingsPanel 集成示例

### 旧方式（SSO Token）
```typescript
const token = await thingsvisAuthService.getValidToken();
const url = buildThingsVisUrl({ dashboardId, token });
```

### 新方式（分享链接）
```typescript
const response = await fetch('/thingsvis-api/dashboards/dash_123/share', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ expiresIn: 86400 })
});

const { shareUrl } = await response.json();
```

## 数据绑定

分享链接模式下，postMessage 数据绑定机制保持不变：

```javascript
// 宿主应用发送实时数据
iframe.contentWindow.postMessage({
  type: 'tv:platform-data',
  payload: {
    fieldId: 'temperature',
    value: 25.5,
    timestamp: Date.now()
  }
}, '*');
```

## 安全最佳实践

1. **设置过期时间**：为临时分享设置过期时间
   ```typescript
   await createShareLink(id, { expiresIn: 24 * 3600 });  // 24小时
   ```

2. **及时吊销**：不再需要时立即吊销
   ```typescript
   await revokeShareLink(dashboardId);
   ```

3. **HTTPS Only**：生产环境使用 HTTPS

## 错误处理

常见错误：

| HTTP 状态码 | 错误信息 | 说明 |
|-----------|---------|------|
| 400 | Share token is required | 缺少 shareToken 参数 |
| 403 | Share not enabled | 分享未启用 |
| 403 | Invalid share token | Token 无效 |
| 403 | Share link has expired | 链接已过期 |
| 404 | Dashboard not found | 仪表板不存在 |

## 常见问题

**Q: 分享链接和 SSO Token 可以共存吗？**  
A: 可以。URL 参数优先级为：`shareToken` > `token`。

**Q: 如何更新过期时间？**  
A: 重新调用 `POST /api/v1/dashboards/:id/share` 即可。

**Q: 分享链接支持编辑模式吗？**  
A: 不支持。分享链接仅用于只读查看模式。编辑模式请使用 SSO Token。

**Q: 可以自定义分享链接的 URL 吗？**  
A: 不可以。shareToken 使用 UUID v4 生成，确保安全性。

## 迁移指南

从 SSO Token 迁移到分享链接：

1. 创建分享链接：`const { shareUrl } = await createShareLink(dashboardId);`
2. 更新嵌入代码：将 `token` 参数替换为 `shareToken`
3. 移除 SSO Token 管理代码

**注意**：
- SSO Token 方式仍然支持（向后兼容）
- 如需编辑功能，继续使用 SSO Token
- 分享链接仅支持只读模式

## 相关文档

- [架构设计文档](../share-link-embed-architecture-spec.md)
- [嵌入协议文档](./embed-protocol.md)
- [平台数据绑定](./platform-data-binding.md)
