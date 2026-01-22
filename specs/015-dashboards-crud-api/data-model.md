# Data Model: Dashboards CRUD API

**Feature**: 015-dashboards-crud-api  
**Date**: 2026-01-22

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Tenant    │──1:N──│   Project   │──1:N──│  Dashboard  │
└─────────────┘       └─────────────┘       └─────────────┘
                             │                     │
                             │                     │ 1:N
                             │                     ▼
                      ┌──────┴──────┐       ┌─────────────────┐
                      │    User     │       │ DashboardVersion│
                      └─────────────┘       └─────────────────┘
                             │
                             └──────creates─────────┘
```

## Entity Definitions

### Dashboard

Primary entity for storing visualization configurations.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid | Unique identifier |
| name | String | Required, 1-100 chars | Human-readable name |
| version | Int | Default: 1 | Auto-increment on update |
| canvasConfig | String (JSON) | Default: '{}' | Canvas settings |
| nodes | String (JSON) | Default: '[]' | Widget/component array |
| dataSources | String (JSON) | Default: '[]' | Data binding configs |
| isPublished | Boolean | Default: false | Publication status |
| publishedAt | DateTime | Nullable | When published |
| shareToken | String | Unique, nullable | Public sharing token |
| shareConfig | String (JSON) | Nullable | Share settings |
| projectId | String | FK → Project, Required | Parent project |
| createdById | String | FK → User, Required | Creator |
| createdAt | DateTime | Auto | Creation timestamp |
| updatedAt | DateTime | Auto | Last modification |

**Indexes**:
- `projectId` - Fast lookup by project
- `shareToken` - Fast lookup for public access

**Relationships**:
- Belongs to one Project (cascade delete)
- Belongs to one User (creator)
- Has many DashboardVersion (cascade delete)

### DashboardVersion

Historical snapshots for version control.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid | Unique identifier |
| version | Int | Required | Version number at time of save |
| canvasConfig | String (JSON) | Required | Canvas settings snapshot |
| nodes | String (JSON) | Required | Nodes snapshot |
| dataSources | String (JSON) | Required | Data sources snapshot |
| dashboardId | String | FK → Dashboard, Required | Parent dashboard |
| createdAt | DateTime | Auto | When version was created |

**Unique Constraint**: `(dashboardId, version)` - One version per number per dashboard

**Relationships**:
- Belongs to one Dashboard (cascade delete)

## JSON Field Schemas

### CanvasConfig

```typescript
interface CanvasConfig {
  mode: 'fixed' | 'infinite' | 'reflow'
  width: number   // pixels, positive integer
  height: number  // pixels, positive integer
  background: string // CSS color value or image URL
}
```

**Default Value**:
```json
{
  "mode": "fixed",
  "width": 1920,
  "height": 1080,
  "background": "#1a1a2e"
}
```

### Nodes (NodeSchema[])

Array of node objects as defined in `@thingsvis/schema`. The server treats this as opaque JSON - validation happens at the client/schema layer.

```typescript
// Simplified structure (actual schema in @thingsvis/schema)
interface NodeSchema {
  id: string
  type: string
  position: { x: number, y: number }
  size: { width: number, height: number }
  props: Record<string, unknown>
  bindings?: Record<string, unknown>
}
```

### DataSources (DataSourceConfig[])

Array of data source configurations.

```typescript
interface DataSourceConfig {
  id: string
  name: string
  type: 'static' | 'rest' | 'websocket' | 'mqtt'
  config: Record<string, unknown>
  refreshInterval?: number
}
```

## State Transitions

### Dashboard Lifecycle

```
                    ┌──────────────┐
                    │   Created    │
                    │ (draft mode) │
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │  Update  │    │ Publish  │    │  Delete  │
    │ (saves   │    │ (sets    │    │ (cascade │
    │ version) │    │ flag)    │    │ removes) │
    └──────────┘    └──────────┘    └──────────┘
```

### Version History Flow

```
Dashboard.update() triggered
        │
        ▼
┌─────────────────────────────┐
│ 1. Create DashboardVersion  │
│    with current state       │
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│ 2. Update Dashboard         │
│    - Increment version      │
│    - Apply new values       │
│    - Update updatedAt       │
└─────────────────────────────┘
```

## Validation Rules

| Entity | Field | Rule |
|--------|-------|------|
| Dashboard | name | Required, 1-100 characters |
| Dashboard | projectId | Must be valid cuid, project must exist |
| Dashboard | canvasConfig.mode | Must be 'fixed', 'infinite', or 'reflow' |
| Dashboard | canvasConfig.width | Positive integer |
| Dashboard | canvasConfig.height | Positive integer |
| Dashboard | nodes | Must be valid JSON array |
| Dashboard | dataSources | Must be valid JSON array |

## Database Schema (Prisma)

```prisma
model Dashboard {
  id      String @id @default(cuid())
  name    String
  version Int    @default(1)

  canvasConfig String @default("{}")
  nodes        String @default("[]")
  dataSources  String @default("[]")

  isPublished Boolean   @default(false)
  publishedAt DateTime?
  shareToken  String?   @unique
  shareConfig String?

  projectId String
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  createdById String
  createdBy   User   @relation(fields: [createdById], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  versions DashboardVersion[]

  @@index([projectId])
  @@index([shareToken])
  @@map("dashboards")
}

model DashboardVersion {
  id           String @id @default(cuid())
  version      Int
  canvasConfig String
  nodes        String
  dataSources  String

  dashboardId String
  dashboard   Dashboard @relation(fields: [dashboardId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@unique([dashboardId, version])
  @@map("dashboard_versions")
}
```
