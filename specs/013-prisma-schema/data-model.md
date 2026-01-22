# Data Model: Prisma Schema Definition

**Feature**: 013-prisma-schema  
**Date**: January 22, 2026  
**Source**: [spec.md](spec.md) Key Entities section

## Entity Relationship Diagram

```
┌─────────────────┐
│     Tenant      │
│─────────────────│
│ id (PK)         │
│ name            │
│ slug (UNIQUE)   │
│ plan            │
│ settings (JSON) │
│ createdAt       │
│ updatedAt       │
└────────┬────────┘
         │
         │ 1:N
         ├────────────────────────┐
         │                        │
         ▼                        ▼
┌─────────────────┐      ┌─────────────────┐
│      User       │      │     Project     │
│─────────────────│      │─────────────────│
│ id (PK)         │      │ id (PK)         │
│ email (UNIQUE)  │      │ name            │
│ name            │      │ description     │
│ passwordHash    │      │ thumbnail       │
│ avatar          │      │ tenantId (FK)   │◄──┘
│ role            │      │ createdById(FK) │────► User
│ ssoProvider     │      │ createdAt       │
│ ssoSubject      │      │ updatedAt       │
│ tenantId (FK)   │◄─────┴─────────────────┘
│ createdAt       │               │
│ updatedAt       │               │ 1:N
│ lastLoginAt     │               ▼
└─────────────────┘      ┌─────────────────┐
         │               │    Dashboard    │
         │               │─────────────────│
         │               │ id (PK)         │
         │               │ name            │
         │               │ version         │
         │               │ canvasConfig    │ (JSON)
         │               │ nodes           │ (JSON)
         │               │ dataSources     │ (JSON)
         │               │ isPublished     │
         │               │ publishedAt     │
         │               │ shareToken      │ (UNIQUE)
         │               │ shareConfig     │ (JSON)
         │               │ projectId (FK)  │◄──┘
         │               │ createdById(FK) │────► User
         │               │ createdAt       │
         │               │ updatedAt       │
         └───────────────┴─────────┬───────┘
                                   │
                                   │ 1:N
                                   ▼
                         ┌─────────────────────┐
                         │  DashboardVersion   │
                         │─────────────────────│
                         │ id (PK)             │
                         │ version             │
                         │ canvasConfig (JSON) │
                         │ nodes (JSON)        │
                         │ dataSources (JSON)  │
                         │ dashboardId (FK)    │
                         │ createdAt           │
                         │                     │
                         │ UNIQUE(dashboardId, │
                         │        version)     │
                         └─────────────────────┘
```

## Entity Definitions

### Tenant

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid() | Unique identifier |
| name | String | Required | Display name of the organization |
| slug | String | Unique, Required | URL-safe identifier for the tenant |
| plan | String | Default: "FREE" | Subscription plan (FREE, PRO, ENTERPRISE) |
| settings | String | Default: "{}" | JSON string for custom tenant settings |
| createdAt | DateTime | Default: now() | Creation timestamp |
| updatedAt | DateTime | Auto-update | Last modification timestamp |

**Relationships**:
- Has many Users (cascade delete)
- Has many Projects (cascade delete)

**Table Name**: `tenants`

---

### User

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid() | Unique identifier |
| email | String | Unique, Required | Email address (login identifier) |
| name | String | Optional | Display name |
| passwordHash | String | Optional | Bcrypt hashed password |
| avatar | String | Optional | URL to avatar image |
| role | String | Default: "VIEWER" | Role within tenant (OWNER, ADMIN, EDITOR, VIEWER) |
| ssoProvider | String | Optional | SSO provider name (e.g., "thingspanel") |
| ssoSubject | String | Optional | SSO subject/user ID |
| tenantId | String | FK → Tenant.id | Owning tenant |
| createdAt | DateTime | Default: now() | Creation timestamp |
| updatedAt | DateTime | Auto-update | Last modification timestamp |
| lastLoginAt | DateTime | Optional | Last login timestamp |

**Relationships**:
- Belongs to one Tenant
- Has many Projects (as creator, no cascade)
- Has many Dashboards (as creator, no cascade)

