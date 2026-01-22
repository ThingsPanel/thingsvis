# Data Model: Projects CRUD API

**Feature**: 014-projects-crud-api  
**Date**: 2026-01-22

## Entities

### Project (existing in Prisma schema)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid() | Unique identifier |
| name | String | required, max 255 | Display name |
| description | String? | optional, max 2000 | Detailed description |
| thumbnail | String? | optional | Preview image URL |
| tenantId | String | FK→Tenant, required | Owner tenant |
| createdById | String | FK→User, required | Creator user |
| createdAt | DateTime | auto | Creation timestamp |
| updatedAt | DateTime | auto | Last update timestamp |

### Relationships

```
Tenant (1) ←──── (N) Project
User (1) ←──── (N) Project (createdBy)
Project (1) ←──── (N) Dashboard (cascade delete)
```

### Prisma Schema (existing)

```prisma
model Project {
  id          String  @id @default(cuid())
  name        String
  description String?
  thumbnail   String?

  tenantId String
  tenant   Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  createdById String
  createdBy   User   @relation(fields: [createdById], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  dashboards Dashboard[]

  @@index([tenantId])
  @@map("projects")
}
```

## Validation Rules

### CreateProjectSchema

```typescript
{
  name: string       // required, min 1, max 255 chars
  description?: string  // optional, max 2000 chars
}
```

### UpdateProjectSchema

```typescript
{
  name?: string       // optional, min 1, max 255 chars (if provided)
  description?: string  // optional, max 2000 chars
}
```

## State Transitions

Projects have no explicit state machine. Lifecycle:

1. **Created**: POST creates with `createdAt`/`updatedAt` timestamps
2. **Updated**: PUT modifies fields, updates `updatedAt`
3. **Deleted**: DELETE removes project and cascades to dashboards

## Indexes

| Index | Fields | Purpose |
|-------|--------|---------|
| Primary | id | Unique lookup |
| tenantId | tenantId | Multi-tenant filtering |

## Data Integrity

- **Tenant isolation**: All queries MUST include `tenantId` filter
- **Cascade delete**: Deleting project automatically deletes all dashboards (Prisma `onDelete: Cascade`)
- **Creator tracking**: `createdById` tracks who created the project
