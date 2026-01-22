# ThingsVis Server P0 实现任务：Spec-Kit 命令合集

> 对标：Grafana / Metabase / Superset 后端架构
> 
> 目标：把后端服务 MVP 的 **P0 核心功能** 拆成可独立执行的 Spec-Kit 输入（`/speckit.specify`、`/speckit.plan`），确保 AI 可以"照着做"完成实现。

## 命名与分类口径

- **命名规则**：`P{优先级}-{序号} [Category] 标题`
- **Category 集合**：
  - **[Setup]** 项目初始化、配置、依赖
  - **[Database]** 数据库 Schema、迁移、Seed
  - **[Auth]** 认证授权、JWT、SSO
  - **[API]** REST API 端点实现
  - **[Deploy]** Docker、部署配置

## 分类索引

- [Setup]：P0-1
- [Database]：P0-2
- [Auth]：P0-3、P0-4
- [API]：P0-5、P0-6、P0-7、P0-8
- [Deploy]：P0-9

---

## P0-1 [Setup] 创建 thingsvis-server 包

### /speckit.specify

```text
Feature: Initialize thingsvis-server Package

Priority: P0 (Foundation)

Problem Statement:
ThingsVis 目前是纯前端项目，缺少后端服务。需要创建一个新的 Next.js 包作为后端服务，支持 REST API、数据库持久化和用户认证。

User Stories:
1) As a developer, I can run `pnpm dev` in thingsvis-server to start the backend.
2) As a developer, the server package integrates with the monorepo build system (turbo).
3) As a developer, TypeScript strict mode is enabled with proper path aliases.

Acceptance Criteria:
- AC1: packages/thingsvis-server 存在且可独立启动
- AC2: Next.js 15 App Router 配置正确
- AC3: Prisma 已配置且可连接 SQLite
- AC4: 包在 pnpm-workspace.yaml 中正确注册
- AC5: turbo.json 包含 server 的 build/dev 任务

Technical Constraints:
- Node.js 20 LTS
- Next.js 15 (App Router)
- Prisma ORM
- SQLite (开发) / PostgreSQL (生产)
- TypeScript 5.x strict mode

Files to Create:
- packages/thingsvis-server/package.json
- packages/thingsvis-server/tsconfig.json
- packages/thingsvis-server/next.config.js
- packages/thingsvis-server/src/app/layout.tsx
- packages/thingsvis-server/src/app/page.tsx
- packages/thingsvis-server/prisma/schema.prisma
```

### /speckit.plan

```text
Technical Implementation Plan: Initialize Next.js Server Package

Step 0: Verify monorepo structure
- Confirm pnpm-workspace.yaml includes packages/*
- Confirm turbo.json pipeline structure

Step 1: Create package directory and package.json
- Create packages/thingsvis-server/package.json:

{
  "name": "@thingsvis/server",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@prisma/client": "^5.22.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "prisma": "^5.22.0",
    "typescript": "^5.6.0"
  }
}

Step 2: Create tsconfig.json
- Extend from root tsconfig if available, or create standalone:

{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}

Step 3: Create next.config.js
- Enable standalone output for Docker:

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = nextConfig

Step 4: Create minimal App Router structure
- src/app/layout.tsx:
  - Basic RootLayout with html/body
- src/app/page.tsx:
  - Simple "ThingsVis Server" text

Step 5: Initialize Prisma
- Create prisma/schema.prisma with SQLite datasource
- Run: cd packages/thingsvis-server && npx prisma init --datasource-provider sqlite

Step 6: Update turbo.json
- Add to pipeline if not present:
  - "build": { "dependsOn": ["^build"] }
  - Ensure db:generate runs before build

Step 7: Install dependencies
- Run: cd packages/thingsvis-server && pnpm install

Step 8: Verify
- Run: pnpm dev
- Open http://localhost:3001 -> shows page
- Run: pnpm db:generate -> no errors

Deliverables:
- packages/thingsvis-server/ with working Next.js app
- Prisma configured for SQLite
```

---

## P0-2 [Database] 实现 Prisma Schema

### /speckit.specify

