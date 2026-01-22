# Tasks: Projects CRUD API

**Input**: Design documents from `/specs/014-projects-crud-api/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Not requested in specification - tests omitted.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- All paths relative to `packages/thingsvis-server/`

---

## Phase 1: Setup

**Purpose**: Shared validators and helpers required by all endpoints

- [X] T001 [P] Create Zod validation schemas in src/lib/validators/project.ts
- [X] T002 [P] Create session helper function in src/lib/auth-helpers.ts

**Checkpoint**: Foundation ready - API route implementation can begin

---

## Phase 2: User Story 1 & 2 - List & Create Projects (Priority: P1) 🎯 MVP

**Goal**: Users can view their projects and create new ones

**Independent Test**: 
- GET `/api/v1/projects` returns paginated list with tenant isolation
- POST `/api/v1/projects` creates project with validation

### Implementation for US1 & US2

- [X] T003 [US1][US2] Create projects collection route with GET and POST handlers in src/app/api/v1/projects/route.ts

**Details for T003**:
- GET: Query projects by `tenantId`, include `createdBy` and `_count.dashboards`, pagination via `page`/`limit` params
- POST: Validate with `CreateProjectSchema`, set `tenantId` and `createdById` from session, return 201

**Checkpoint**: Users can list and create projects - MVP complete

---

## Phase 3: User Story 3 & 4 - View & Update Project (Priority: P2)

**Goal**: Users can view project details and update name/description

**Independent Test**:
- GET `/api/v1/projects/:id` returns project with dashboards list
- PUT `/api/v1/projects/:id` updates fields and refreshes `updatedAt`

### Implementation for US3 & US4

- [X] T004 [US3][US4] Create project detail route with GET and PUT handlers in src/app/api/v1/projects/[id]/route.ts

**Details for T004**:
- GET: Find by `id` AND `tenantId`, include `createdBy` and `dashboards` list, return 404 if not found
- PUT: Validate with `UpdateProjectSchema`, verify ownership via `tenantId`, update and return project

**Checkpoint**: Users can view and update individual projects

---

## Phase 4: User Story 5 - Delete Project (Priority: P3)

**Goal**: Users can delete projects with cascade to dashboards

**Independent Test**:
- DELETE `/api/v1/projects/:id` removes project and associated dashboards

### Implementation for US5

- [X] T005 [US5] Add DELETE handler to src/app/api/v1/projects/[id]/route.ts

**Details for T005**:
- Verify project exists and belongs to user's tenant (return 404 otherwise)
- Delete project (Prisma cascade handles dashboards automatically)
- Return `{ success: true }`

**Checkpoint**: Full CRUD complete with cascade delete

---

## Phase 5: Polish & Validation

**Purpose**: Final verification and cleanup

- [X] T006 Run typecheck: `pnpm --filter @thingsvis/server typecheck`
- [X] T007 Manual API testing per quickstart.md scenarios
- [X] T008 Verify tenant isolation (cross-tenant access returns 404)

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ─────────────────────────────────────────┐
    │                                                     │
    ├─► T001: validators/project.ts ──────────────────────┤
    │                                                     │
    └─► T002: auth-helpers.ts ────────────────────────────┤
                                                          │
                         ┌────────────────────────────────┘
                         ▼
Phase 2 (US1 & US2) ─► T003: projects/route.ts (GET, POST)
                         │
                         ▼
Phase 3 (US3 & US4) ─► T004: projects/[id]/route.ts (GET, PUT)
                         │
                         ▼
Phase 4 (US5) ───────► T005: Add DELETE to [id]/route.ts
                         │
                         ▼
Phase 5 (Polish) ────► T006, T007, T008: Validation
```

### Parallel Opportunities

- **Phase 1**: T001 and T002 can run in parallel (different files)
- **Phase 2-4**: Sequential (T003 → T004 → T005) - same route files
- **Phase 5**: T006-T008 are sequential validation steps

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete T001, T002 (Setup) - parallel
2. Complete T003 (List & Create)
3. **STOP and VALIDATE**: Test list/create independently
4. Deploy if ready - users can manage projects

### Incremental Delivery

1. Setup → T001, T002 (parallel)
2. US1 & US2 → T003 → Test → Deploy (MVP!)
3. US3 & US4 → T004 → Test → Deploy (view & update)
4. US5 → T005 → Test → Deploy (delete with cascade)
5. Polish → T006-T008 → Final validation

---

## Notes

- Prisma schema already has Project model with all required fields
- Cascade delete handled by Prisma `onDelete: Cascade` on Dashboard→Project
- Session includes `tenantId` and `id` from NextAuth callbacks
- All endpoints must filter by `tenantId` for multi-tenant isolation
- Return 404 (not 403) for cross-tenant access to prevent existence disclosure
