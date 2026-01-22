# Tasks: Configure NextAuth.js for Authentication

**Input**: Design documents from `/specs/001-nextauth-config/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/auth-api.yaml ✓, quickstart.md ✓

**Tests**: Not explicitly requested in spec - test tasks omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Convention

Source: `packages/thingsvis-server/src/`

---

## Phase 1: Setup (Dependencies & Configuration)

**Purpose**: Install dependencies and configure environment for NextAuth.js

- [X] T001 Install auth dependencies: `pnpm add next-auth@beta @auth/prisma-adapter bcryptjs` in packages/thingsvis-server/
- [X] T002 Install dev dependencies: `pnpm add -D @types/bcryptjs` in packages/thingsvis-server/
- [X] T003 [P] Add AUTH_SECRET and AUTH_URL to packages/thingsvis-server/.env

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Create Prisma client singleton in packages/thingsvis-server/src/lib/db.ts
- [X] T005 [P] Create TypeScript type augmentation for NextAuth.js in packages/thingsvis-server/src/types/next-auth.d.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - User Login with Email/Password (Priority: P1) 🎯 MVP

**Goal**: Enable users to log in using email and password, receiving a valid JWT session

**Independent Test**: Enter valid credentials via `/api/auth/callback/credentials` and verify JWT token is set in cookie

### Implementation for User Story 1

- [X] T006 [US1] Create NextAuth.js configuration with Credentials provider in packages/thingsvis-server/src/lib/auth.ts
- [X] T007 [US1] Implement authorize function with bcrypt password comparison in packages/thingsvis-server/src/lib/auth.ts
- [X] T008 [US1] Create NextAuth.js API route handler in packages/thingsvis-server/src/app/api/auth/[...nextauth]/route.ts
- [X] T009 [US1] Configure JWT strategy and custom sign-in page path in packages/thingsvis-server/src/lib/auth.ts

**Checkpoint**: At this point, users can log in with email/password and receive a JWT session cookie

---

## Phase 4: User Story 2 - Session Contains User Context (Priority: P1)

**Goal**: Ensure session includes id, email, role, and tenantId for authorization decisions

**Independent Test**: After login, call `/api/auth/session` and verify response contains id, email, role, tenantId

### Implementation for User Story 2

- [X] T010 [US2] Implement jwt callback to add custom claims (id, role, tenantId) in packages/thingsvis-server/src/lib/auth.ts
- [X] T011 [US2] Implement session callback to copy token claims to session.user in packages/thingsvis-server/src/lib/auth.ts
- [X] T012 [US2] Verify type augmentation matches session structure in packages/thingsvis-server/src/types/next-auth.d.ts

**Checkpoint**: At this point, session.user contains id, email, role, and tenantId for all authenticated requests

---

## Phase 5: User Story 4 - Secure Password Storage (Priority: P1)

**Goal**: Ensure passwords are validated using bcrypt (cost factor 12)

**Independent Test**: Inspect database to confirm passwordHash is bcrypt format; login succeeds with correct password

### Implementation for User Story 4

- [X] T013 [US4] Verify bcrypt compare is used for password validation in packages/thingsvis-server/src/lib/auth.ts
- [X] T014 [US4] Document bcrypt hash generation for test users in packages/thingsvis-server/README.md or quickstart.md

**Checkpoint**: At this point, password security is verified with bcrypt cost factor 12

---

## Phase 6: User Story 3 - Protected API Routes (Priority: P2)

**Goal**: Protect `/api/v1/*` routes with authentication middleware; allow public access to `/api/auth/*` and `/api/v1/health`

**Independent Test**: Call `GET /api/v1/projects` without auth → 401; call `/api/v1/health` → 200

### Implementation for User Story 3

- [X] T015 [US3] Create auth middleware with route protection logic in packages/thingsvis-server/src/middleware.ts
- [X] T016 [US3] Configure middleware matcher for /api/* routes in packages/thingsvis-server/src/middleware.ts
- [X] T017 [US3] Implement public route exceptions (/api/auth/*, /api/v1/health, /api/v1/public/*) in packages/thingsvis-server/src/middleware.ts
- [X] T018 [P] [US3] Create health check endpoint in packages/thingsvis-server/src/app/api/v1/health/route.ts

**Checkpoint**: At this point, API routes are protected and public routes work without authentication

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation

- [X] T019 Run quickstart.md verification checklist to validate all acceptance criteria
- [X] T020 [P] Update packages/thingsvis-server/.env.example with AUTH_SECRET and AUTH_URL placeholders
- [X] T021 Verify pnpm dev starts without errors and auth endpoints are accessible (TypeScript compiles, build passes)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-6)**: All depend on Foundational phase completion
  - P1 stories (US1, US2, US4) should complete before P2 (US3)
  - US1 must complete before US2 (callbacks depend on auth config)
  - US4 runs in parallel with US2 (verification only)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational - Core login functionality
- **User Story 2 (P1)**: Depends on US1 - Extends auth config with callbacks
- **User Story 4 (P1)**: Depends on US1 - Verification of bcrypt usage (can parallel with US2)
- **User Story 3 (P2)**: Depends on Foundational - Can start after US1 but independently testable

### Parallel Opportunities

```text
Phase 1: T001 → T002 → T003 (T003 is [P])
Phase 2: T004 ─┬─ T005 [P]
               │
Phase 3: T006 → T007 → T008 → T009 (sequential - same file)
               │
Phase 4: T010 → T011 → T012 (sequential - same file, depends on Phase 3)
               │
Phase 5: T013 ─┬─ T014 [P] (parallel with Phase 4, depends on Phase 3)
               │
Phase 6: T015 → T016 → T017 ─┬─ T018 [P] (T018 different file)
               │
Phase 7: T019 → T020 [P] → T021
```

---

## Implementation Strategy

### MVP First (P1 Stories Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (Login)
4. Complete Phase 4: User Story 2 (Session Context)
5. Complete Phase 5: User Story 4 (Password Security)
6. **STOP and VALIDATE**: Test login flow with session inspection
7. Deploy/demo if ready for P1 acceptance

### Full Implementation

1. Complete MVP (above)
2. Complete Phase 6: User Story 3 (API Protection)
3. Complete Phase 7: Polish
4. Run full verification checklist

---

## Notes

- All auth configuration is in `src/lib/auth.ts` - tasks T006-T012 modify the same file sequentially
- Middleware is a separate file `src/middleware.ts` - can be developed after auth config is stable
- No test tasks included as tests were not explicitly requested in the specification
- bcrypt cost factor 12 is hardcoded per research decision (~300ms hash time)