**Constraints**:
- Unique: `[ssoProvider, ssoSubject]` (composite)

**Table Name**: `users`

---

### Project

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid() | Unique identifier |
| name | String | Required | Project name |
| description | String | Optional | Project description |
| thumbnail | String | Optional | URL to thumbnail image |
| tenantId | String | FK → Tenant.id, Indexed | Owning tenant |
| createdById | String | FK → User.id | Creator user |
| createdAt | DateTime | Default: now() | Creation timestamp |
| updatedAt | DateTime | Auto-update | Last modification timestamp |

**Relationships**:
- Belongs to one Tenant (cascade delete from Tenant)
- Belongs to one User (creator)
- Has many Dashboards (cascade delete)

**Indexes**:
- `tenantId` - for tenant-scoped queries

**Table Name**: `projects`

---

### Dashboard

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid() | Unique identifier |
| name | String | Required | Dashboard name |
| version | Int | Default: 1 | Current version number |
| canvasConfig | String | Default: "{}" | JSON: canvas mode, dimensions, background |
| nodes | String | Default: "[]" | JSON: array of NodeSchema objects |
| dataSources | String | Default: "[]" | JSON: array of data source configs |
| isPublished | Boolean | Default: false | Whether dashboard is published |
| publishedAt | DateTime | Optional | When dashboard was published |
| shareToken | String | Unique, Optional | Token for public sharing |
| shareConfig | String | Optional | JSON: sharing options (password, expiry) |
| projectId | String | FK → Project.id, Indexed | Owning project |
| createdById | String | FK → User.id | Creator user |
| createdAt | DateTime | Default: now() | Creation timestamp |
| updatedAt | DateTime | Auto-update | Last modification timestamp |

**Relationships**:
- Belongs to one Project (cascade delete from Project)
- Belongs to one User (creator)
- Has many DashboardVersions (cascade delete)

**Indexes**:
- `projectId` - for project-scoped queries
- `shareToken` - for public access lookups

**Table Name**: `dashboards`

---

### DashboardVersion

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid() | Unique identifier |
| version | Int | Required | Version number |
| canvasConfig | String | Required | JSON: snapshot of canvas config |
| nodes | String | Required | JSON: snapshot of nodes |
| dataSources | String | Required | JSON: snapshot of data sources |
| dashboardId | String | FK → Dashboard.id | Parent dashboard |
| createdAt | DateTime | Default: now() | Version creation timestamp |

**Relationships**:
- Belongs to one Dashboard (cascade delete from Dashboard)

**Constraints**:
- Unique: `[dashboardId, version]` (composite)

**Table Name**: `dashboard_versions`

## JSON Field Schemas

### canvasConfig

```typescript
interface CanvasConfig {
  mode: 'fixed' | 'infinite' | 'reflow';
  width: number;   // pixels, e.g., 1920
  height: number;  // pixels, e.g., 1080
  background: string; // CSS color, e.g., '#1a1a2e'
}
```

### nodes

```typescript
// Array of NodeSchema from @thingsvis/schema
type Nodes = NodeSchema[];
```

### dataSources

```typescript
interface DataSourceConfig {
  id: string;
  type: string;        // e.g., 'http', 'mqtt', 'static'
  config: Record<string, unknown>;
}

type DataSources = DataSourceConfig[];
```

### shareConfig

```typescript
interface ShareConfig {
  password?: string;     // Optional password protection
  expiresAt?: string;    // ISO date string, optional expiry
}
```

### settings (Tenant)

```typescript
interface TenantSettings {
  // Extensible JSON object for tenant preferences
  [key: string]: unknown;
}
```

## Validation Rules (Application Layer)

| Field | Validation |
|-------|------------|
| Tenant.plan | Must be one of: FREE, PRO, ENTERPRISE |
| User.role | Must be one of: OWNER, ADMIN, EDITOR, VIEWER |
| User.email | Valid email format |
| User.passwordHash | Min 8 chars before hashing |
| Dashboard.canvasConfig | Must be valid JSON matching CanvasConfig |
| Dashboard.nodes | Must be valid JSON array |
| Dashboard.dataSources | Must be valid JSON array |