```text
Feature: Define Database Schema with Prisma

Priority: P0 (Data foundation)

Problem Statement:
需要定义核心数据模型以支持多租户、项目管理、大屏存储。Schema 需支持 SQLite (开发) 和 PostgreSQL (生产) 双模式。

User Stories:
1) As a developer, I can define tenants, users, projects, dashboards in Prisma.
2) As a developer, I can run migrations to create/update database.
3) As a developer, schema supports JSONB-like storage for canvas/nodes data.

Acceptance Criteria:
- AC1: Tenant, User, Project, Dashboard 模型已定义
- AC2: 关系和索引正确配置
- AC3: `pnpm db:push` 成功创建 SQLite 数据库
- AC4: `pnpm db:studio` 可以查看数据

Data Models Required:
- Tenant: 租户（多租户隔离）
- User: 用户（属于租户）
- Project: 项目（属于租户）
- Dashboard: 大屏（属于项目）
- DashboardVersion: 版本历史

Edge Cases:
- SQLite 不支持 enum，需用 String 替代
- SQLite 不支持 JSONB，使用普通 JSON (String)

Files Involved:
- packages/thingsvis-server/prisma/schema.prisma
```

### /speckit.plan

```text
Technical Implementation Plan: Prisma Schema Definition

Step 0: Understand SQLite limitations
- No native enum -> use String with validation in application
- No JSONB -> use String and serialize/deserialize JSON
- No array types -> use JSON string

Step 1: Define datasource and generator
- prisma/schema.prisma:

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

Step 2: Define Tenant model

model Tenant {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  plan      String   @default("FREE") // FREE, PRO, ENTERPRISE
  settings  String   @default("{}")   // JSON string
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users     User[]
  projects  Project[]

  @@map("tenants")
}

Step 3: Define User model

model User {
  id           String    @id @default(cuid())
  email        String    @unique
  name         String?
  passwordHash String?
  avatar       String?
  role         String    @default("VIEWER") // OWNER, ADMIN, EDITOR, VIEWER
  
  ssoProvider  String?
  ssoSubject   String?
  
  tenantId     String
  tenant       Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  lastLoginAt  DateTime?

  projects     Project[]
  dashboards   Dashboard[]

  @@unique([ssoProvider, ssoSubject])
  @@map("users")
}

Step 4: Define Project model

model Project {
  id          String   @id @default(cuid())
  name        String
  description String?
  thumbnail   String?
  
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

Step 5: Define Dashboard model

model Dashboard {
  id           String   @id @default(cuid())
  name         String
  version      Int      @default(1)
  
  canvasConfig String   @default("{}")  // JSON: { mode, width, height, background }
  nodes        String   @default("[]")  // JSON: NodeSchema[]
  dataSources  String   @default("[]")  // JSON: DataSource[]
  
  isPublished  Boolean  @default(false)
  publishedAt  DateTime?
  shareToken   String?  @unique
  shareConfig  String?  // JSON: { password?, expiresAt? }
  
  projectId    String
  project      Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  createdById  String
  createdBy    User     @relation(fields: [createdById], references: [id])
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  versions     DashboardVersion[]

  @@index([projectId])
  @@index([shareToken])
  @@map("dashboards")
}

Step 6: Define DashboardVersion model

model DashboardVersion {
  id           String   @id @default(cuid())
  version      Int
  canvasConfig String
  nodes        String
  dataSources  String
  
  dashboardId  String
  dashboard    Dashboard @relation(fields: [dashboardId], references: [id], onDelete: Cascade)
  
  createdAt    DateTime @default(now())

  @@unique([dashboardId, version])
  @@map("dashboard_versions")
}

Step 7: Create .env file
- packages/thingsvis-server/.env:
  DATABASE_URL="file:./dev.db"

Step 8: Generate and push
- pnpm db:generate
- pnpm db:push

Step 9: Verify with Prisma Studio
- pnpm db:studio
- Confirm all tables created

Deliverables:
- Complete Prisma schema
- Working SQLite database
- Prisma Client generated
```

---

## P0-3 [Auth] 实现 NextAuth.js 基础配置

### /speckit.specify

