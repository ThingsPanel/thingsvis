# Tasks: Dashboards CRUD API

**Input**: Design documents from `/specs/015-dashboards-crud-api/`  
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/openapi.yaml ✓

**Tests**: Not requested in feature specification - implementation tasks only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Convention

- **Monorepo package**: `packages/thingsvis-server/src/`

---

## Phase 1: Setup

**Purpose**: Create shared infrastructure for all dashboard endpoints

- [x] T001 Create Zod validation schemas in packages/thingsvis-server/src/lib/validators/dashboard.ts

---

## Phase 2: Foundational

**Purpose**: Create parseDashboard helper and route file structure

**⚠️ CRITICAL**: User story endpoints depend on these foundations

- [x] T002 Create dashboards route file with imports in packages/thingsvis-server/src/app/api/v1/dashboards/route.ts
- [x] T003 [P] Create dashboard [id] route file with parseDashboard helper in packages/thingsvis-server/src/app/api/v1/dashboards/[id]/route.ts

**Checkpoint**: Foundation ready - endpoint handlers can now be implemented

---

## Phase 3: User Story 1 - List Dashboards in a Project (Priority: P1) 🎯 MVP

**Goal**: Users can view all dashboards within a specific project with pagination

**Independent Test**: GET /api/v1/dashboards?projectId=xxx returns dashboard list with proper pagination metadata

### Implementation for User Story 1

- [x] T004 [US1] Implement GET handler for dashboard list endpoint in packages/thingsvis-server/src/app/api/v1/dashboards/route.ts
  - Query params: projectId (optional filter), page, limit
  - Select: id, name, version, isPublished, projectId, createdAt, updatedAt
  - Include: project (id, name), createdBy (id, name)
  - Filter by project.tenantId for multi-tenant isolation
  - Return: { data: [...], meta: { page, limit, total, totalPages } }

**Checkpoint**: User Story 1 complete - dashboard listing works independently

---

## Phase 4: User Story 2 - Create a New Dashboard (Priority: P1) 🎯 MVP

**Goal**: Users can create a new dashboard within a project with default or custom canvas config

**Independent Test**: POST /api/v1/dashboards creates dashboard and returns parsed JSON fields

### Implementation for User Story 2

- [x] T005 [US2] Implement POST handler for dashboard creation in packages/thingsvis-server/src/app/api/v1/dashboards/route.ts
  - Validate body with CreateDashboardSchema
  - Verify projectId belongs to user's tenant
  - Apply default canvasConfig if not provided
  - Store canvasConfig as JSON string
  - Initialize nodes='[]' and dataSources='[]'
  - Return created dashboard with parsed JSON fields

**Checkpoint**: User Stories 1 & 2 complete - can list and create dashboards

---

## Phase 5: User Story 3 - Retrieve Dashboard Full Data (Priority: P1) 🎯 MVP

**Goal**: Users can retrieve complete dashboard data including parsed JSON fields

**Independent Test**: GET /api/v1/dashboards/:id returns dashboard with canvasConfig/nodes/dataSources as objects

### Implementation for User Story 3

- [x] T006 [US3] Implement GET handler for single dashboard in packages/thingsvis-server/src/app/api/v1/dashboards/[id]/route.ts
  - Find by id with project.tenantId filter
  - Include project (id, name), createdBy (id, name)
  - Parse JSON fields using parseDashboard helper
  - Return 404 if not found

**Checkpoint**: User Stories 1, 2 & 3 complete - full read operations working

---

## Phase 6: User Story 4 - Update Dashboard (Priority: P2)

**Goal**: Users can save dashboard changes with automatic version history

**Independent Test**: PUT /api/v1/dashboards/:id updates dashboard, increments version, creates DashboardVersion record

### Implementation for User Story 4

- [x] T007 [US4] Implement PUT handler for dashboard update in packages/thingsvis-server/src/app/api/v1/dashboards/[id]/route.ts
  - Validate body with UpdateDashboardSchema
  - Verify dashboard exists in user's tenant
  - Create DashboardVersion snapshot before update
  - Update dashboard with new values (stringify JSON fields)
  - Increment version number
  - Return updated dashboard with parsed JSON fields

**Checkpoint**: User Stories 1-4 complete - full CRUD except delete

---

## Phase 7: User Story 5 - Delete Dashboard (Priority: P3)

**Goal**: Users can permanently delete dashboards (cascades to version history)

**Independent Test**: DELETE /api/v1/dashboards/:id removes dashboard and all associated versions

### Implementation for User Story 5

- [x] T008 [US5] Implement DELETE handler for dashboard in packages/thingsvis-server/src/app/api/v1/dashboards/[id]/route.ts
  - Verify dashboard exists in user's tenant
  - Delete dashboard (Prisma cascade handles versions)
  - Return { success: true }

**Checkpoint**: All user stories complete - full CRUD operations working

---

## Phase 8: Polish & Validation

**Purpose**: Final validation and type checking

- [x] T009 Run pnpm typecheck in packages/thingsvis-server to verify no TypeScript errors
- [x] T010 Validate API against quickstart.md examples using curl/httpie

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup ─────────────────┐
                                ▼
Phase 2: Foundational ──────────┤
                                ▼
         ┌──────────────────────┴──────────────────────┐
         ▼                      ▼                      ▼
Phase 3: US1 (List)    Phase 4: US2 (Create)   Phase 5: US3 (Get)
         │                      │                      │
         └──────────────────────┴──────────────────────┘
                                ▼
                       Phase 6: US4 (Update)
                                ▼
                       Phase 7: US5 (Delete)
                                ▼
                       Phase 8: Polish
```

### User Story Dependencies

| Story | Depends On | Can Parallel With |
|-------|------------|-------------------|
| US1 (List) | Foundational | US2, US3 |
| US2 (Create) | Foundational | US1, US3 |
| US3 (Get) | Foundational, parseDashboard helper | US1, US2 |
| US4 (Update) | US3 (shares parseDashboard) | None (needs [id]/route.ts) |
| US5 (Delete) | US4 (same file) | None |

### Parallel Opportunities

```bash
# After Phase 2 completes, these can run in parallel:
T004 [US1] - List dashboards (route.ts)
T005 [US2] - Create dashboard (route.ts)  # Same file as T004, but independent handlers
T006 [US3] - Get dashboard ([id]/route.ts)

# Note: T004 and T005 are in the same file but implement different HTTP methods
# They can be developed as separate functions that don't conflict
```

---

## Implementation Strategy

### MVP First (User Stories 1-3)

1. Complete Phase 1: Setup (validators)
2. Complete Phase 2: Foundational (route files + helper)
3. Complete Phase 3-5: US1 + US2 + US3 (all P1 priority)
4. **STOP and VALIDATE**: Test list, create, get operations
5. Deploy/demo MVP - users can create and view dashboards

### Full Feature

6. Complete Phase 6: US4 (update with version history)
7. Complete Phase 7: US5 (delete)
8. Complete Phase 8: Polish
9. Full CRUD operational

---

## Notes

- All endpoints require authentication via session cookie
- JSON fields (canvasConfig, nodes, dataSources) stored as strings, parsed in responses
- Version history created automatically on PUT - no separate versioning endpoint needed
- Prisma cascade delete handles DashboardVersion cleanup
- Follow existing patterns from projects-crud-api for consistency
