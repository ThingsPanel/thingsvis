# SSO API 测试文档

## 测试 SSO Token Exchange API

### 方法 1: 使用 PowerShell (Windows)

```powershell
$body = @{
    platform = "thingspanel"
    platformToken = "test_token_abc123"
    userInfo = @{
        id = "tp_user_001"
        email = "test@example.com"
        name = "测试用户"
        tenantId = "tenant_demo"
    }
} | ConvertTo-Json

Invoke-WebRequest `
  -Uri "http://localhost:3001/api/v1/auth/sso" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### 方法 2: 使用 curl (如果已安装真正的 curl)

```bash
curl -X POST http://localhost:3001/api/v1/auth/sso \
  -H "Content-Type: application/json" \
  -d @test-sso-request.json
```

### 预期响应

成功时 (200):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 7200,
  "user": {
    "id": "clxxxxx",
    "email": "test@example.com",
    "name": "测试用户",
    "role": "EDITOR",
    "tenantId": "clxxxxx",
    "tenant": {
      "id": "clxxxxx",
      "name": "thingspanel - tenant_demo"
    }
  }
}
```

失败时 (400):
```json
{
  "error": "Validation failed",
  "details": { ... }
}
```

## 常见问题

### 问题: 500 Internal Server Error

可能原因:
1. 数据库未同步 schema
2. 环境变量 AUTH_SECRET 未设置
3. Prisma Client 未生成

解决方案:
```bash
cd apps/server
pnpm prisma generate
pnpm prisma db push
```

### 问题: 404 Not Found

原因: 服务器未启动或 API 路由未正确注册

解决方案:
```bash
pnpm dev --filter @thingsvis/server
```
