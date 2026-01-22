# Data Model: Public Dashboard Access API

**Feature**: 001-public-dashboard-api  
**Date**: January 22, 2026  
**Status**: Complete

## Entity Overview

This feature uses the **existing Dashboard model** which already contains all required fields for sharing functionality. No schema migration is required.

## Existing Dashboard Model

```prisma
model Dashboard {
  id      String @id @default(cuid())
  name    String
  version Int    @default(1)

  canvasConfig String @default("{}") // JSON: CanvasConfig
  nodes        String @default("[]") // JSON: NodeSchema[]
  dataSources  String @default("[]") // JSON: DataSourceConfig[]

  // === Sharing Fields (used by this feature) ===
  isPublished Boolean   @default(false)  // Publication status
  publishedAt DateTime?                   // When published
  shareToken  String?   @unique           // Unique share token for public URL
  shareConfig String?                     // JSON: ShareConfig

  projectId   String
  project     Project @relation(...)
  createdById String
  createdBy   User    @relation(...)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([shareToken])
}
```

## ShareConfig JSON Structure

The `shareConfig` field stores sharing options as JSON:

```typescript
interface ShareConfig {
  password?: string    // bcrypt-hashed password (never plaintext)
  expiresAt?: string   // ISO 8601 timestamp (UTC)
}
```

### Examples

**No protection:**
```json
null
```

**Password only:**
```json
{
  "password": "$2a$10$..."
}
```

**Expiration only:**
```json
{
  "expiresAt": "2026-02-22T12:00:00.000Z"
}
```

**Both protections:**
```json
{
  "password": "$2a$10$...",
  "expiresAt": "2026-02-22T12:00:00.000Z"
}
```

## Entity State Diagram

```
┌─────────────┐
│    DRAFT    │ (isPublished: false, shareToken: null)
│             │
└──────┬──────┘
       │ POST /publish
       ▼
┌─────────────┐
│  PUBLISHED  │ (isPublished: true, shareToken: null)
│             │
└──────┬──────┘
       │ POST /share
       ▼
┌─────────────┐
│   SHARED    │ (isPublished: true, shareToken: "share_...")
│             │
└─────────────┘
       │
       │ DELETE /publish (unpublish)
       ▼
┌─────────────┐
│    DRAFT    │ (isPublished: false, shareToken: invalidated)
└─────────────┘
```

## Validation Rules

### Publish Endpoint

| Field | Rule |
|-------|------|
| Dashboard ownership | User's tenant must match project's tenant |
| Dashboard existence | Must exist and belong to accessible project |

### Share Endpoint

| Field | Rule |
|-------|------|
| Dashboard | Must be published (`isPublished: true`) |
| password | Optional, minimum 4 characters |
| expiresIn | Optional, 3600 (1h) to 2592000 (30d) seconds |

### Public Access Endpoint

| Field | Rule |
|-------|------|
| token | Must match existing `shareToken` |
| Dashboard | Must be published |
| expiresAt | If set, must be in the future |
| password | If set in config, `X-Share-Password` header must match |

## Relationships

```
User (1) ──owns──▶ (N) Dashboard
Project (1) ──contains──▶ (N) Dashboard
Dashboard (1) ──has──▶ (0..1) ShareToken
```

## Data Flow

### Publish Flow
```
User → POST /dashboards/:id/publish
  → Verify ownership (tenant check)
  → Update: isPublished=true, publishedAt=now()
  → Return: { id, isPublished, publishedAt }
```

### Share Flow
```
User → POST /dashboards/:id/share { password?, expiresIn? }
  → Verify ownership
  → Verify isPublished
  → Generate/reuse shareToken
  → Hash password if provided
  → Calculate expiresAt if provided
  → Update: shareToken, shareConfig
  → Return: { shareToken, shareUrl }
```

### Public Access Flow
```
Visitor → GET /public/dashboard/:token [X-Share-Password header]
  → Find by shareToken + isPublished
  → Check expiration
  → Verify password if configured
  → Return: { id, name, canvasConfig, nodes, dataSources }
```

## Index Strategy

The schema already includes an index on `shareToken`:

```prisma
@@index([shareToken])
```

This ensures O(log n) lookup time for public access queries.
