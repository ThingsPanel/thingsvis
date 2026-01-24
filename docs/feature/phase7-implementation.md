# ThingsVis Phase 7 后端集成实现

## 实现概述

本次实现完成了 ThingsVis 前后端集成的关键功能，支持三种运行模式：

1. **本地模式 (Standalone)**: 无需后端，数据存储在浏览器 IndexedDB
2. **云端模式 (Full Stack)**: 前后端联动，数据存储在数据库
3. **嵌入模式 (Embed)**: iframe 嵌入到第三方应用

---

## 新增功能清单

### 1. 认证系统 (Phase 1)

#### 前端组件
- [apps/studio/src/lib/auth/AuthContext.tsx](apps/studio/src/lib/auth/AuthContext.tsx)
  - React Context 提供认证状态
  - 自动检测运行模式 (local/cloud/embed)
  - Token 管理和持久化

- [apps/studio/src/pages/LoginPage.tsx](apps/studio/src/pages/LoginPage.tsx)
  - 登录页面，支持邮箱/密码登录
  - "Continue without account" 选项进入本地模式

- [apps/studio/src/pages/RegisterPage.tsx](apps/studio/src/pages/RegisterPage.tsx)
  - 注册页面，支持新用户注册

- [apps/studio/src/pages/HomePage.tsx](apps/studio/src/pages/HomePage.tsx)
  - 主页显示项目列表
  - 根据认证状态显示本地或云端项目

- [apps/studio/src/components/ProtectedRoute.tsx](apps/studio/src/components/ProtectedRoute.tsx)
  - 路由守卫组件

#### 后端 API
- [packages/thingsvis-server/src/app/api/v1/auth/login/route.ts](packages/thingsvis-server/src/app/api/v1/auth/login/route.ts)
  - POST /api/v1/auth/login - JWT 登录
  
- [packages/thingsvis-server/src/app/api/v1/auth/me/route.ts](packages/thingsvis-server/src/app/api/v1/auth/me/route.ts)
  - GET /api/v1/auth/me - 获取当前用户

---

### 2. 存储抽象层 (Phase 2)

- [apps/studio/src/lib/storage/adapter/types.ts](apps/studio/src/lib/storage/adapter/types.ts)
  - StorageAdapter 接口定义

- [apps/studio/src/lib/storage/adapter/localAdapter.ts](apps/studio/src/lib/storage/adapter/localAdapter.ts)
  - IndexedDB 本地存储实现

- [apps/studio/src/lib/storage/adapter/cloudAdapter.ts](apps/studio/src/lib/storage/adapter/cloudAdapter.ts)
  - 云端 API 存储实现

- [apps/studio/src/hooks/useStorage.ts](apps/studio/src/hooks/useStorage.ts)
  - useStorage Hook 自动切换存储后端

---

### 3. 图片上传 (Phase 3)

- [packages/thingsvis-server/src/app/api/v1/uploads/route.ts](packages/thingsvis-server/src/app/api/v1/uploads/route.ts)
  - POST /api/v1/uploads - 文件上传
  - 支持 JPEG, PNG, GIF, WebP, SVG
  - 最大 10MB

- [apps/studio/src/lib/api/uploads.ts](apps/studio/src/lib/api/uploads.ts)
  - 前端上传 API 封装
  - 支持进度回调
  - dataUrl 转换上传

---

### 4. iframe 嵌入 (Phase 4)

- [apps/studio/src/pages/EmbedPage.tsx](apps/studio/src/pages/EmbedPage.tsx)
  - 嵌入预览页面
  - 支持 URL 参数加载: `?id=xxx&token=jwt`
  - 支持 postMessage 加载 schema

- [apps/studio/src/lib/embed/ThingsVisEmbed.ts](apps/studio/src/lib/embed/ThingsVisEmbed.ts)
  - Embed SDK 类
  - 简化第三方集成

---

## 路由结构

```
/                    - 主页（项目列表）
/login               - 登录页
/register            - 注册页
/editor              - 编辑器
/editor/:id          - 编辑指定大屏
/data-sources        - 数据源管理
/preview             - 预览页
/preview/:id         - 预览指定大屏
/embed               - iframe 嵌入页
/embed/:id           - 嵌入指定大屏
```

---

## API 端点

### 认证
```
POST /api/v1/auth/register  - 用户注册
POST /api/v1/auth/login     - 用户登录（返回 JWT）
GET  /api/v1/auth/me        - 获取当前用户信息
```

### 项目
```
GET    /api/v1/projects     - 获取项目列表
POST   /api/v1/projects     - 创建项目
GET    /api/v1/projects/:id - 获取项目详情
PUT    /api/v1/projects/:id - 更新项目
DELETE /api/v1/projects/:id - 删除项目
```

### 大屏
```
GET    /api/v1/dashboards     - 获取大屏列表
POST   /api/v1/dashboards     - 创建大屏
GET    /api/v1/dashboards/:id - 获取大屏详情
PUT    /api/v1/dashboards/:id - 更新大屏
DELETE /api/v1/dashboards/:id - 删除大屏
```

### 文件上传
```
POST /api/v1/uploads - 上传文件
```

---

## 使用示例

### 1. 前端登录
```typescript
import { useAuth } from '@/lib/auth';

function MyComponent() {
  const { login, isAuthenticated, user } = useAuth();
  
  const handleLogin = async () => {
    const result = await login({ email, password });
    if (result.success) {
      // 登录成功，自动切换到云端存储
    }
  };
}
```

### 2. 存储操作
```typescript
import { useStorage } from '@/hooks';

function ProjectList() {
  const { list, save, isCloud } = useStorage();
  
  // 自动使用正确的存储后端
  const projects = await list({ limit: 20 });
  await save(newProject);
}
```

### 3. iframe 嵌入
```html
<iframe 
  src="http://your-thingsvis.com/#/embed?id=dashboard-id&token=jwt"
  width="100%" 
  height="600"
></iframe>
```

### 4. 使用 Embed SDK
```javascript
import { ThingsVisEmbed } from '@thingsvis/embed-sdk';

const embed = new ThingsVisEmbed({
  container: '#dashboard',
  baseUrl: 'https://your-thingsvis.com',
});

// 加载大屏
embed.loadDashboard('dashboard-id', { token: 'jwt' });

// 或直接传入 schema
embed.loadSchema({
  canvas: { mode: 'fixed', width: 1920, height: 1080 },
  nodes: [...],
});

// 更新变量
embed.setVariables({ temperature: 25 });
```

---

## 新增依赖

### Studio (前端)
- `react-router-dom` ^6.22.0
- `@types/react-router-dom` (dev)

### Server (后端)
- `jose` (JWT 签名验证)
- `nanoid` (唯一 ID 生成)

---

## 启动方式

### 本地开发
```bash
# 启动后端
cd packages/thingsvis-server
pnpm db:push
pnpm dev

# 启动前端
cd apps/studio
pnpm dev
```

### Docker 部署
```bash
# 后端
docker build -t thingsvis-server ./packages/thingsvis-server
docker run -p 3001:3001 thingsvis-server

# 前端
docker build -t thingsvis-studio ./apps/studio
docker run -p 5173:80 thingsvis-studio
```

---

## 下一步计划

1. **完善数据源管理** - 支持 REST/WebSocket/MQTT 数据源配置持久化
2. **权限系统** - 基于 RBAC 的多租户权限控制
3. **版本控制** - 大屏版本历史和回滚
4. **协作功能** - 多人实时协作编辑
5. **导出功能** - PDF、图片、视频导出
