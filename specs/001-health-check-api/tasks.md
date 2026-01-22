# Tasks: Health Check API

**Input**: Design documents from `/specs/001-health-check-api/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/health.openapi.yaml ✅

**Tests**: Not explicitly requested - implementation tasks only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project context verification - no new setup required for this feature

- [X] T001 Verify existing health route file exists at packages/thingsvis-server/src/app/api/v1/health/route.ts
- [X] T002 Verify Prisma client is available at packages/thingsvis-server/src/lib/db.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Utility functions needed by all user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Add timeout utility helper function to packages/thingsvis-server/src/app/api/v1/health/route.ts
- [X] T004 Add `export const dynamic = 'force-dynamic'` to prevent caching in packages/thingsvis-server/src/app/api/v1/health/route.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Basic Server Health Check (Priority: P1) 🎯 MVP

**Goal**: Operator can verify server is running and responsive via GET /api/v1/health

**Independent Test**: `curl -i http://localhost:3001/api/v1/health` returns HTTP 200 with JSON body containing `status: "healthy"`

### Implementation for User Story 1

- [X] T005 [US1] Implement GET handler returning basic health response with status field in packages/thingsvis-server/src/app/api/v1/health/route.ts
- [X] T006 [US1] Add HTTP 200 response for healthy state in packages/thingsvis-server/src/app/api/v1/health/route.ts
- [X] T007 [US1] Add HTTP 503 response for unhealthy state in packages/thingsvis-server/src/app/api/v1/health/route.ts
- [X] T008 [P] [US1] Implement POST handler returning 405 Method Not Allowed in packages/thingsvis-server/src/app/api/v1/health/route.ts
- [X] T009 [P] [US1] Implement PUT handler returning 405 Method Not Allowed in packages/thingsvis-server/src/app/api/v1/health/route.ts
- [X] T010 [P] [US1] Implement DELETE handler returning 405 Method Not Allowed in packages/thingsvis-server/src/app/api/v1/health/route.ts
- [X] T011 [P] [US1] Implement PATCH handler returning 405 Method Not Allowed in packages/thingsvis-server/src/app/api/v1/health/route.ts

**Checkpoint**: User Story 1 complete - basic health check works independently. Can test: `curl http://localhost:3001/api/v1/health` returns 200.

---

## Phase 4: User Story 2 - Database Connectivity Check (Priority: P2)

**Goal**: Operator can verify database connectivity from health endpoint response

**Independent Test**: Health endpoint response includes `checks.database.status` reflecting actual database state

### Implementation for User Story 2

- [X] T012 [US2] Import prisma client from @/lib/db in packages/thingsvis-server/src/app/api/v1/health/route.ts
- [X] T013 [US2] Implement database connectivity check using `prisma.$queryRaw\`SELECT 1\`` in packages/thingsvis-server/src/app/api/v1/health/route.ts
- [X] T014 [US2] Add 5-second timeout wrapper for database check in packages/thingsvis-server/src/app/api/v1/health/route.ts
- [X] T015 [US2] Add database latency measurement (ms) to response in packages/thingsvis-server/src/app/api/v1/health/route.ts
- [X] T016 [US2] Add error message capture for failed database checks in packages/thingsvis-server/src/app/api/v1/health/route.ts
- [X] T017 [US2] Integrate database status into overall health calculation (unhealthy if db fails) in packages/thingsvis-server/src/app/api/v1/health/route.ts

**Checkpoint**: User Story 2 complete - database status visible in health response. Can test: stop database → endpoint returns 503 with `checks.database.status: "unhealthy"`.

---

## Phase 5: User Story 3 - Structured Health Information (Priority: P3)

**Goal**: Operator receives complete structured health response with version, timestamp, uptime, and component checks

**Independent Test**: Health response contains all fields per OpenAPI contract: status, version, timestamp, uptime, checks, responseTime

### Implementation for User Story 3

- [X] T018 [US3] Add version field from `process.env.npm_package_version` with fallback to "0.1.0" in packages/thingsvis-server/src/app/api/v1/health/route.ts
- [X] T019 [US3] Add timestamp field with ISO 8601 format in packages/thingsvis-server/src/app/api/v1/health/route.ts
- [X] T020 [US3] Add uptime field using `process.uptime()` in packages/thingsvis-server/src/app/api/v1/health/route.ts
- [X] T021 [US3] Add responseTime field measuring total handler execution time in packages/thingsvis-server/src/app/api/v1/health/route.ts
- [X] T022 [US3] Structure checks object as `Record<string, ComponentCheck>` per data-model.md in packages/thingsvis-server/src/app/api/v1/health/route.ts

**Checkpoint**: User Story 3 complete - full structured response available. All fields from OpenAPI contract present.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation

- [X] T023 [P] Run quickstart.md validation steps to verify all scenarios pass
- [X] T024 Verify response matches OpenAPI contract in contracts/health.openapi.yaml
- [X] T025 [P] Manual test: healthy database → 200 response
- [X] T026 [P] Manual test: non-GET methods → 405 response
- [X] T027 Update spec.md status from "Draft" to "Complete" in specs/001-health-check-api/spec.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - verification only
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational
- **User Story 2 (Phase 4)**: Depends on User Story 1 (builds on GET handler)
- **User Story 3 (Phase 5)**: Depends on User Story 2 (adds fields to existing response)
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P2)**: Builds on US1's GET handler - Adds database check to existing response
- **User Story 3 (P3)**: Builds on US2 - Adds version/timestamp/uptime to existing response

### Within Each User Story

- Core implementation before additional fields
- All 405 method handlers can run in parallel (T008-T011)
- Story complete before moving to next priority

### Parallel Opportunities

Within Phase 3 (User Story 1):
```
T008, T009, T010, T011 can run in parallel (different HTTP methods, same file but independent exports)
```

Within Phase 6 (Polish):
```
T023, T025, T026 can run in parallel (independent validation tasks)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup verification
2. Complete Phase 2: Foundational (timeout helper, dynamic export)
3. Complete Phase 3: User Story 1 (basic GET returns 200, other methods return 405)
4. **STOP and VALIDATE**: `curl http://localhost:3001/api/v1/health` → 200 OK
5. Can deploy/demo basic health check functionality

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Basic health check works → **MVP!**
3. Add User Story 2 → Database status visible → Enhanced monitoring
4. Add User Story 3 → Full structured response → Complete feature
5. Each story enhances the response without breaking previous functionality

### Single Developer Flow

Since this is a single-file feature, sequential execution is recommended:
1. T001-T004: Foundation
2. T005-T011: User Story 1 (parallel opportunity for T008-T011)
3. T012-T017: User Story 2
4. T018-T022: User Story 3
5. T023-T027: Polish

---

## Notes

- All implementation is in a single file: `packages/thingsvis-server/src/app/api/v1/health/route.ts`
- Existing file has minimal implementation - will be enhanced incrementally
- No new dependencies required
- No database schema changes
- Verify tests by running server and using curl commands from quickstart.md
