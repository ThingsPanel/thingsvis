# 初始化看板（Default Dashboard）

## 背景

thingsvis 系统支持在用户注册时，自动为其初始化默认的首页看板，提升新用户体验。

---

## 功能需求

### 1. 系统默认用户
用户首次安装系统后，thingsvis 会通过 seed 脚本默认创建一个 email 为 `admin@thingsvis.io` 的用户。

### 2. 用户注册时初始化看板
当用户（来自 IoT 平台或其他渠道）通过 `POST /api/v1/auth/register` 注册 thingsvis 用户时：

- **超管（SUPER_ADMIN）**：自动创建"超管首页"项目 + "Super Admin Home" 看板（`homeFlag: true`）
- **租户管理员（TENANT_ADMIN）**：自动创建"首页看板"项目 + "Tenant Admin Home" 看板（`homeFlag: true`）

> 注意：重复登录不会触发看板创建，看板仅在用户注册时初始化一次。

---

## 实现方案

### 数据模型

#### RegisterData 新增字段

```typescript
// apps/studio/src/lib/api/auth.ts
export interface RegisterData {
  email: string;
  password: string;
  name?: string;
  tenantId?: string;
  role?: 'SUPER_ADMIN' | 'TENANT_ADMIN'; // 新增：可选，标识用户类型
}
```

#### 新增字段验证

```typescript
// apps/server/src/lib/validators/auth.ts
export const RegisterSchema = z.object({
  email: z.string().email('Invalid email').max(254),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1).max(100).optional(),
  tenantId: z.string().cuid().optional(),
  role: z.enum(['SUPER_ADMIN', 'TENANT_ADMIN']).optional(), // 新增
});
```

### 数据初始化逻辑

在 `POST /api/v1/auth/register` 接口中，用户创建成功后：

1. 检查传入的 `role` 字段
2. 根据 `role` 判断用户类型
3. 调用 `ensureDefaultDashboardForUser()` 辅助函数：
   - 查找或创建默认项目（`Default Project` / `Super Admin Project`）
   - 查找或创建默认看板（仅当看板不存在时）
   - 设置 `homeFlag: true`

### 默认项目/看板配置

存放位置：`apps/server/src/constants/default-dashboards.ts`

| 用户类型 | 项目名称 | 看板名称 |
|----------|----------|----------|
| SUPER_ADMIN | `Super Admin Project` | `Super Admin Home` |
| TENANT_ADMIN | `Default Project` | `Tenant Admin Home` |

> **注意**：看板配置中的 `dataSources` 为空数组 `[]`。

---

## API 变更

### 请求示例

#### 超管注册
```json
POST /api/v1/auth/register
{
  "email": "admin@example.com",
  "password": "password123",
  "name": "Admin User",
  "role": "SUPER_ADMIN"
}
```

#### 租户管理员注册
```json
POST /api/v1/auth/register
{
  "email": "tenant-admin@example.com",
  "password": "password123",
  "name": "Tenant Admin",
  "role": "TENANT_ADMIN"
}
```

#### 普通用户注册（无 role 字段，不创建看板）
```json
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Normal User"
}
```

### 响应

响应格式保持不变：
```json
{
  "id": "user_id",
  "email": "admin@example.com",
  "name": "Admin User",
  "role": "SUPER_ADMIN",
  "tenantId": "tenant_id",
  "createdAt": "2026-03-27T10:00:00.000Z"
}
```

---

## 技术实现细节

### 辅助函数签名

```typescript
// apps/server/src/lib/dashboard-helpers.ts

/**
 * 确保用户拥有默认首页看板
 * @param userId 用户ID
 * @param tenantId 租户ID
 * @param role 用户角色：SUPER_ADMIN 或 TENANT_ADMIN
 */
async function ensureDefaultDashboardForUser(
  userId: string,
  tenantId: string,
  role: 'SUPER_ADMIN' | 'TENANT_ADMIN'
): Promise<void>
```

### 看板创建逻辑

```typescript
// 伪代码
async function ensureDefaultDashboardForUser(userId, tenantId, role) {
  const config = role === 'SUPER_ADMIN' ? SUPER_ADMIN_CONFIG : TENANT_ADMIN_CONFIG;

  // 1. 查找或创建项目
  let project = await prisma.project.findFirst({
    where: { tenantId, name: config.projectName },
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        name: config.projectName,
        tenantId,
        createdById: userId,
      },
    });
  }

  // 2. 检查看板是否已存在
  const existingDashboard = await prisma.dashboard.findFirst({
    where: { projectId: project.id, name: config.dashboardName },
  });

  if (existingDashboard) {
    return; // 已存在，跳过
  }

  // 3. 创建看板
  await prisma.dashboard.create({
    data: {
      name: config.dashboardName,
      projectId: project.id,
      createdById: userId,
      homeFlag: true,
      canvasConfig: config.canvasConfig,
      nodes: config.nodes,
      dataSources: '[]', // 空数组
      variables: '[]',
    },
  });
}
```

### 默认看板配置

#### Super Admin Home

