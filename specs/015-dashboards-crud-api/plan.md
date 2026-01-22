# Implementation Plan: Dashboards CRUD API

**Branch**: `015-dashboards-crud-api` | **Date**: 2026-01-22 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/015-dashboards-crud-api/spec.md`

## Summary

Implement complete CRUD API for Dashboards entity. Dashboards store canvas configuration, nodes (widgets), and data source bindings as JSON strings. The API follows REST conventions under `/api/v1/dashboards` with pagination support, Zod validation, automatic version history on updates, and JSON field parsing in responses. Follows patterns established by 014-projects-crud-api.

## Technical Context

**Language/Version**: TypeScript 5.6 (Next.js 15)  
**Primary Dependencies**: Next.js 15, NextAuth 5 (beta), Prisma 5, Zod 3  
**Storage**: SQLite (dev) / PostgreSQL (prod) via Prisma ORM; JSON fields stored as strings  
**Testing**: Manual API testing (test harness not yet established for server package)  
**Target Platform**: Node.js server (Next.js App Router)  
**Project Type**: Monorepo package (`packages/thingsvis-server`)  
**Performance Goals**: <2s response for dashboard with 100 nodes; <1s for list endpoint  
**Constraints**: Multi-tenant isolation; version history on updates; cascade delete for versions  
**Scale/Scope**: Initial MVP, 100 dashboards per project, 100 nodes per dashboard

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Micro-Kernel & Separation | ✅ PASS | Server package is separate from kernel; no UI dependencies |
| II. Schema-First Contracts (Zod) | ✅ PASS | Using Zod validators in `lib/validators/dashboard.ts` |
| III. Type Safety | ✅ PASS | TypeScript strict mode; typed API responses; derived types from Zod |
| IV. Backward Compatibility | ✅ PASS | New endpoints; no breaking changes; Prisma schema already has Dashboard model |
| V. Simplicity & Performance | ✅ PASS | Standard CRUD pattern; minimal abstraction; follows existing project API style |
| VI. Plugin Independence | N/A | Server-side feature; not plugin-related |

**Quality Gates**:
- `pnpm typecheck` must pass for `@thingsvis/server`
- Prisma schema already includes Dashboard and DashboardVersion models
- Version history automatically created on dashboard updates

**Post-Design Re-check**: ✅ All gates pass. Design follows established patterns.

## Project Structure

### Documentation (this feature)

```text
specs/015-dashboards-crud-api/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (OpenAPI spec)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (packages/thingsvis-server)

```text
packages/thingsvis-server/
├── prisma/
│   └── schema.prisma              # Dashboard & DashboardVersion models (already exist)
├── src/
│   ├── app/
│   │   └── api/
│   │       └── v1/
│   │           └── dashboards/
│   │               ├── route.ts        # NEW: GET (list), POST (create)
│   │               └── [id]/
│   │                   └── route.ts    # NEW: GET, PUT, DELETE
│   ├── lib/
│   │   ├── auth.ts                     # Existing auth setup
│   │   ├── auth-helpers.ts             # Existing session helper
│   │   ├── db.ts                       # Existing Prisma client
│   │   └── validators/
│   │       ├── auth.ts                 # Existing
│   │       ├── project.ts              # Existing
│   │       └── dashboard.ts            # NEW: Dashboard schemas
│   └── types/
│       └── next-auth.d.ts              # Existing extended session types
```

**Structure Decision**: Follows Next.js App Router conventions established by auth and projects routes. API pattern mirrors projects-crud-api for consistency.

## Complexity Tracking

No constitution violations. Implementation uses established patterns from projects-crud-api.

---

## Phase 0: Research

### Research Tasks Completed

1. **Existing Patterns**: Reviewed projects-crud-api implementation for consistent patterns
2. **Database Schema**: Confirmed Dashboard and DashboardVersion models exist in Prisma schema
3. **Auth Helper**: Confirmed `getSessionUser()` returns user with `tenantId` for multi-tenant isolation
4. **JSON Storage**: Prisma schema uses String fields for JSON (SQLite compatibility)

