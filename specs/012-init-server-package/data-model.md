# Data Model: Initialize thingsvis-server Package

## Scope
This feature only initializes the backend package and Prisma configuration. No domain entities are defined here.

## Minimal Prisma Model (Foundation)
To enable Prisma client generation and database initialization during setup, include a minimal model that can be safely replaced in later schema tasks.

### Entity: SystemHealth

| Field | Type | Constraints | Notes |
| --- | --- | --- | --- |
| id | String | `@id @default(cuid())` | Primary identifier |
| createdAt | DateTime | `@default(now())` | Record creation timestamp |

### Relationships
None.

### Validation Rules
- `id` is generated automatically.
- `createdAt` is set automatically.

### State Transitions
None.