```json
{
  "projectName": "Super Admin Project",
  "dashboardName": "Super Admin Home",
  "canvasConfig": {
    "mode": "grid",
    "width": 1500,
    "height": 1000,
    "background": { "color": "transparent" },
    "theme": "dawn",
    "scaleMode": "fit-min",
    "previewAlignY": "center",
    "gridCols": 24,
    "gridRowHeight": 50,
    "gridGap": 5,
    "gridEnabled": true,
    "gridSize": 20
  },
  "nodes": [
    {
      "id": "device-total",
      "type": "interaction/value-card-simple",
      "props": { "title": "总设备数", "value": 0, "unit": "个", "showUnit": true },
      "data": [{ "targetProp": "value", "expression": "{{ ds.__platform__.data.device_total }}" }],
      "grid": { "x": 0, "y": 0, "w": 6, "h": 3 }
    },
    {
      "id": "device-online",
      "type": "interaction/value-card-simple",
      "props": { "title": "在线设备", "value": 0, "unit": "个", "showUnit": true },
      "data": [{ "targetProp": "value", "expression": "{{ ds.__platform__.data.device_online }}" }],
      "grid": { "x": 6, "y": 0, "w": 6, "h": 3 }
    },
    {
      "id": "device-offline",
      "type": "interaction/value-card-simple",
      "props": { "title": "离线设备", "value": 0, "unit": "个", "showUnit": true },
      "data": [{ "targetProp": "value", "expression": "{{ ds.__platform__.data.device_offline }}" }],
      "grid": { "x": 12, "y": 0, "w": 6, "h": 3 }
    },
    {
      "id": "alarm-device",
      "type": "interaction/value-card-simple",
      "props": { "title": "告警设备", "value": 0, "unit": "个", "showUnit": true },
      "data": [{ "targetProp": "value", "expression": "{{ ds.__platform__.data.alarm_device_total }}" }],
      "grid": { "x": 18, "y": 0, "w": 6, "h": 3 }
    },
    {
      "id": "disk-chart",
      "type": "chart/uplot-line",
      "props": { "title": "磁盘占用", "primaryColor": "#6965db", "showLegend": true },
      "data": [{ "targetProp": "data", "expression": "{{ ds.__platform__.data.disk_usage__history }}" }],
      "grid": { "x": 0, "y": 3, "w": 12, "h": 7 }
    },
    {
      "id": "memory-chart",
      "type": "chart/uplot-line",
      "props": { "title": "内存占用", "primaryColor": "#6965db", "showLegend": true },
      "data": [{ "targetProp": "data", "expression": "{{ ds.__platform__.data.memory_usage__history }}" }],
      "grid": { "x": 12, "y": 3, "w": 12, "h": 7 }
    }
  ]
}
```

#### Tenant Admin Home

```json
{
  "projectName": "Default Project",
  "dashboardName": "Tenant Admin Home",
  "canvasConfig": {
    "mode": "fixed",
    "width": 1920,
    "height": 1080,
    "background": { "color": "#f0f0f0" },
    "theme": "dawn",
    "scaleMode": "fit-width",
    "previewAlignY": "center",
    "gridCols": 24,
    "gridRowHeight": 50,
    "gridGap": 5,
    "gridEnabled": true,
    "gridSize": 20
  },
  "nodes": [
    {
      "id": "device-total",
      "type": "basic/rectangle",
      "props": { "fill": "#d64a92", "cornerRadius": 18 },
      "grid": { "x": 0, "y": 0, "w": 9, "h": 3 }
    },
    {
      "id": "device-online",
      "type": "basic/rectangle",
      "props": { "fill": "#7059d9", "cornerRadius": 18 },
      "grid": { "x": 9, "y": 0, "w": 9, "h": 3 }
    },
    {
      "id": "device-offline",
      "type": "basic/rectangle",
      "props": { "fill": "#62b8f9", "cornerRadius": 18 },
      "grid": { "x": 18, "y": 0, "w": 6, "h": 3 }
    },
    {
      "id": "alarm-stat",
      "type": "basic/rectangle",
      "props": { "fill": "#ff5a34", "cornerRadius": 18 },
      "grid": { "x": 18, "y": 0, "w": 6, "h": 3 }
    }
  ]
}
```

---

## 涉及的代码文件

| 文件路径 | 变更内容 |
|----------|----------|
| `apps/studio/src/lib/api/auth.ts` | `RegisterData` 新增 `role` 字段 |
| `apps/server/src/lib/validators/auth.ts` | `RegisterSchema` 新增 `role` 验证 |
| `apps/server/src/app/api/v1/auth/register/route.ts` | 用户创建后调用 `ensureDefaultDashboardForUser` |
| `apps/server/src/constants/default-dashboards.ts` | 新增：默认项目/看板配置常量 |
| `apps/server/src/lib/dashboard-helpers.ts` | 新增：`ensureDefaultDashboardForUser` 辅助函数 |

---

## 数据库变更

无新增表或字段。依赖现有的 `projects` 和 `dashboards` 表。

---

## 兼容性

- `role` 字段为**可选字段**，不传则保持原有逻辑
- 现有注册流程不受影响
- 超级管理员可同时使用 SSO 登录（需 IoT 平台支持传入 `role`）