```text
Feature: Configure NextAuth.js for Authentication

Priority: P0 (Security foundation)

Problem Statement:
需要实现用户认证系统，支持邮箱密码登录和 JWT session。为 ThingsPanel SSO 集成做准备。

User Stories:
1) As a user, I can register with email/password.
2) As a user, I can login and receive a JWT token.
3) As a developer, session includes user id, role, tenantId.

Acceptance Criteria:
- AC1: NextAuth.js v5 (Auth.js) 已配置
- AC2: Credentials provider 支持邮箱密码登录
- AC3: JWT strategy 用于 session
- AC4: Session 包含 id, email, role, tenantId
- AC5: 密码使用 bcrypt hash

Technical Constraints:
- Use NextAuth.js v5 (Auth.js)
- JWT session strategy (not database sessions)
- Prisma adapter for user storage

Files Involved:
- packages/thingsvis-server/src/lib/auth.ts
- packages/thingsvis-server/src/app/api/auth/[...nextauth]/route.ts
- packages/thingsvis-server/src/middleware.ts
```

### /speckit.plan

```text
Technical Implementation Plan: NextAuth.js Setup

Step 0: Install dependencies
- pnpm add next-auth@beta @auth/prisma-adapter bcryptjs
- pnpm add -D @types/bcryptjs

Step 1: Create Prisma client singleton
- Create src/lib/db.ts:

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

Step 2: Create auth configuration
- Create src/lib/auth.ts:

import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from './db'

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { tenant: true },
        })

        if (!user || !user.passwordHash) return null

        const isValid = await compare(
          credentials.password as string,
          user.passwordHash
        )
        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.tenantId = user.tenantId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.tenantId = token.tenantId as string
      }
      return session
    },
  },
})

Step 3: Create API route handler
- Create src/app/api/auth/[...nextauth]/route.ts:

import { handlers } from '@/lib/auth'
export const { GET, POST } = handlers

Step 4: Create middleware for protected routes
- Create src/middleware.ts:

import { auth } from '@/lib/auth'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isApiRoute = req.nextUrl.pathname.startsWith('/api/v1')
  const isAuthRoute = req.nextUrl.pathname.startsWith('/api/auth')
  const isPublicRoute = req.nextUrl.pathname.startsWith('/api/v1/public')
  const isHealthRoute = req.nextUrl.pathname === '/api/v1/health'

  // Allow auth routes and public routes
  if (isAuthRoute || isPublicRoute || isHealthRoute) return

  // Protect API routes
  if (isApiRoute && !isLoggedIn) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
})

export const config = {
  matcher: ['/api/:path*'],
}

Step 5: Extend types for session
- Create src/types/next-auth.d.ts:

import 'next-auth'

declare module 'next-auth' {
  interface User {
    role?: string
    tenantId?: string
  }
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      role: string
      tenantId: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    tenantId: string
  }
}

Step 6: Add environment variables
- Update .env:
  AUTH_SECRET="your-auth-secret-at-least-32-characters"
  AUTH_URL="http://localhost:3001"

Step 7: Verify
- Start server: pnpm dev
- Test: POST /api/auth/signin with credentials

Deliverables:
- Working NextAuth.js configuration
- JWT-based authentication
- Protected API routes
```

---

## P0-4 [Auth] 实现用户注册 API

### /speckit.specify

```text
Feature: User Registration API

Priority: P0 (User onboarding)

Problem Statement:
用户需要能够注册账号。第一个注册的用户自动创建租户并成为 OWNER。

User Stories:
1) As a new user, I can register with email and password.
2) As the first user, a tenant is automatically created for me.
3) As a user, I receive an error if email is already taken.

Acceptance Criteria:
- AC1: POST /api/v1/auth/register 创建用户
- AC2: 密码使用 bcrypt hash (cost 12)
- AC3: 第一个用户创建默认租户，角色为 OWNER
- AC4: 后续用户可指定 tenantId 加入现有租户
- AC5: 返回用户信息（不含 passwordHash）

Edge Cases:
- Duplicate email -> 400 error
- Weak password (< 8 chars) -> 400 error
- Invalid email format -> 400 error

Files Involved:
- packages/thingsvis-server/src/app/api/v1/auth/register/route.ts
- packages/thingsvis-server/src/lib/validators/auth.ts
```

### /speckit.plan

