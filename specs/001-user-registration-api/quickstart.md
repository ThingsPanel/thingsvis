# Quickstart: User Registration API

**Feature**: 001-user-registration-api  
**Date**: 2026-01-22

## Prerequisites

1. thingsvis-server package is set up and running
2. Database is migrated (`pnpm db:push` or `pnpm db:migrate`)
3. Environment variables configured in `.env`

## Files to Create

### 1. Zod Validators

**Path**: `packages/thingsvis-server/src/lib/validators/auth.ts`

```typescript
import { z } from 'zod'

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email').max(254),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1).max(100).optional(),
  tenantId: z.string().cuid().optional(),
})

export type RegisterInput = z.infer<typeof RegisterSchema>
```

### 2. Registration Route

**Path**: `packages/thingsvis-server/src/app/api/v1/auth/register/route.ts`

```typescript
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
```

## Testing

### Start Server

```bash
cd packages/thingsvis-server
pnpm dev
```

Server runs at http://localhost:3001

### Test Cases

#### 1. Register First User (Creates Tenant + OWNER)

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password123", "name": "Admin"}'
```

**Expected**: 201 with role "OWNER"

#### 2. Register Second User (Joins Tenant + VIEWER)

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123", "tenantId": "<tenantId from first user>"}'
```

**Expected**: 201 with role "VIEWER"

#### 3. Duplicate Email

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password123"}'
```

**Expected**: 400 with "Email already registered"

#### 4. Invalid Email

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "notanemail", "password": "password123"}'
```

**Expected**: 400 with validation error

#### 5. Short Password

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "short"}'
```

**Expected**: 400 with "Password must be at least 8 characters"

#### 6. Invalid Tenant ID

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123", "tenantId": "invalid-tenant"}'
```

**Expected**: 400 (invalid cuid format) or 404 (tenant not found)

## Verification

1. Check Prisma Studio: `pnpm db:studio`
2. Verify user in `users` table
3. Verify tenant in `tenants` table (if auto-created)
4. Verify password is hashed (not plaintext)
5. Verify role assignment is correct
