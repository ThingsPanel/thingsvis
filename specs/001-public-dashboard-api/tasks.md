# Tasks: Public Dashboard Access API

**Input**: Design documents from `/specs/001-public-dashboard-api/`  
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Tests**: Not requested in specification - test tasks omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md structure:
- **Server package**: `packages/thingsvis-server/src/`
- **API routes**: `packages/thingsvis-server/src/app/api/v1/`
- **Validators**: `packages/thingsvis-server/src/lib/validators/`

---

## Phase 1: Setup

**Purpose**: Install dependencies and prepare infrastructure

- [x] T001 Install nanoid dependency: `cd packages/thingsvis-server && pnpm add nanoid`
- [x] T002 [P] Create share validation schema in `packages/thingsvis-server/src/lib/validators/share.ts`

---

## Phase 2: Foundational

**Purpose**: No foundational tasks needed - existing infrastructure (Prisma, auth-helpers, Dashboard model) is already in place.

**⚠️ Verified**: Dashboard model already contains `isPublished`, `publishedAt`, `shareToken`, `shareConfig` fields per data-model.md.

**Checkpoint**: Foundation ready - user story implementation can begin.

---

## Phase 3: User Story 1 - Publish Dashboard (Priority: P1) 🎯 MVP

**Goal**: Allow dashboard owners to publish/unpublish dashboards, enabling them for public sharing.

**Independent Test**: POST/DELETE `/api/v1/dashboards/:id/publish` changes `isPublished` status and returns confirmation.

### Implementation for User Story 1

- [x] T003 [US1] Create publish route directory `packages/thingsvis-server/src/app/api/v1/dashboards/[id]/publish/`
- [x] T004 [US1] Implement POST handler for publishing dashboard in `packages/thingsvis-server/src/app/api/v1/dashboards/[id]/publish/route.ts`
- [x] T005 [US1] Implement DELETE handler for unpublishing dashboard in `packages/thingsvis-server/src/app/api/v1/dashboards/[id]/publish/route.ts`
- [x] T006 [US1] Add share link invalidation on unpublish (clear shareToken, shareConfig) in publish route

**Checkpoint**: User Story 1 complete - dashboards can be published/unpublished via API.

---

## Phase 4: User Story 2 - Generate Share Link (Priority: P1)

**Goal**: Allow dashboard owners to generate shareable links with optional password and expiration.

**Independent Test**: POST `/api/v1/dashboards/:id/share` returns shareToken and shareUrl for published dashboard.

### Implementation for User Story 2

- [x] T007 [US2] Create share route directory `packages/thingsvis-server/src/app/api/v1/dashboards/[id]/share/`
- [x] T008 [US2] Implement POST handler for generating share link in `packages/thingsvis-server/src/app/api/v1/dashboards/[id]/share/route.ts`
- [x] T009 [US2] Add password hashing with bcryptjs when password option provided in share route
- [x] T010 [US2] Add expiration calculation when expiresIn option provided in share route
- [x] T011 [US2] Add validation that dashboard must be published before sharing (400 error)

**Checkpoint**: User Story 2 complete - share links can be generated with optional protections.

---

## Phase 5: User Story 3 - View Shared Dashboard (Priority: P1)

**Goal**: Allow anonymous visitors to view dashboards via share token without authentication.

**Independent Test**: GET `/api/v1/public/dashboard/:token` returns dashboard data without auth headers.

### Implementation for User Story 3

- [x] T012 [US3] Create public route directory structure `packages/thingsvis-server/src/app/api/v1/public/dashboard/[token]/`
- [x] T013 [US3] Implement GET handler for public dashboard access in `packages/thingsvis-server/src/app/api/v1/public/dashboard/[token]/route.ts`
- [x] T014 [US3] Add expiration check - return 410 Gone if shareConfig.expiresAt is past
- [x] T015 [US3] Add password validation via X-Share-Password header with bcrypt compare
- [x] T016 [US3] Return only public-safe dashboard fields (id, name, canvasConfig, nodes, dataSources)