```text
Technical Implementation Plan: Registration API

Step 1: Create Zod validators
- Create src/lib/validators/auth.ts:

import { z } from 'zod'

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1).max(100).optional(),
  tenantId: z.string().cuid().optional(),
})

export type RegisterInput = z.infer<typeof RegisterSchema>

Step 2: Create registration route
- Create src/app/api/v1/auth/register/route.ts:

import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/db'
import { RegisterSchema } from '@/lib/validators/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = RegisterSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { email, password, name, tenantId } = result.data

    // Check duplicate email
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    const passwordHash = await hash(password, 12)

    let finalTenantId = tenantId

    // If no tenantId provided, create a new tenant
    if (!finalTenantId) {
      const tenant = await prisma.tenant.create({
        data: {
          name: `${email.split('@')[0]}'s Workspace`,
          slug: `tenant-${Date.now()}`,
        },
      })
      finalTenantId = tenant.id
    } else {
      // Verify tenant exists
      const tenant = await prisma.tenant.findUnique({
        where: { id: finalTenantId },
      })
      if (!tenant) {
        return NextResponse.json(
          { error: 'Tenant not found' },
          { status: 404 }
        )
      }
    }

    // Determine role: first user in tenant is OWNER
    const existingUsers = await prisma.user.count({
      where: { tenantId: finalTenantId },
    })
    const role = existingUsers === 0 ? 'OWNER' : 'VIEWER'

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role,
        tenantId: finalTenantId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        createdAt: true,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

Step 3: Test registration
- POST /api/v1/auth/register
- Body: { "email": "test@example.com", "password": "password123" }
- Expected: 201 with user object

Step 4: Test login with registered user
- POST /api/auth/callback/credentials
- Body: { "email": "test@example.com", "password": "password123" }

Deliverables:
- Working registration endpoint
- Automatic tenant creation
- Password hashing
```

---

## P0-5 [API] 实现 Projects CRUD API

### /speckit.specify

```text
Feature: Projects CRUD API

Priority: P0 (Core functionality)

Problem Statement:
用户需要能够创建、读取、更新、删除项目。项目是大屏的容器。

User Stories:
1) As a user, I can list my tenant's projects.
2) As a user, I can create a new project.
3) As a user, I can view project details.
4) As a user, I can update project name/description.
5) As a user, I can delete a project (cascades to dashboards).

Acceptance Criteria:
- AC1: GET /api/v1/projects 返回分页项目列表
- AC2: POST /api/v1/projects 创建项目
- AC3: GET /api/v1/projects/:id 返回项目详情
- AC4: PUT /api/v1/projects/:id 更新项目
- AC5: DELETE /api/v1/projects/:id 删除项目
- AC6: 所有操作限制在用户租户范围内

API Response Format:
- List: { data: Project[], meta: { page, limit, total } }
- Single: Project object
- Error: { error: string, code?: string, details?: any }

Files Involved:
- packages/thingsvis-server/src/app/api/v1/projects/route.ts
- packages/thingsvis-server/src/app/api/v1/projects/[id]/route.ts
- packages/thingsvis-server/src/lib/validators/project.ts
```

### /speckit.plan

```text
Technical Implementation Plan: Projects API

Step 1: Create project validators
- Create src/lib/validators/project.ts:

import { z } from 'zod'

export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
})

export const UpdateProjectSchema = CreateProjectSchema.partial()

Step 2: Create helper to get session user
- Create src/lib/auth-helpers.ts:

import { auth } from './auth'

export async function getSessionUser() {
  const session = await auth()
  if (!session?.user) return null
  return session.user
}

Step 3: Create projects list/create route
- Create src/app/api/v1/projects/route.ts:

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth-helpers'
import { CreateProjectSchema } from '@/lib/validators/project'

// GET /api/v1/projects
export async function GET(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  const where = { tenantId: user.tenantId }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { dashboards: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.project.count({ where }),
  ])

  return NextResponse.json({
    data: projects,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}

// POST /api/v1/projects
export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const result = CreateProjectSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    )
  }

  const project = await prisma.project.create({
    data: {
      ...result.data,
      tenantId: user.tenantId,
      createdById: user.id,
    },
  })

  return NextResponse.json(project, { status: 201 })
}

Step 4: Create projects detail route
- Create src/app/api/v1/projects/[id]/route.ts:

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth-helpers'
import { UpdateProjectSchema } from '@/lib/validators/project'

type Params = { params: Promise<{ id: string }> }

// GET /api/v1/projects/:id
export async function GET(request: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const project = await prisma.project.findFirst({
    where: { id, tenantId: user.tenantId },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      dashboards: { select: { id: true, name: true, isPublished: true } },
    },
  })

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  return NextResponse.json(project)
}

