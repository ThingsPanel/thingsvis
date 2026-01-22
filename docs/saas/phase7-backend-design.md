# ThingsVis 第七阶段：后端服务设计方案

**版本**: 1.0.0  
**创建日期**: 2026-01-21  
**技术栈**: Next.js 15 + React 19 + Prisma + PostgreSQL  
**状态**: 草稿

---

## 📋 目录

1. [技术选型](#1-技术选型)
2. [项目结构](#2-项目结构)
3. [数据库设计](#3-数据库设计)
4. [API 设计](#4-api-设计)
5. [认证授权](#5-认证授权)
6. [嵌入 SDK](#6-嵌入-sdk)
7. [Docker 部署](#7-docker-部署)
8. [实施计划](#8-实施计划)

---

## 1. 技术选型

### 1.1 技术栈决策

| 层级 | 技术 | 理由 |
|------|------|------|
| **框架** | Next.js 15 (App Router) | 全栈框架、RSC、API Routes、部署简单 |
| **运行时** | Node.js 20 LTS | 稳定版本、长期支持 |
| **ORM** | Prisma | 类型安全、迁移工具、良好的 DX |
| **数据库** | PostgreSQL 16 | JSONB 支持、性能好、开源 |
| **缓存** | Redis 7 (可选) | Session、限流、缓存 |
| **认证** | NextAuth.js v5 | 内置 JWT/OAuth、与 Next.js 深度集成 |
| **API 文档** | Swagger/OpenAPI | 行业标准 |
| **验证** | Zod | 与 Prisma/Next.js 配合好 |

### 1.2 数据库选型对比

> **用户需求**: 是否有更轻量的数据库选择？

| 数据库 | 类型 | 优势 | 劣势 | 适用场景 |
|--------|------|------|------|----------|
| **SQLite** | 嵌入式 | 零配置、单文件、性能好 | 并发写入受限、无网络访问 | 单机/小团队 |
| **Turso (libSQL)** | SQLite云服务 | SQLite兼容、边缘部署、免费额度 | 新技术、生态较小 | Serverless |
| **PostgreSQL** | 关系型 | JSONB、全功能、生态成熟 | 需要运维、资源占用 | 生产环境 |
| **PlanetScale** | MySQL云服务 | 自动扩容、分支工作流 | 无外键、收费 | SaaS |
| **Supabase** | PostgreSQL云服务 | 实时订阅、Auth内置 | 依赖第三方 | 快速原型 |

#### 竞品数据库选型分析

| 竞品 | 数据库 | 备注 |
|------|--------|------|
| **Grafana** | SQLite (默认) / PostgreSQL / MySQL | 小规模默认 SQLite，生产推荐 PostgreSQL |
| **Metabase** | H2 (默认) / PostgreSQL / MySQL | H2 仅用于试用，生产必须迁移 |
| **Redash** | PostgreSQL | 仅支持 PostgreSQL |
| **Apache Superset** | SQLite (默认) / PostgreSQL | 同 Grafana |
| **ThingsBoard** | PostgreSQL / Cassandra / TimescaleDB | 时序数据用 Cassandra/Timescale |

#### 推荐方案

```
┌─────────────────────────────────────────────────────────────┐
│                    数据库分层策略                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  开发/小规模部署:                                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              SQLite / Turso                         │    │
│  │  • 零运维、单文件备份                               │    │
│  │  • Prisma 完整支持                                  │    │
│  │  • 适合 <1000 用户                                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  生产/企业部署:                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              PostgreSQL                             │    │
│  │  • JSONB 存储画布数据                               │    │
│  │  • 高并发、全功能                                   │    │
│  │  • 行业标准                                         │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Serverless/边缘部署:                                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Turso (libSQL)                         │    │
│  │  • SQLite 协议兼容                                  │    │
│  │  • 边缘复制、低延迟                                 │    │
│  │  • Vercel/Cloudflare 友好                           │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**结论**: 
- **Phase 1 (MVP)**: 使用 **SQLite** 快速启动，Prisma 支持无缝迁移
- **Phase 2 (生产)**: 迁移到 **PostgreSQL**，仅需改 `DATABASE_URL`
- **可选**: 使用 **Turso** 获得 SQLite 的简单性 + 云端能力

### 1.2 为什么选择 Next.js 而非纯后端框架

```
┌─────────────────────────────────────────────────────────────┐
│                    架构对比                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  方案 A: 分离架构 (Fastify + Vite)                          │
│  ┌─────────────┐     ┌─────────────┐                        │
│  │  Frontend   │────▶│  Backend    │                        │
│  │  (Vite)     │     │  (Fastify)  │                        │
│  └─────────────┘     └─────────────┘                        │
│  ⚠️ 需要维护两套构建、两个仓库/包                           │
│                                                             │
│  方案 B: 全栈架构 (Next.js) ✅ 推荐                         │
│  ┌─────────────────────────────────────────┐                │
│  │              Next.js                     │                │
│  │  ┌─────────────┐  ┌─────────────────┐   │                │
│  │  │  Frontend   │  │  API Routes     │   │                │
│  │  │  (React)    │  │  (Route Handler)│   │                │
│  │  └─────────────┘  └─────────────────┘   │                │
│  └─────────────────────────────────────────┘                │
│  ✅ 统一构建、类型共享、部署简单                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Next.js 优势**:
1. **API Routes**: 内置 REST API 支持，无需额外框架
2. **类型共享**: 前后端共用 TypeScript 类型
3. **Server Actions**: 简化表单处理
4. **中间件**: 统一的认证/鉴权
5. **部署简单**: Vercel/Docker 一键部署

---

## 2. 项目结构

### 2.1 新增包结构

```
packages/
├── thingsvis-server/              # 后端服务 (新增)
│   ├── package.json
│   ├── next.config.js
│   ├── prisma/
│   │   ├── schema.prisma          # 数据库 Schema
│   │   └── migrations/            # 迁移文件
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/               # API Routes
│   │   │   │   ├── v1/
│   │   │   │   │   ├── auth/
│   │   │   │   │   │   ├── login/route.ts
│   │   │   │   │   │   ├── register/route.ts
│   │   │   │   │   │   ├── refresh/route.ts
│   │   │   │   │   │   └── sso/route.ts
│   │   │   │   │   ├── projects/
│   │   │   │   │   │   ├── route.ts              # GET/POST
│   │   │   │   │   │   └── [id]/route.ts         # GET/PUT/DELETE
│   │   │   │   │   ├── dashboards/
│   │   │   │   │   │   ├── route.ts
│   │   │   │   │   │   ├── [id]/route.ts
│   │   │   │   │   │   └── [id]/publish/route.ts
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── route.ts
│   │   │   │   │   │   └── registry/route.ts
│   │   │   │   │   ├── proxy/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── health/route.ts
│   │   │   │   └── docs/                         # Swagger UI
│   │   │   ├── admin/                            # 管理后台页面
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   ├── projects/page.tsx
│   │   │   │   ├── components/page.tsx
│   │   │   │   └── users/page.tsx
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx                          # 首页/登录
│   │   ├── lib/
│   │   │   ├── db.ts                             # Prisma Client
│   │   │   ├── auth.ts                           # NextAuth 配置
│   │   │   ├── validators/                       # Zod Schemas
│   │   │   └── services/                         # 业务逻辑
│   │   │       ├── project.service.ts
│   │   │       ├── dashboard.service.ts
│   │   │       ├── component.service.ts
│   │   │       └── proxy.service.ts
│   │   ├── middleware.ts                         # 认证中间件
│   │   └── types/                                # 类型定义
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── thingsvis-embed/               # 已有 - 通信桥接层
│   ├── dist/
│   │   ├── index.js               # HostBridge + EditorBridge
│   │   ├── index.d.ts             # 类型定义
│   │   └── vue/                   # Vue 适配器
│   └── (已实现: postMessage 通信协议)
│
├── thingsvis-embed-sdk/           # 新增 - API Client SDK
│   ├── package.json
│   ├── src/
│   │   ├── index.ts
│   │   ├── client.ts              # REST API Client
│   │   ├── auth.ts                # 认证管理
│   │   └── types.ts
│   └── tsup.config.ts
```

### 2.2 包依赖关系

```
┌─────────────────────────────────────────────────────────────┐
│                      包依赖关系                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  @thingsvis/schema ◄────────────────────────────────────┐   │
│         │                                               │   │
│         ▼                                               │   │
│  @thingsvis/server ────────────────────────────────┐    │   │
│         │                                          │    │   │
│         ▼                                          ▼    │   │
│  @thingsvis/embed-sdk ─────────────────────▶ @thingsvis/ui  │
│         │                                               │   │
│         ▼                                               │   │
│  第三方平台 (ThingsPanel)                               │   │
│                                                         │   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 数据库设计

### 3.1 Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

// 支持 SQLite (开发) 和 PostgreSQL (生产) 双模式
// 开发: DATABASE_URL="file:./dev.db"
// 生产: DATABASE_URL="postgres://user:pass@host:5432/thingsvis"
datasource db {
  provider = "sqlite"  // 或 "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// 租户与用户
// ============================================================================

model Tenant {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  plan        Plan     @default(FREE)
  settings    Json     @default("{}")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  users       User[]
  projects    Project[]
  components  Component[]
  apiKeys     ApiKey[]
  auditLogs   AuditLog[]

  @@map("tenants")
}

enum Plan {
  FREE
  PRO
  ENTERPRISE
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  passwordHash  String?
  avatar        String?
  role          UserRole  @default(VIEWER)
  
  // SSO 字段
  ssoProvider   String?
  ssoSubject    String?
  
  tenantId      String
  tenant        Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastLoginAt   DateTime?

  projects      Project[]
  dashboards    Dashboard[]
  apiKeys       ApiKey[]
  auditLogs     AuditLog[]

  @@unique([ssoProvider, ssoSubject])
  @@map("users")
}

enum UserRole {
  OWNER
  ADMIN
  EDITOR
  VIEWER
}

// ============================================================================
// 项目与大屏
// ============================================================================

model Project {
  id          String   @id @default(cuid())
  name        String
  description String?
  thumbnail   String?  // Base64 或 URL
  
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  createdById String
  createdBy   User     @relation(fields: [createdById], references: [id])
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  dashboards  Dashboard[]

  @@index([tenantId])
  @@map("projects")
}

model Dashboard {
  id           String   @id @default(cuid())
  name         String
  version      Int      @default(1)
  
  // 画布配置 (来自 @thingsvis/schema)
  canvasConfig Json     // { mode, width, height, background, ... }
  
  // 节点数据 (来自 @thingsvis/schema NodeSchema[])
  nodes        Json     @default("[]")
  
  // 数据源配置
  dataSources  Json     @default("[]")
  
  // 发布状态
  isPublished  Boolean  @default(false)
  publishedAt  DateTime?
  shareToken   String?  @unique  // 公开分享 token
  shareConfig  Json?    // { password?, expiresAt?, filters? }
  
  projectId    String
  project      Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  createdById  String
  createdBy    User     @relation(fields: [createdById], references: [id])
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // 版本历史
  versions     DashboardVersion[]

  @@index([projectId])
  @@index([shareToken])
  @@map("dashboards")
}

model DashboardVersion {
  id           String   @id @default(cuid())
  version      Int
  canvasConfig Json
  nodes        Json
  dataSources  Json
  
  dashboardId  String
  dashboard    Dashboard @relation(fields: [dashboardId], references: [id], onDelete: Cascade)
  
  createdAt    DateTime @default(now())

  @@unique([dashboardId, version])
  @@map("dashboard_versions")
}

// ============================================================================
// 组件注册中心
// ============================================================================

model Component {
  id          String   @id @default(cuid())
  name        String
  displayName String
  category    String   // basic, chart, media, custom
  description String?
  icon        String?
  
  // 是否公开 (跨租户可见)
  isPublic    Boolean  @default(false)
  
  // 所属租户 (null 表示系统内置)
  tenantId    String?
  tenant      Tenant?  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  versions    ComponentVersion[]

  @@unique([tenantId, name])
  @@map("components")
}

model ComponentVersion {
  id          String   @id @default(cuid())
  version     String   // semver: 1.0.0
  
  // 组件包 URL (CDN 或本地路径)
  bundleUrl   String
  
  // 组件清单 (manifest.json 内容)
  manifest    Json
  
  // 组件 Schema (PropsSchema)
  propsSchema Json?
  
  componentId String
  component   Component @relation(fields: [componentId], references: [id], onDelete: Cascade)
  
  publishedAt DateTime @default(now())

  @@unique([componentId, version])
  @@map("component_versions")
}

// ============================================================================
// API Key 与审计
// ============================================================================

model ApiKey {
  id          String   @id @default(cuid())
  name        String
  keyHash     String   @unique  // SHA256 hash
  keyPrefix   String   // 前8位用于识别: sk_xxxx...
  
  permissions Json     @default("[]")  // ["read:projects", "write:dashboards"]
  
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  createdById String
  createdBy   User     @relation(fields: [createdById], references: [id])
  
  expiresAt   DateTime?
  lastUsedAt  DateTime?
  createdAt   DateTime @default(now())

  @@map("api_keys")
}

model AuditLog {
  id           String   @id @default(cuid())
  action       String   // create, update, delete, publish, share
  resourceType String   // project, dashboard, component, user
  resourceId   String
  details      Json?
  
  tenantId     String
  tenant       Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  userId       String?
  user         User?    @relation(fields: [userId], references: [id])
  
  ipAddress    String?
  userAgent    String?
  
  createdAt    DateTime @default(now())

  @@index([tenantId, createdAt])
  @@index([resourceType, resourceId])
  @@map("audit_logs")
}

// ============================================================================
// Guest Token (临时访问)
// ============================================================================

model GuestToken {
  id          String   @id @default(cuid())
  token       String   @unique
  
  // 可访问的资源
  dashboardId String
  
  // 数据过滤 (多租户隔离)
  filters     Json?    // { tenantId, deviceId, ... }
  
  expiresAt   DateTime
  createdAt   DateTime @default(now())

  @@index([token])
  @@map("guest_tokens")
}
```

### 3.2 数据库关系图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         数据库 ER 图                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────┐                                                           │
│  │ Tenant   │                                                           │
│  ├──────────┤                                                           │
│  │ id       │◄─────────────────────────────────────────────────────┐    │
│  │ name     │                                                      │    │
│  │ plan     │                                                      │    │
│  └────┬─────┘                                                      │    │
│       │                                                            │    │
│       │ 1:N                                                        │    │
│       ▼                                                            │    │
│  ┌──────────┐      ┌───────────┐      ┌─────────────┐              │    │
│  │ User     │──────│ Project   │──────│ Dashboard   │              │    │
│  ├──────────┤ 1:N  ├───────────┤ 1:N  ├─────────────┤              │    │
│  │ id       │      │ id        │      │ id          │              │    │
│  │ email    │      │ name      │      │ canvasConfig│              │    │
│  │ role     │      │ tenantId  │◄─────│ nodes       │              │    │
│  │ tenantId │◄─────│ createdBy │      │ dataSources │              │    │
│  └──────────┘      └───────────┘      │ shareToken  │              │    │
│       │                               └──────┬──────┘              │    │
│       │                                      │                     │    │
│       │ 1:N                                  │ 1:N                 │    │
│       ▼                                      ▼                     │    │
│  ┌──────────┐                        ┌─────────────────┐           │    │
│  │ ApiKey   │                        │ DashboardVersion│           │    │
│  ├──────────┤                        ├─────────────────┤           │    │
│  │ keyHash  │                        │ version         │           │    │
│  │ perms    │                        │ nodes           │           │    │
│  └──────────┘                        └─────────────────┘           │    │
│                                                                    │    │
│  ┌──────────┐      ┌──────────────────┐                            │    │
│  │Component │──────│ ComponentVersion │                            │    │
│  ├──────────┤ 1:N  ├──────────────────┤                            │    │
│  │ name     │      │ version          │                            │    │
│  │ category │      │ bundleUrl        │                            │    │
│  │ tenantId │◄─────│ manifest         │                            │    │
│  └──────────┘      └──────────────────┘                            │    │
│       │                                                            │    │
│       └────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. API 设计

### 4.1 API 端点概览

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           REST API 端点                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  认证 (/api/v1/auth)                                                    │
│  ├── POST   /login              用户登录 (email/password)              │
│  ├── POST   /register           用户注册                                │
│  ├── POST   /refresh            刷新 Token                              │
│  ├── POST   /logout             登出                                    │
│  ├── POST   /sso/exchange       SSO Token 交换 (ThingsPanel)            │
│  └── POST   /guest-token        创建临时访问令牌                        │
│                                                                         │
│  项目 (/api/v1/projects)                                                │
│  ├── GET    /                   获取项目列表                            │
│  ├── POST   /                   创建项目                                │
│  ├── GET    /:id                获取项目详情                            │
│  ├── PUT    /:id                更新项目                                │
│  └── DELETE /:id                删除项目                                │
│                                                                         │
│  大屏 (/api/v1/dashboards)                                              │
│  ├── GET    /                   获取大屏列表                            │
│  ├── POST   /                   创建大屏                                │
│  ├── GET    /:id                获取大屏详情                            │
│  ├── PUT    /:id                更新大屏                                │
│  ├── DELETE /:id                删除大屏                                │
│  ├── POST   /:id/publish        发布大屏                                │
│  ├── POST   /:id/share          生成分享链接                            │
│  ├── GET    /:id/versions       获取版本历史                            │
│  └── POST   /:id/restore/:ver   恢复到指定版本                          │
│                                                                         │
│  公开访问 (/api/v1/public)                                              │
│  └── GET    /dashboard/:token   通过 shareToken 获取大屏 (无需登录)     │
│                                                                         │
│  组件 (/api/v1/components)                                              │
│  ├── GET    /                   获取组件列表                            │
│  ├── POST   /register           注册新组件                              │
│  ├── GET    /:id                获取组件详情                            │
│  ├── POST   /:id/versions       发布新版本                              │
│  └── GET    /registry           获取组件 Registry (兼容现有格式)        │
│                                                                         │
│  数据代理 (/api/v1/proxy)                                               │
│  ├── POST   /rest               REST API 代理                          │
│  └── WS     /ws                 WebSocket 代理                          │
│                                                                         │
│  系统 (/api/v1)                                                         │
│  ├── GET    /health             健康检查                                │
│  └── GET    /metrics            Prometheus 指标                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 API 实现示例

```typescript
// src/app/api/v1/dashboards/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { authOptions } from '@/lib/auth'

// 请求验证 Schema
const CreateDashboardSchema = z.object({
  name: z.string().min(1).max(100),
  projectId: z.string().cuid(),
  canvasConfig: z.object({
    mode: z.enum(['fixed', 'infinite', 'reflow']),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    background: z.string(),
  }),
  nodes: z.array(z.any()).optional().default([]),
  dataSources: z.array(z.any()).optional().default([]),
})

// GET /api/v1/dashboards - 获取大屏列表
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  const where = {
    project: { tenantId: session.user.tenantId },
    ...(projectId && { projectId }),
  }

  const [dashboards, total] = await Promise.all([
    prisma.dashboard.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.dashboard.count({ where }),
  ])

  return NextResponse.json({
    data: dashboards,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}

// POST /api/v1/dashboards - 创建大屏
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const result = CreateDashboardSchema.safeParse(body)
  
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    )
  }

  const { projectId, ...data } = result.data

  // 验证项目归属
  const project = await prisma.project.findFirst({
    where: { id: projectId, tenantId: session.user.tenantId },
  })
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const dashboard = await prisma.dashboard.create({
    data: {
      ...data,
      projectId,
      createdById: session.user.id,
    },
  })

  // 记录审计日志
  await prisma.auditLog.create({
    data: {
      action: 'create',
      resourceType: 'dashboard',
      resourceId: dashboard.id,
      tenantId: session.user.tenantId,
      userId: session.user.id,
    },
  })

  return NextResponse.json(dashboard, { status: 201 })
}
```

```typescript
// src/app/api/v1/dashboards/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { authOptions } from '@/lib/auth'

type Params = { params: { id: string } }

// GET /api/v1/dashboards/:id
export async function GET(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dashboard = await prisma.dashboard.findFirst({
    where: {
      id: params.id,
      project: { tenantId: session.user.tenantId },
    },
    include: {
      project: true,
      createdBy: { select: { id: true, name: true, email: true } },
    },
  })

  if (!dashboard) {
    return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
  }

  return NextResponse.json(dashboard)
}

// PUT /api/v1/dashboards/:id
export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  // 检查权限
  const existing = await prisma.dashboard.findFirst({
    where: {
      id: params.id,
      project: { tenantId: session.user.tenantId },
    },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
  }

  // 保存版本历史
  await prisma.dashboardVersion.create({
    data: {
      dashboardId: existing.id,
      version: existing.version,
      canvasConfig: existing.canvasConfig,
      nodes: existing.nodes,
      dataSources: existing.dataSources,
    },
  })

  // 更新大屏
  const dashboard = await prisma.dashboard.update({
    where: { id: params.id },
    data: {
      ...body,
      version: { increment: 1 },
      updatedAt: new Date(),
    },
  })

  return NextResponse.json(dashboard)
}

// DELETE /api/v1/dashboards/:id
export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const existing = await prisma.dashboard.findFirst({
    where: {
      id: params.id,
      project: { tenantId: session.user.tenantId },
    },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
  }

  await prisma.dashboard.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
```

### 4.3 公开访问 API

```typescript
// src/app/api/v1/public/dashboard/[token]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

type Params = { params: { token: string } }

// GET /api/v1/public/dashboard/:token - 通过 shareToken 获取大屏
export async function GET(request: NextRequest, { params }: Params) {
  const dashboard = await prisma.dashboard.findFirst({
    where: {
      shareToken: params.token,
      isPublished: true,
    },
    select: {
      id: true,
      name: true,
      canvasConfig: true,
      nodes: true,
      dataSources: true,
      shareConfig: true,
    },
  })

  if (!dashboard) {
    return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
  }

  // 检查分享配置
  const shareConfig = dashboard.shareConfig as any
  if (shareConfig?.expiresAt && new Date(shareConfig.expiresAt) < new Date()) {
    return NextResponse.json({ error: 'Share link expired' }, { status: 410 })
  }

  // 如果需要密码验证
  if (shareConfig?.password) {
    const password = request.headers.get('X-Share-Password')
    if (password !== shareConfig.password) {
      return NextResponse.json(
        { error: 'Password required', requirePassword: true },
        { status: 401 }
      )
    }
  }

  return NextResponse.json(dashboard)
}
```

---

## 5. 认证授权

### 5.1 NextAuth 配置

```typescript
// src/lib/auth.ts

import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GitHubProvider from 'next-auth/providers/github'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { compare } from 'bcryptjs'
import { prisma } from './db'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    // 邮箱密码登录
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { tenant: true },
        })

        if (!user || !user.passwordHash) {
          return null
        }

        const isValid = await compare(credentials.password, user.passwordHash)
        if (!isValid) {
          return null
        }

        // 更新最后登录时间
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          tenantName: user.tenant.name,
        }
      },
    }),

    // GitHub OAuth
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.tenantId = user.tenantId
        token.tenantName = user.tenantName
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.tenantId = token.tenantId as string
        session.user.tenantName = token.tenantName as string
      }
      return session
    },
  },
}
```

### 5.2 SSO Token 交换 (ThingsPanel 集成)

```typescript
// src/app/api/v1/auth/sso/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { SignJWT } from 'jose'
import { prisma } from '@/lib/db'

const SSOExchangeSchema = z.object({
  platform: z.literal('thingspanel'),
  platformToken: z.string(),
  userInfo: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string().optional(),
    tenantId: z.string(),
  }),
})

// POST /api/v1/auth/sso/exchange
export async function POST(request: NextRequest) {
  const body = await request.json()
  const result = SSOExchangeSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    )
  }

  const { platform, platformToken, userInfo } = result.data

  // TODO: 验证 platformToken (调用 ThingsPanel API)
  // const isValid = await verifyThingsPanelToken(platformToken)
  // if (!isValid) {
  //   return NextResponse.json({ error: 'Invalid platform token' }, { status: 401 })
  // }

  // 查找或创建租户
  let tenant = await prisma.tenant.findUnique({
    where: { slug: userInfo.tenantId },
  })
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: `ThingsPanel Tenant ${userInfo.tenantId}`,
        slug: userInfo.tenantId,
      },
    })
  }

  // 查找或创建用户
  let user = await prisma.user.findFirst({
    where: {
      ssoProvider: platform,
      ssoSubject: userInfo.id,
    },
  })

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: userInfo.email,
        name: userInfo.name,
        ssoProvider: platform,
        ssoSubject: userInfo.id,
        tenantId: tenant.id,
        role: 'EDITOR',
      },
    })
  }

  // 生成 JWT
  const secret = new TextEncoder().encode(process.env.JWT_SECRET)
  const accessToken = await new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(secret)

  const refreshToken = await new SignJWT({ sub: user.id })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)

  return NextResponse.json({
    accessToken,
    refreshToken,
    expiresIn: 7200,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  })
}
```

### 5.3 Guest Token (临时访问)

```typescript
// src/app/api/v1/auth/guest-token/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { prisma } from '@/lib/db'
import { authOptions } from '@/lib/auth'

const CreateGuestTokenSchema = z.object({
  dashboardId: z.string().cuid(),
  expiresIn: z.number().int().min(60).max(86400).default(3600), // 1小时默认
  filters: z.record(z.any()).optional(),
})

// POST /api/v1/auth/guest-token
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const result = CreateGuestTokenSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    )
  }

  const { dashboardId, expiresIn, filters } = result.data

  // 验证大屏归属
  const dashboard = await prisma.dashboard.findFirst({
    where: {
      id: dashboardId,
      project: { tenantId: session.user.tenantId },
    },
  })

  if (!dashboard) {
    return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
  }

  // 创建 Guest Token
  const token = `gt_${nanoid(32)}`
  const expiresAt = new Date(Date.now() + expiresIn * 1000)

  await prisma.guestToken.create({
    data: {
      token,
      dashboardId,
      filters,
      expiresAt,
    },
  })

  return NextResponse.json({
    token,
    expiresAt: expiresAt.toISOString(),
  })
}
```

---

## 6. 嵌入 SDK

### 6.0 现有实现: @thingsvis/embed

> ⚠️ **已实现**: `packages/thingsvis-embed` 已包含 iframe 通信桥接层

**已有功能**:
- `HostBridge`: 宿主平台侧（ThingsPanel）的通信类
- `EditorBridge`: 编辑器侧的通信类
- `DataConverter`: 数据格式转换工具
- 完整的 TypeScript 类型定义
- Vue 适配器

**通信协议** (postMessage):
```typescript
// Host → Editor
type HostToEditorMessage = 
  | InitEditorMessage      // 初始化编辑器
  | GetDataMessage         // 请求当前数据
  | SetDataSourceOptionsMessage  // 设置数据源选项
  | SetThemeMessage        // 设置主题
  | TriggerSaveMessage     // 触发保存
  | ResetEditorMessage     // 重置编辑器

// Editor → Host
type EditorToHostMessage = 
  | EditorReadyMessage     // 编辑器就绪
  | DataChangedMessage     // 数据变更通知
  | SaveRequestMessage     // 保存请求
  | DataResponseMessage    // 数据响应
  | EditorErrorMessage     // 错误消息
  | RequestDataSourcesMessage  // 请求数据源列表
```

### 6.1 新增: @thingsvis/embed-sdk (API Client)

在已有通信桥接层基础上，新增 REST API 客户端用于后端交互：

```typescript
// packages/thingsvis-embed-sdk/src/index.ts

export { ThingsVisClient } from './client'
export { ThingsVisAuth } from './auth'
export type { ClientConfig, AuthConfig, Dashboard, Project } from './types'

// 复用 @thingsvis/embed 的类型
export type { 
  ThingsVisWidgetData, 
  DataSourceBinding,
  ThingModelBinding 
} from '@thingsvis/embed'
```

```typescript
// packages/thingsvis-embed-sdk/src/types.ts

export interface ClientConfig {
  /** 后端 API 地址 */
  apiUrl: string
  /** 认证配置 */
  auth: AuthConfig
  /** 请求超时 (ms) */
  timeout?: number
}

export type AuthConfig =
  | { type: 'guest'; token: string }
  | { type: 'sso'; getToken: () => Promise<string> }
  | { type: 'apikey'; key: string }
  | { type: 'jwt'; accessToken: string; refreshToken?: string }

export interface Project {
  id: string
  name: string
  description?: string
  thumbnail?: string
  createdAt: string
  updatedAt: string
}

export interface Dashboard {
  id: string
  name: string
  projectId: string
  canvasConfig: CanvasConfig
  nodes: any[]
  dataSources: any[]
  isPublished: boolean
  shareToken?: string
}

export interface CanvasConfig {
  mode: 'fixed' | 'infinite' | 'reflow'
  width: number
  height: number
  background: string
}
```

```typescript
// packages/thingsvis-embed-sdk/src/client.ts

import type { ClientConfig, Dashboard, Project } from './types'

export class ThingsVisClient {
  private config: ClientConfig

  constructor(config: ClientConfig) {
    this.config = {
      timeout: 30000,
      ...config,
    }
  }

  private async getAuthHeader(): Promise<string> {
    const { auth } = this.config
    switch (auth.type) {
      case 'guest':
        return `Bearer ${auth.token}`
      case 'sso':
        return `Bearer ${await auth.getToken()}`
      case 'apikey':
        return `ApiKey ${auth.key}`
      case 'jwt':
        return `Bearer ${auth.accessToken}`
    }
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.apiUrl}${path}`
    const authHeader = await this.getAuthHeader()

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `API Error: ${response.status}`)
    }

    return response.json()
  }

  // ============ Projects ============
  async listProjects(): Promise<{ data: Project[]; meta: any }> {
    return this.request('/api/v1/projects')
  }

  async getProject(id: string): Promise<Project> {
    return this.request(`/api/v1/projects/${id}`)
  }

  // ============ Dashboards ============
  async listDashboards(projectId?: string): Promise<{ data: Dashboard[]; meta: any }> {
    const query = projectId ? `?projectId=${projectId}` : ''
    return this.request(`/api/v1/dashboards${query}`)
  }

  async getDashboard(id: string): Promise<Dashboard> {
    return this.request(`/api/v1/dashboards/${id}`)
  }

  async saveDashboard(id: string, data: Partial<Dashboard>): Promise<Dashboard> {
    return this.request(`/api/v1/dashboards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async publishDashboard(id: string): Promise<Dashboard> {
    return this.request(`/api/v1/dashboards/${id}/publish`, {
      method: 'POST',
    })
  }

  async shareDashboard(id: string, options?: { password?: string; expiresIn?: number }): Promise<{ shareUrl: string; shareToken: string }> {
    return this.request(`/api/v1/dashboards/${id}/share`, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    })
  }

  // ============ Public Access ============
  async getPublicDashboard(shareToken: string, password?: string): Promise<Dashboard> {
    return this.request(`/api/v1/public/dashboard/${shareToken}`, {
      headers: password ? { 'X-Share-Password': password } : {},
    })
  }
}
```

### 6.2 完整集成示例 (ThingsPanel)

```typescript
// ThingsPanel 中完整集成

import { HostBridge } from '@thingsvis/embed'  // 已有: iframe 通信
import { ThingsVisClient } from '@thingsvis/embed-sdk'  // 新增: API 调用

// 1. 初始化 API Client
const client = new ThingsVisClient({
  apiUrl: 'https://thingsvis.example.com',
  auth: {
    type: 'sso',
    getToken: async () => {
      const res = await fetch('/api/thingsvis/exchange-token')
      const { accessToken } = await res.json()
      return accessToken
    },
  },
})

// 2. 加载大屏列表
const { data: dashboards } = await client.listDashboards()

// 3. 嵌入编辑器 iframe
const iframe = document.getElementById('editor-iframe') as HTMLIFrameElement
const bridge = new HostBridge({
  editorOrigin: 'https://thingsvis.example.com',
})

bridge.attach(iframe, {
  onReady: () => {
    // 编辑器就绪，发送初始化数据
    bridge.send({
      type: 'init',
      payload: {
        mode: 'edit',
        data: dashboards[0],
        thingModelOptions: deviceFields,
        theme: 'dark',
      },
    })
  },
  onSaveRequest: async (data) => {
    // 通过 API Client 保存
    await client.saveDashboard(data.widgetId, {
      nodes: data.config.nodes,
      canvasConfig: data.config.canvas,
    })
    bridge.send({ type: 'saveSuccess' })
  },
})

// 4. 发布和分享
const published = await client.publishDashboard(dashboards[0].id)
const { shareUrl } = await client.shareDashboard(dashboards[0].id, {
  expiresIn: 86400,  // 24小时
})
```

---

## 7. Docker 部署

### 7.1 Dockerfile

```dockerfile
# packages/thingsvis-server/Dockerfile

# ============================================================================
# Stage 1: Dependencies
# ============================================================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# ============================================================================
# Stage 2: Builder
# ============================================================================
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 构建 Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ============================================================================
# Stage 3: Runner
# ============================================================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 启动前运行迁移
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
```

### 7.2 Docker Compose (SQLite 轻量版)

```yaml
# packages/thingsvis-server/docker-compose.sqlite.yml
# 轻量部署版本 - 无需 PostgreSQL 和 Redis

version: '3.8'

services:
  thingsvis-server:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: thingsvis-server
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: file:/data/thingsvis.db
      JWT_SECRET: ${JWT_SECRET}
      NEXTAUTH_URL: ${NEXTAUTH_URL:-http://localhost:3000}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
    volumes:
      - thingsvis_data:/data
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  thingsvis_data:
```

### 7.3 Docker Compose (PostgreSQL 生产版)

```yaml
# packages/thingsvis-server/docker-compose.yml

version: '3.8'

services:
  # ThingsVis 后端服务
  thingsvis-server:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: thingsvis-server
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://thingsvis:${DB_PASSWORD}@postgres:5432/thingsvis
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      NEXTAUTH_URL: ${NEXTAUTH_URL:-http://localhost:3000}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      # OAuth (可选)
      GITHUB_ID: ${GITHUB_ID:-}
      GITHUB_SECRET: ${GITHUB_SECRET:-}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - thingsvis-network
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # PostgreSQL 数据库
  postgres:
    image: postgres:16-alpine
    container_name: thingsvis-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: thingsvis
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: thingsvis
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - thingsvis-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U thingsvis"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis 缓存
  redis:
    image: redis:7-alpine
    container_name: thingsvis-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - thingsvis-network

  # (可选) 监控 - Prometheus
  prometheus:
    image: prom/prometheus:latest
    container_name: thingsvis-prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    networks:
      - thingsvis-network
    profiles:
      - monitoring

  # (可选) 监控 - Grafana
  grafana:
    image: grafana/grafana:latest
    container_name: thingsvis-grafana
    restart: unless-stopped
    ports:
      - "3001:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD:-admin}
    volumes:
      - grafana_data:/var/lib/grafana
    networks:
      - thingsvis-network
    profiles:
      - monitoring

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:

networks:
  thingsvis-network:
    driver: bridge
```

### 7.4 环境变量示例

```bash
# packages/thingsvis-server/.env.example

# ======== SQLite 模式 (开发/小规模) ========
DATABASE_URL="file:./prisma/dev.db"

# ======== PostgreSQL 模式 (生产) ========
# DATABASE_URL="postgres://thingsvis:password@localhost:5432/thingsvis"
# DB_PASSWORD="your-secure-password"

# ======== Turso 模式 (Serverless) ========
# DATABASE_URL="libsql://your-db.turso.io"
# TURSO_AUTH_TOKEN="your-turso-token"

# Redis (可选 - 仅生产环境需要)
# REDIS_URL="redis://localhost:6379"

# 认证
JWT_SECRET="your-jwt-secret-at-least-32-characters"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# OAuth (可选)
GITHUB_ID=""
GITHUB_SECRET=""

# 监控
GRAFANA_PASSWORD="admin"
```

### 7.5 部署命令

```bash
# ======== SQLite 轻量部署 (推荐 MVP) ========
docker compose -f docker-compose.sqlite.yml up -d

# ======== PostgreSQL 生产部署 ========
docker compose up -d

# ======== 生产环境 (带监控) ========
docker compose --profile monitoring up -d

# 查看日志
docker compose logs -f thingsvis-server

# 运行数据库迁移
docker compose exec thingsvis-server npx prisma migrate deploy

# 创建管理员用户
docker compose exec thingsvis-server npx ts-node scripts/create-admin.ts
```

---

## 8. 实施计划

### 8.1 Phase 1: 基础架构 (2周)

| 任务 | 描述 | 优先级 |
|------|------|--------|
| T001 | 创建 `packages/thingsvis-server` 包 | P0 |
| T002 | 配置 Next.js 15 + TypeScript | P0 |
| T003 | 配置 Prisma + PostgreSQL | P0 |
| T004 | 实现数据库 Schema | P0 |
| T005 | 配置 Docker + docker-compose | P0 |
| T006 | 健康检查端点 `/api/v1/health` | P0 |

### 8.2 Phase 2: 认证系统 (2周)

| 任务 | 描述 | 优先级 |
|------|------|--------|
| T007 | 配置 NextAuth.js | P0 |
| T008 | 邮箱密码登录 | P0 |
| T009 | JWT Token 管理 | P0 |
| T010 | SSO Token 交换 API | P0 |
| T011 | Guest Token API | P1 |
| T012 | API Key 管理 | P1 |

### 8.3 Phase 3: 核心 API (3周)

| 任务 | 描述 | 优先级 |
|------|------|--------|
| T013 | Projects CRUD API | P0 |
| T014 | Dashboards CRUD API | P0 |
| T015 | Dashboard 发布/分享 API | P0 |
| T016 | Dashboard 版本历史 API | P1 |
| T017 | 公开访问 API | P0 |
| T018 | Components 注册 API | P1 |
| T019 | 审计日志记录 | P2 |

### 8.4 Phase 4: 嵌入 SDK (2周)

| 任务 | 描述 | 优先级 |
|------|------|--------|
| T020 | 创建 `packages/thingsvis-embed-sdk` | P0 |
| T021 | API Client 实现 | P0 |
| T022 | 预览嵌入模式 | P0 |
| T023 | 编辑器嵌入模式 | P0 |
| T024 | 设备上下文绑定 | P0 |
| T025 | 消息通信 (postMessage) | P0 |

### 8.5 Phase 5: 数据代理 & 完善 (1周)

| 任务 | 描述 | 优先级 |
|------|------|--------|
| T026 | REST 代理 API | P1 |
| T027 | WebSocket 代理 | P2 |
| T028 | Prometheus 指标 | P2 |
| T029 | Swagger 文档 | P1 |
| T030 | E2E 测试 | P1 |

---

## 9. 附录

### 9.1 API 响应格式

```typescript
// 成功响应
{
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}

// 错误响应
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "fieldErrors": {
      "name": ["Name is required"]
    }
  }
}
```

### 9.2 常用脚本

```json
// packages/thingsvis-server/package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio",
    "docker:build": "docker build -t thingsvis/server .",
    "docker:up": "docker compose up -d",
    "docker:down": "docker compose down"
  }
}
```

### 9.3 相关文档

- [Next.js App Router](https://nextjs.org/docs/app)
- [Prisma 文档](https://www.prisma.io/docs)
- [NextAuth.js v5](https://authjs.dev/)
- [specs/011-editor-service-modes](../../specs/011-editor-service-modes/spec.md) - 嵌入模式规范

---

## 10. 下一步

1. **确认**: 请确认此设计方案是否符合预期
2. **细化**: 如需针对某个模块展开，请告知
3. **开始**: 确认后可开始创建 `packages/thingsvis-server` 包