**Checkpoint**: User Story 3 complete - visitors can view shared dashboards anonymously.

---

## Phase 6: User Story 4 - Manage Share Links (Priority: P2)

**Goal**: Allow dashboard owners to view share link info and revoke share links.

**Independent Test**: GET/DELETE `/api/v1/dashboards/:id/share` retrieves info and revokes link.

### Implementation for User Story 4

- [x] T017 [US4] Implement GET handler for share link info in `packages/thingsvis-server/src/app/api/v1/dashboards/[id]/share/route.ts`
- [x] T018 [US4] Implement DELETE handler for revoking share link in `packages/thingsvis-server/src/app/api/v1/dashboards/[id]/share/route.ts`
- [x] T019 [US4] Return share info including hasPassword flag (not actual password), expiresAt, shareUrl

**Checkpoint**: User Story 4 complete - owners can manage their share links.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and validation

- [x] T020 [P] Update quickstart.md with actual tested curl commands
- [x] T021 Run manual API validation per quickstart.md workflow
- [x] T022 [P] Verify error responses match OpenAPI contract in contracts/public-dashboard-api.yaml

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) - Already complete, existing infrastructure
    ↓
Phase 3 (US1: Publish) ←── MVP starts here
    ↓
Phase 4 (US2: Share) ←── depends on US1 (must be published to share)
    ↓
Phase 5 (US3: Public Access) ←── depends on US2 (needs share token)
    ↓
Phase 6 (US4: Manage) ←── depends on US2 (manages share links)
    ↓
Phase 7 (Polish)
```

### User Story Dependencies

| Story | Depends On | Can Start After |
|-------|------------|-----------------|
| US1 (Publish) | Setup | T002 complete |
| US2 (Share) | US1 | T006 complete |
| US3 (Public Access) | US2 | T011 complete |
| US4 (Manage) | US2 | T011 complete |

**Note**: US3 and US4 can be implemented in parallel after US2 is complete.

### Parallel Opportunities

**Within Phase 1:**
```
T001 (install nanoid) ──┐
                        ├── both can run in parallel
T002 (validators)    ───┘
```

**After US2 Complete:**
```
US3 (Public Access) ──┐
                      ├── can develop in parallel
US4 (Manage Links) ───┘
```

**Within Phase 7:**
```
T020 (quickstart) ────┐
                      ├── all can run in parallel
T022 (verify contract)┘
```

---

## Implementation Strategy

### MVP First (User Stories 1-3)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 3: User Story 1 - Publish (T003-T006)
3. **CHECKPOINT**: Test publish/unpublish independently
4. Complete Phase 4: User Story 2 - Share (T007-T011)
5. **CHECKPOINT**: Test share link generation independently
6. Complete Phase 5: User Story 3 - Public Access (T012-T016)
7. **CHECKPOINT**: Test full flow: publish → share → view
8. **MVP COMPLETE** - Core sharing workflow functional

### Full Feature (Add US4)

9. Complete Phase 6: User Story 4 - Manage (T017-T019)
10. Complete Phase 7: Polish (T020-T022)
11. **FEATURE COMPLETE**

### Incremental Delivery Summary

| Increment | Tasks | Value Delivered |
|-----------|-------|-----------------|
| Setup | T001-T002 | Dependencies ready |
| US1 | T003-T006 | Publish/unpublish works |
| US2 | T007-T011 | Share links generated |
| US3 | T012-T016 | **MVP**: Full public sharing works |
| US4 | T017-T019 | Management capabilities |
| Polish | T020-T022 | Documentation validated |

---

## Notes

- No test tasks included (not requested in spec)
- Schema already supports sharing - no migrations needed
- bcryptjs already installed - reuse for password hashing
- All routes follow existing pattern from `[id]/route.ts`
- Total tasks: 22
- MVP tasks (US1-US3): 16
- P2 tasks (US4): 3
- Polish tasks: 3