// PUT /api/v1/projects/:id
export async function PUT(request: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const result = UpdateProjectSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    )
  }

  const existing = await prisma.project.findFirst({
    where: { id, tenantId: user.tenantId },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const project = await prisma.project.update({
    where: { id },
    data: result.data,
  })

  return NextResponse.json(project)
}

// DELETE /api/v1/projects/:id
export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const existing = await prisma.project.findFirst({
    where: { id, tenantId: user.tenantId },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  await prisma.project.delete({ where: { id } })

  return NextResponse.json({ success: true })
}

Deliverables:
- Complete Projects CRUD API
- Tenant isolation
- Pagination support
```

---

## P0-6 [API] 实现 Dashboards CRUD API

### /speckit.specify

```text
Feature: Dashboards CRUD API

Priority: P0 (Core functionality)

Problem Statement:
用户需要能够创建、读取、更新、删除大屏。大屏包含画布配置、节点数据、数据源配置。

User Stories:
1) As a user, I can list dashboards in a project.
2) As a user, I can create a new dashboard.
3) As a user, I can save dashboard canvas/nodes/dataSources.
4) As a user, I can delete a dashboard.

Acceptance Criteria:
- AC1: GET /api/v1/dashboards?projectId=xxx 返回大屏列表
- AC2: POST /api/v1/dashboards 创建大屏
- AC3: GET /api/v1/dashboards/:id 返回大屏完整数据
- AC4: PUT /api/v1/dashboards/:id 更新大屏（自动保存版本历史）
- AC5: DELETE /api/v1/dashboards/:id 删除大屏
- AC6: canvasConfig/nodes/dataSources 作为 JSON 字符串存储

Data Format:
- canvasConfig: { mode: string, width: number, height: number, background: string }
- nodes: NodeSchema[] (from @thingsvis/schema)
- dataSources: DataSourceConfig[]

Files Involved:
- packages/thingsvis-server/src/app/api/v1/dashboards/route.ts
- packages/thingsvis-server/src/app/api/v1/dashboards/[id]/route.ts
- packages/thingsvis-server/src/lib/validators/dashboard.ts
```

### /speckit.plan

```text
Technical Implementation Plan: Dashboards API

Step 1: Create dashboard validators
- Create src/lib/validators/dashboard.ts:

import { z } from 'zod'

export const CanvasConfigSchema = z.object({
  mode: z.enum(['fixed', 'infinite', 'reflow']).default('fixed'),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  background: z.string().default('#1a1a2e'),
})

export const CreateDashboardSchema = z.object({
  name: z.string().min(1).max(100),
  projectId: z.string().cuid(),
  canvasConfig: CanvasConfigSchema.optional(),
})

export const UpdateDashboardSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  canvasConfig: z.any().optional(),  // JSON object
  nodes: z.any().optional(),          // JSON array
  dataSources: z.any().optional(),    // JSON array
})

Step 2: Create dashboards list/create route
- Create src/app/api/v1/dashboards/route.ts:

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth-helpers'
import { CreateDashboardSchema } from '@/lib/validators/dashboard'

