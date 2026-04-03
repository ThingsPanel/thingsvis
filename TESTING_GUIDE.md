# 分享链接功能手动测试指南

## 环境准备

### 1. 启动开发环境

```bash
# 进入项目目录
cd /Users/junhong/Downloads/code/thingsvis

# 确保在正确的分支
git checkout feature/share-link-embed

# 安装依赖（如果还没有）
pnpm install

# 启动数据库（如果使用 Docker）
# docker-compose up -d postgres

# 应用数据库迁移
cd apps/server
npx prisma db push
# 或者
npx prisma migrate dev

# 启动后端服务
cd apps/server
pnpm dev
# 后端会运行在 http://localhost:8000

# 启动前端（新终端）
cd apps/studio
pnpm dev
# 前端会运行在 http://localhost:3000
```

## 测试场景

### 场景 1: 使用 API 测试（推荐先测试）

#### 1.1 准备工作 - 获取认证 Token

**方式 1: 注册并登录**
```bash
# 1. 注册新用户
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'

# 2. 登录获取 token
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# 响应示例：
# {
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "user": { ... }
# }

# 保存返回的 token，后续测试需要用到
export TOKEN="你的token"
```

**方式 2: 使用现有账号**
```bash
# 如果已有账号，直接登录
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "你的邮箱",
    "password": "你的密码"
  }'
```

#### 1.2 创建测试仪表板

```bash
# 1. 先创建一个项目
curl -X POST http://localhost:8000/api/v1/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试项目",
    "description": "用于测试分享链接功能"
  }'

# 保存返回的 projectId
export PROJECT_ID="返回的项目ID"

# 2. 创建一个仪表板
curl -X POST http://localhost:8000/api/v1/dashboards \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试仪表板",
    "projectId": "'$PROJECT_ID'",
    "canvasConfig": {
      "mode": "infinite",
      "width": 1920,
      "height": 1080,
      "background": {"color": "#f0f0f0"}
    }
  }'

# 保存返回的 dashboardId
export DASHBOARD_ID="返回的仪表板ID"
```

#### 1.3 测试创建分享链接

```bash
# 创建永久分享链接
curl -X POST http://localhost:8000/api/v1/dashboards/$DASHBOARD_ID/share \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# 响应示例：
# {
#   "shareUrl": "http://localhost:3000/#/embed?id=xxx&shareToken=yyy",
#   "expiresAt": null
# }

# 创建 24 小时有效的分享链接
curl -X POST http://localhost:8000/api/v1/dashboards/$DASHBOARD_ID/share \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "expiresIn": 86400
  }'

# 保存返回的 shareToken
export SHARE_TOKEN="返回的shareToken"
```

#### 1.4 测试查询分享信息

```bash
curl -X GET http://localhost:8000/api/v1/dashboards/$DASHBOARD_ID/share \
  -H "Authorization: Bearer $TOKEN"

# 响应示例（token 已脱敏）：
# {
#   "enabled": true,
#   "url": "http://localhost:3000/#/embed?id=xxx&shareToken=a1b2c3d4****",
#   "expiresAt": "2026-04-03T10:00:00Z"
# }
```

#### 1.5 测试验证分享链接（无需认证）

```bash
# 这是公开接口，不需要 Authorization header
curl -X GET "http://localhost:8000/api/v1/dashboards/$DASHBOARD_ID/validate-share?shareToken=$SHARE_TOKEN"

# 成功响应：
# {
#   "valid": true,
#   "dashboard": {
#     "id": "...",
#     "name": "测试仪表板",
#     "canvasConfig": {...},
#     "nodes": [...],
#     ...
#   }
# }

# 测试无效 token
curl -X GET "http://localhost:8000/api/v1/dashboards/$DASHBOARD_ID/validate-share?shareToken=invalid-token"

# 失败响应：
# {
#   "valid": false,
#   "error": "Invalid share token"
# }
```

#### 1.6 测试吊销分享链接

```bash
curl -X DELETE http://localhost:8000/api/v1/dashboards/$DASHBOARD_ID/share \
  -H "Authorization: Bearer $TOKEN"

# 响应：HTTP 204 No Content

# 验证吊销后无法访问
curl -X GET "http://localhost:8000/api/v1/dashboards/$DASHBOARD_ID/validate-share?shareToken=$SHARE_TOKEN"

# 应该返回：
# {
#   "valid": false,
#   "error": "Share not enabled"
# }
```

### 场景 2: 使用前端界面测试

#### 2.1 访问前端

1. 打开浏览器访问 http://localhost:3000
2. 使用之前注册的账号登录（test@example.com / password123）

#### 2.2 测试 ShareDashboardDialog 组件