### Key Decisions

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Store JSON as strings | SQLite compatibility; Prisma doesn't support native JSON for SQLite | Use Postgres-only JSON type (rejected: dev/prod parity) |
| Parse JSON in response helpers | Consistent API response format; clients receive objects | Return raw strings (rejected: poor DX) |
| Version history as full snapshot | Simplicity; enables exact rollback | Incremental diffs (rejected: complexity for MVP) |
| Filter by project via query param | Consistency with list patterns; allows cross-project listing | Filter via nested route /projects/:id/dashboards (rejected: adds nesting complexity) |

---

## Phase 1: Design & Contracts

### Data Model

See [data-model.md](data-model.md) for complete entity definitions.

**Key Entities** (from Prisma schema):

```
Dashboard
├── id: String (cuid)
├── name: String
├── version: Int (auto-increment on update)
├── canvasConfig: String (JSON)
├── nodes: String (JSON)
├── dataSources: String (JSON)
├── isPublished: Boolean
├── publishedAt: DateTime?
├── shareToken: String? (unique)
├── shareConfig: String? (JSON)
├── projectId: String (FK → Project)
├── createdById: String (FK → User)
├── createdAt: DateTime
└── updatedAt: DateTime

DashboardVersion
├── id: String (cuid)
├── version: Int
├── canvasConfig: String (JSON)
├── nodes: String (JSON)
├── dataSources: String (JSON)
├── dashboardId: String (FK → Dashboard)
└── createdAt: DateTime
```

### API Contracts

See [contracts/openapi.yaml](contracts/openapi.yaml) for full OpenAPI specification.

**Endpoints Summary**:

| Method | Path | Description | Status Codes |
|--------|------|-------------|--------------|
| GET | `/api/v1/dashboards` | List dashboards (optional projectId filter) | 200, 401 |
| POST | `/api/v1/dashboards` | Create dashboard | 201, 400, 401, 404 |
| GET | `/api/v1/dashboards/:id` | Get dashboard with parsed JSON | 200, 401, 404 |
| PUT | `/api/v1/dashboards/:id` | Update dashboard (creates version) | 200, 400, 401, 404 |
| DELETE | `/api/v1/dashboards/:id` | Delete dashboard (cascades versions) | 200, 401, 404 |

### Validation Schemas (Zod)

```typescript
// CanvasConfig schema
CanvasConfigSchema = z.object({
  mode: z.enum(['fixed', 'infinite', 'reflow']).default('fixed'),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  background: z.string().default('#1a1a2e'),
})

// Create dashboard
CreateDashboardSchema = z.object({
  name: z.string().min(1).max(100),
  projectId: z.string().cuid(),
  canvasConfig: CanvasConfigSchema.optional(),
})

// Update dashboard (all fields optional)
UpdateDashboardSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  canvasConfig: z.any().optional(),  // Flexible JSON
  nodes: z.any().optional(),          // Flexible JSON array
  dataSources: z.any().optional(),    // Flexible JSON array
})
```

### Implementation Notes

1. **JSON Parsing Helper**: Create `parseDashboard()` to consistently parse JSON fields
2. **Version History**: Create DashboardVersion before updating Dashboard
3. **Tenant Isolation**: Always filter by `project.tenantId` via user session
4. **Pagination**: Same pattern as projects API (page, limit, total, totalPages)

---

## Deliverables

| File | Description | Status |
|------|-------------|--------|
| `src/lib/validators/dashboard.ts` | Zod schemas for create/update | To implement |
| `src/app/api/v1/dashboards/route.ts` | List & create endpoints | To implement |
| `src/app/api/v1/dashboards/[id]/route.ts` | Get, update, delete endpoints | To implement |
| `specs/015-dashboards-crud-api/research.md` | Research findings | To create |
| `specs/015-dashboards-crud-api/data-model.md` | Entity documentation | To create |
| `specs/015-dashboards-crud-api/quickstart.md` | API usage guide | To create |
| `specs/015-dashboards-crud-api/contracts/openapi.yaml` | OpenAPI specification | To create |