// GET /api/v1/dashboards
export async function GET(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  const where = {
    project: { tenantId: user.tenantId },
    ...(projectId && { projectId }),
  }

  const [dashboards, total] = await Promise.all([
    prisma.dashboard.findMany({
      where,
      select: {
        id: true,
        name: true,
        version: true,
        isPublished: true,
        projectId: true,
        createdAt: true,
        updatedAt: true,
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.dashboard.count({ where }),
  ])

  return NextResponse.json({
    data: dashboards,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}

// POST /api/v1/dashboards
export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
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

  const { projectId, canvasConfig, ...data } = result.data

  // Verify project belongs to user's tenant
  const project = await prisma.project.findFirst({
    where: { id: projectId, tenantId: user.tenantId },
  })

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const dashboard = await prisma.dashboard.create({
    data: {
      ...data,
      canvasConfig: JSON.stringify(canvasConfig || {
        mode: 'fixed',
        width: 1920,
        height: 1080,
        background: '#1a1a2e',
      }),
      projectId,
      createdById: user.id,
    },
  })

  return NextResponse.json({
    ...dashboard,
    canvasConfig: JSON.parse(dashboard.canvasConfig),
    nodes: JSON.parse(dashboard.nodes),
    dataSources: JSON.parse(dashboard.dataSources),
  }, { status: 201 })
}

Step 3: Create dashboard detail route
- Create src/app/api/v1/dashboards/[id]/route.ts:

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth-helpers'
import { UpdateDashboardSchema } from '@/lib/validators/dashboard'

type Params = { params: Promise<{ id: string }> }

// Helper to parse dashboard JSON fields
function parseDashboard(dashboard: any) {
  return {
    ...dashboard,
    canvasConfig: JSON.parse(dashboard.canvasConfig || '{}'),
    nodes: JSON.parse(dashboard.nodes || '[]'),
    dataSources: JSON.parse(dashboard.dataSources || '[]'),
    shareConfig: dashboard.shareConfig ? JSON.parse(dashboard.shareConfig) : null,
  }
}

// GET /api/v1/dashboards/:id
export async function GET(request: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const dashboard = await prisma.dashboard.findFirst({
    where: { id, project: { tenantId: user.tenantId } },
    include: {
      project: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  })

  if (!dashboard) {
    return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
  }

  return NextResponse.json(parseDashboard(dashboard))
}

// PUT /api/v1/dashboards/:id
export async function PUT(request: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const result = UpdateDashboardSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    )
  }

  const existing = await prisma.dashboard.findFirst({
    where: { id, project: { tenantId: user.tenantId } },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
  }

  // Save version history
  await prisma.dashboardVersion.create({
    data: {
      dashboardId: existing.id,
      version: existing.version,
      canvasConfig: existing.canvasConfig,
      nodes: existing.nodes,
      dataSources: existing.dataSources,
    },
  })

  // Prepare update data
  const updateData: any = { version: { increment: 1 } }
  if (result.data.name) updateData.name = result.data.name
  if (result.data.canvasConfig) updateData.canvasConfig = JSON.stringify(result.data.canvasConfig)
  if (result.data.nodes) updateData.nodes = JSON.stringify(result.data.nodes)
  if (result.data.dataSources) updateData.dataSources = JSON.stringify(result.data.dataSources)

  const dashboard = await prisma.dashboard.update({
    where: { id },
    data: updateData,
  })

  return NextResponse.json(parseDashboard(dashboard))
}

// DELETE /api/v1/dashboards/:id
export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const existing = await prisma.dashboard.findFirst({
    where: { id, project: { tenantId: user.tenantId } },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
  }

  await prisma.dashboard.delete({ where: { id } })

  return NextResponse.json({ success: true })
}

Deliverables:
- Complete Dashboards CRUD API
- Automatic version history on update
- JSON serialization for complex fields
```

---

## P0-7 [API] 实现公开访问 API

### /speckit.specify

```text
Feature: Public Dashboard Access API

Priority: P0 (Sharing functionality)

Problem Statement:
用户需要能够分享大屏给未登录用户。通过 shareToken 访问已发布的大屏。

User Stories:
1) As a user, I can publish a dashboard and get a share link.
2) As a visitor, I can view a shared dashboard without logging in.
3) As a user, I can set password protection on shared dashboards.

Acceptance Criteria:
- AC1: POST /api/v1/dashboards/:id/publish 发布大屏
- AC2: POST /api/v1/dashboards/:id/share 生成分享链接
- AC3: GET /api/v1/public/dashboard/:token 获取公开大屏数据
- AC4: 支持密码保护（X-Share-Password header）
- AC5: 支持过期时间

Files Involved:
- packages/thingsvis-server/src/app/api/v1/dashboards/[id]/publish/route.ts
- packages/thingsvis-server/src/app/api/v1/dashboards/[id]/share/route.ts
- packages/thingsvis-server/src/app/api/v1/public/dashboard/[token]/route.ts
```

### /speckit.plan

```text
Technical Implementation Plan: Public Access API

Step 1: Install nanoid for token generation
- pnpm add nanoid

Step 2: Create publish route
- Create src/app/api/v1/dashboards/[id]/publish/route.ts:

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth-helpers'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const dashboard = await prisma.dashboard.findFirst({
    where: { id, project: { tenantId: user.tenantId } },
  })

  if (!dashboard) {
    return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
  }

  const updated = await prisma.dashboard.update({
    where: { id },
    data: {
      isPublished: true,
      publishedAt: new Date(),
    },
  })

  return NextResponse.json({
    id: updated.id,
    isPublished: updated.isPublished,
    publishedAt: updated.publishedAt,
  })
}