```bash
# 在浏览器控制台测试
# 打开浏览器开发者工具（F12）

# 1. 导入组件（在需要的页面）
import { ShareDashboardDialog } from '@/components/dashboard/ShareDashboardDialog';

# 2. 在仪表板详情页添加分享按钮
# 或者直接在控制台测试 API
const result = await fetch('/api/v1/dashboards/YOUR_DASHBOARD_ID/share', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('thingsvis_browser_token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ expiresIn: 86400 })
});
const data = await result.json();
console.log('分享链接:', data.shareUrl);
```

#### 2.3 测试嵌入页面

1. **使用分享链接访问**

```bash
# 复制上面创建的 shareUrl，在浏览器中打开
# 例如：http://localhost:3000/#/embed?id=xxx&shareToken=yyy
```

2. **验证功能**
   - ✅ 页面能正常加载
   - ✅ 不需要登录
   - ✅ 显示仪表板内容
   - ✅ 无需认证即可查看

3. **测试过期链接**
   - 创建一个短期有效的链接（如 expiresIn: 10 秒）
   - 等待 10 秒后刷新页面
   - 应该显示 "Share link has expired" 错误

### 场景 3: 端到端测试流程

#### 完整用户旅程

```bash
# 1. 作为仪表板所有者
# 访问 http://localhost:3000
# 登录 → 创建项目 → 创建仪表板 → 点击分享按钮

# 2. 创建分享链接
# 在 ShareDashboardDialog 中：
# - 选择过期时间（例如 7 天）
# - 点击"创建分享链接"
# - 复制生成的链接

# 3. 作为访客（无需登录）
# 打开新的隐私窗口/无痕模式
# 粘贴分享链接
# 验证：
#   ✅ 不需要登录
#   ✅ 能看到仪表板
#   ✅ 不能编辑

# 4. 测试吊销
# 回到所有者账号
# 点击"吊销分享"
# 回到访客窗口刷新
# 验证：显示 "Share not enabled" 错误
```

### 场景 4: 向后兼容性测试

#### 测试 SSO Token 仍然有效

```bash
# 1. 使用旧的 SSO Token 方式嵌入（如果有）
# http://localhost:3000/#/embed?id=xxx&token=<JWT>

# 2. 验证旧方式仍然工作
# ✅ 使用 token 参数可以访问
# ✅ 不影响现有功能

# 3. 测试优先级
# 同时提供 shareToken 和 token
# http://localhost:3000/#/embed?id=xxx&shareToken=yyy&token=zzz
# ✅ 应该优先使用 shareToken
```

## 常见问题排查

### 问题 1: "Unauthorized" 错误

**原因**: Token 无效或过期

**解决**:
```bash
# 重新登录获取新 token
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

### 问题 2: "Dashboard not found"

**原因**: Dashboard ID 不存在

**解决**:
```bash
# 列出所有仪表板
curl -X GET http://localhost:8000/api/v1/dashboards \
  -H "Authorization: Bearer $TOKEN"
```

### 问题 3: 数据库连接错误

**解决**:
```bash
# 检查数据库连接
cd apps/server
cat .env | grep DATABASE_URL

# 检查数据库迁移状态
npx prisma migrate status

# 重新应用迁移
npx prisma db push
```

### 问题 4: 前端无法连接后端

**解决**:
```bash
# 检查后端是否运行
curl http://localhost:8000/api/v1/health

# 检查前端 API 配置
# apps/studio/.env
# NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 验证清单

测试完成后，确保以下功能正常：

- [ ] 可以创建永久分享链接
- [ ] 可以创建带过期时间的分享链接
- [ ] 可以查询分享信息（token 已脱敏）
- [ ] 可以验证有效的分享链接（无需认证）
- [ ] 无效的 token 返回正确错误
- [ ] 过期的链接返回正确错误
- [ ] 可以吊销分享链接
- [ ] 吊销后无法访问
- [ ] 前端嵌入页面支持 shareToken
- [ ] ShareDashboardDialog 组件功能正常
- [ ] 复制链接功能正常
- [ ] 向后兼容（SSO Token 仍然有效）
- [ ] URL 参数优先级正确（shareToken > token）

## 测试数据清理

测试完成后清理测试数据：

```bash
# 删除测试仪表板
curl -X DELETE http://localhost:8000/api/v1/dashboards/$DASHBOARD_ID \
  -H "Authorization: Bearer $TOKEN"

# 删除测试项目
curl -X DELETE http://localhost:8000/api/v1/projects/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN"
```

## 下一步

测试通过后，可以：
1. 创建 Pull Request
2. 请团队成员 Code Review
3. 部署到测试环境
4. 部署到生产环境

---

**提示**: 建议使用 Postman 或 Insomnia 等 API 测试工具，可以保存测试集合方便后续测试。