Step 3: Create share route
- Create src/app/api/v1/dashboards/[id]/share/route.ts:

import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth-helpers'
import { z } from 'zod'

type Params = { params: Promise<{ id: string }> }

const ShareOptionsSchema = z.object({
  password: z.string().min(4).optional(),
  expiresIn: z.number().int().min(3600).max(2592000).optional(), // 1h to 30d
})

export async function POST(request: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const options = ShareOptionsSchema.parse(body)

  const dashboard = await prisma.dashboard.findFirst({
    where: { id, project: { tenantId: user.tenantId } },
  })

  if (!dashboard) {
    return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
  }

  if (!dashboard.isPublished) {
    return NextResponse.json(
      { error: 'Dashboard must be published before sharing' },
      { status: 400 }
    )
  }

  const shareToken = dashboard.shareToken || `share_${nanoid(16)}`
  const shareConfig: any = {}
  if (options.password) shareConfig.password = options.password
  if (options.expiresIn) {
    shareConfig.expiresAt = new Date(Date.now() + options.expiresIn * 1000).toISOString()
  }

  await prisma.dashboard.update({
    where: { id },
    data: {
      shareToken,
      shareConfig: Object.keys(shareConfig).length > 0 ? JSON.stringify(shareConfig) : null,
    },
  })

  return NextResponse.json({
    shareToken,
    shareUrl: `/preview/${shareToken}`,
  })
}

Step 4: Create public access route
- Create src/app/api/v1/public/dashboard/[token]/route.ts:

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

type Params = { params: Promise<{ token: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const { token } = await params

  const dashboard = await prisma.dashboard.findFirst({
    where: {
      shareToken: token,
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

  // Check share config
  const shareConfig = dashboard.shareConfig ? JSON.parse(dashboard.shareConfig) : null

  if (shareConfig?.expiresAt && new Date(shareConfig.expiresAt) < new Date()) {
    return NextResponse.json({ error: 'Share link expired' }, { status: 410 })
  }

  if (shareConfig?.password) {
    const password = request.headers.get('X-Share-Password')
    if (password !== shareConfig.password) {
      return NextResponse.json(
        { error: 'Password required', requirePassword: true },
        { status: 401 }
      )
    }
  }

  return NextResponse.json({
    id: dashboard.id,
    name: dashboard.name,
    canvasConfig: JSON.parse(dashboard.canvasConfig),
    nodes: JSON.parse(dashboard.nodes),
    dataSources: JSON.parse(dashboard.dataSources),
  })
}

Deliverables:
- Publish endpoint
- Share link generation with optional password/expiry
- Public access endpoint
```

---

## P0-8 [API] 实现健康检查端点

### /speckit.specify

```text
Feature: Health Check API

Priority: P0 (Operations)

Problem Statement:
需要健康检查端点用于 Docker 容器健康检查、负载均衡器探针、监控系统。

User Stories:
1) As an operator, I can check if the server is running.
2) As an operator, I can check database connectivity.
3) As an operator, I get structured health information.

Acceptance Criteria:
- AC1: GET /api/v1/health 返回服务状态
- AC2: 包含数据库连接状态
- AC3: 返回版本信息
- AC4: 健康时返回 200，不健康时返回 503

Files Involved:
- packages/thingsvis-server/src/app/api/v1/health/route.ts
```

### /speckit.plan

```text
Technical Implementation Plan: Health Check API

Step 1: Create health check route
- Create src/app/api/v1/health/route.ts:

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const startTime = Date.now()

  const checks: Record<string, { status: string; latency?: number; error?: string }> = {}

  // Database check
  try {
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    checks.database = {
      status: 'healthy',
      latency: Date.now() - dbStart,
    }
  } catch (error) {
    checks.database = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }

  const isHealthy = Object.values(checks).every((c) => c.status === 'healthy')

  const response = {
    status: isHealthy ? 'healthy' : 'unhealthy',
    version: process.env.npm_package_version || '0.1.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
    responseTime: Date.now() - startTime,
  }

  return NextResponse.json(response, {
    status: isHealthy ? 200 : 503,
  })
}

Step 2: Test health endpoint
- GET /api/v1/health
- Expected: { status: 'healthy', ... }

Deliverables:
- Health check endpoint
- Database connectivity check
- Response time measurement
```

---

## P0-9 [Deploy] 创建 Docker 配置

### /speckit.specify

```text
Feature: Docker Deployment Configuration

Priority: P0 (Deployment)

Problem Statement:
需要 Docker 配置以支持容器化部署。包括 Dockerfile 和 docker-compose 配置。

User Stories:
1) As a developer, I can build a Docker image.
2) As an operator, I can deploy with docker-compose.
3) As an operator, I can use SQLite for simple deployments.

Acceptance Criteria:
- AC1: Dockerfile 使用多阶段构建优化镜像大小
- AC2: docker-compose.yml 配置完整服务栈
- AC3: 支持 SQLite 单容器部署
- AC4: 数据持久化到 volume
- AC5: 健康检查配置正确

Files Involved:
- packages/thingsvis-server/Dockerfile
- packages/thingsvis-server/docker-compose.yml
- packages/thingsvis-server/.dockerignore
```

### /speckit.plan

```text
Technical Implementation Plan: Docker Configuration

Step 1: Create .dockerignore
- Create packages/thingsvis-server/.dockerignore:

node_modules
.next
.git
*.md
.env*.local
prisma/dev.db

Step 2: Create Dockerfile
- Create packages/thingsvis-server/Dockerfile:

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Create data directory for SQLite
RUN mkdir -p /data && chown nextjs:nodejs /data

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/data/thingsvis.db"

CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]

Step 3: Create docker-compose.yml
- Create packages/thingsvis-server/docker-compose.yml:

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
      AUTH_SECRET: ${AUTH_SECRET:-change-me-in-production}
      AUTH_URL: ${AUTH_URL:-http://localhost:3000}
    volumes:
      - thingsvis_data:/data
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  thingsvis_data:

Step 4: Create .env.example
- Create packages/thingsvis-server/.env.example:

# Database (SQLite for development)
DATABASE_URL="file:./prisma/dev.db"

# Auth
AUTH_SECRET="your-auth-secret-change-in-production"
AUTH_URL="http://localhost:3001"

Step 5: Build and test
- docker build -t thingsvis/server .
- docker compose up -d
- curl http://localhost:3000/api/v1/health

Deliverables:
- Multi-stage Dockerfile
- docker-compose.yml for SQLite deployment
- Health check integration
```

---

## 任务依赖图

```
P0-1 [Setup] ─────────────────────────────────────────┐
      │                                               │
      ▼                                               │
P0-2 [Database] ──────────────────────────┐           │
      │                                   │           │
      ▼                                   │           │
P0-3 [Auth] NextAuth ────────────────┐    │           │
      │                              │    │           │
      ▼                              │    │           │
P0-4 [Auth] Register API             │    │           │
      │                              │    │           │
      ├──────────────────────────────┼────┼───────────┤
      ▼                              ▼    ▼           │
P0-5 [API] Projects ──────────────────────────────────┤
      │                                               │
      ▼                                               │
P0-6 [API] Dashboards ────────────────────────────────┤
      │                                               │
      ▼                                               │
P0-7 [API] Public Access ─────────────────────────────┤
      │                                               │
      ├───────────────────────────────────────────────┤
      ▼                                               │
P0-8 [API] Health Check                               │
      │                                               │
      ├───────────────────────────────────────────────┘
      ▼
P0-9 [Deploy] Docker ─────────────────────────────────▶ MVP Complete
```

---

## 执行顺序建议

1. **Day 1**: P0-1 (Setup) + P0-2 (Database)
2. **Day 2**: P0-3 (Auth) + P0-4 (Register)
3. **Day 3**: P0-5 (Projects) + P0-6 (Dashboards)
4. **Day 4**: P0-7 (Public) + P0-8 (Health)
5. **Day 5**: P0-9 (Docker) + 集成测试

---

## 相关文档

- [Phase 7 Backend Design](../saas/phase7-backend-design.md) - 完整设计方案
- [Editor Service Modes Spec](../../specs/011-editor-service-modes/spec.md) - 嵌入模式规范
- [P0 Editor Speckit Commands](./p0-editor-speckit-commands.md) - 前端编辑器修复任务
