# Tasks: User Registration API

**Input**: Design documents from `/specs/001-user-registration-api/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/register.yaml ✅, quickstart.md ✅

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this belongs to (US1, US2, US3, US4)
- All paths are relative to `packages/thingsvis-server/`

---

## Phase 1: Setup

**Purpose**: Project structure verification and directory creation

- [x] T001 Verify thingsvis-server package exists and dependencies installed
- [x] T002 [P] Create validators directory at src/lib/validators/
- [x] T003 [P] Create auth directory at src/app/api/v1/auth/register/

---

## Phase 2: Foundational (Validation Layer)

**Purpose**: Shared validation infrastructure that all user stories depend on

**⚠️ CRITICAL**: User story implementation requires validation schema to be complete first

- [x] T004 Create RegisterSchema with Zod in src/lib/validators/auth.ts
- [x] T005 Export RegisterInput type from src/lib/validators/auth.ts

**Checkpoint**: Foundation ready - registration route implementation can begin

---

## Phase 3: User Story 1 + 2 - New User Registration & Auto-Tenant Creation (Priority: P1) 🎯 MVP

**Goal**: Users can register with email/password. First user gets auto-created tenant with OWNER role.

**Independent Test**: POST to /api/v1/auth/register with valid email/password returns 201 with user data (excluding passwordHash) and role "OWNER" for first user

### Implementation for User Story 1 + 2 (Combined - Core Registration Flow)

- [x] T006 [US1] Create route.ts file at src/app/api/v1/auth/register/route.ts
- [x] T007 [US1] Implement POST handler with request body parsing
- [x] T008 [US1] Add Zod validation using RegisterSchema.safeParse()
- [x] T009 [US1] Implement duplicate email check with prisma.user.findUnique()
- [x] T010 [US1] Implement password hashing with bcrypt cost factor 12
- [x] T011 [US2] Implement auto-tenant creation when no tenantId provided
- [x] T012 [US2] Generate tenant name from email prefix (e.g., "john's Workspace")
- [x] T013 [US2] Generate unique tenant slug using timestamp pattern
- [x] T014 [US1+2] Implement role assignment logic (first user = OWNER)
- [x] T015 [US1] Create user with prisma.user.create() excluding passwordHash from response
- [x] T016 [US1] Return 201 response with user data (id, email, name, role, tenantId, createdAt)

**Checkpoint**: First user can register, tenant auto-created, assigned OWNER role

---

## Phase 4: User Story 3 - Join Existing Tenant (Priority: P2)

**Goal**: New users can join an existing tenant by providing tenantId

**Independent Test**: POST with valid tenantId adds user to that tenant with VIEWER role

### Implementation for User Story 3

- [x] T017 [US3] Add tenant existence verification when tenantId provided
- [x] T018 [US3] Return 404 error for non-existent tenantId
- [x] T019 [US3] Count existing users in tenant to determine role assignment
- [x] T020 [US3] Assign VIEWER role when tenant already has users

**Checkpoint**: Users can join existing tenants with proper role assignment

---

## Phase 5: User Story 4 - Registration Validation (Priority: P2)

**Goal**: Clear error feedback for invalid registration data

**Independent Test**: Invalid inputs return appropriate 400 errors with specific messages

### Implementation for User Story 4

- [x] T021 [US4] Return structured validation error with Zod flatten() format
- [x] T022 [US4] Add email format validation error message "Invalid email"
- [x] T023 [US4] Add password length validation error message "Password must be at least 8 characters"
- [x] T024 [US4] Return 400 with "Email already registered" for duplicate emails
- [x] T025 [US4] Implement 500 error handling for unexpected errors (generic message, no sensitive data)

**Checkpoint**: All validation scenarios return proper error responses

---

## Phase 6: Polish & Verification

**Purpose**: Final verification and edge case handling

- [x] T026 [P] Add try/catch wrapper with error logging using console.error()
- [x] T027 [P] Verify email max length constraint (254 chars per RFC 5321)
- [x] T028 Run quickstart.md test cases to validate all scenarios
- [x] T029 Verify TypeScript strict mode compliance (no type errors)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Story 1+2 (Phase 3)**: Depends on Foundational (Phase 2)
- **User Story 3 (Phase 4)**: Depends on Phase 3 (extends the same route.ts)
- **User Story 4 (Phase 5)**: Depends on Phase 3 (adds error handling to same file)
- **Polish (Phase 6)**: Depends on all story phases complete

### Within Each Phase

```
Phase 2: T004 → T005 (type depends on schema)
Phase 3: T006 → T007 → T008 → T009 → T010 → T011 → T012 → T013 → T014 → T015 → T016
Phase 4: T017 → T018 → T019 → T020
Phase 5: T021 → T022 → T023 → T024 → T025
Phase 6: T026 ∥ T027 → T028 → T029
```

### Parallel Opportunities

Within Setup phase:
- T002 and T003 can run in parallel (different directories)

Within Polish phase:
- T026 and T027 can run in parallel (independent additions)

### Implementation Strategy

**MVP (Minimum Viable Product)**: Complete Phases 1-3 (Setup + Foundational + US1+2)
- Delivers: First user can register with auto-tenant creation and OWNER role
- Test: `curl -X POST http://localhost:3001/api/v1/auth/register -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"password123"}'`

**Incremental Delivery**:
1. After Phase 3: First user registration works ✅
2. After Phase 4: Team members can join existing tenants ✅
3. After Phase 5: All validation errors handled properly ✅
4. After Phase 6: Production-ready with logging and edge cases ✅

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| Setup | T001-T003 | Directory structure |
| Foundational | T004-T005 | Zod validation schema |
| US1+2 (P1) | T006-T016 | Core registration + auto-tenant |
| US3 (P2) | T017-T020 | Join existing tenant |
| US4 (P2) | T021-T025 | Validation error handling |
| Polish | T026-T029 | Logging, edge cases, verification |

**Total Tasks**: 29  
**MVP Tasks**: 16 (Phases 1-3)  
**Parallel Opportunities**: 4 tasks marked [P]

**Files to Create/Modify**:
1. `src/lib/validators/auth.ts` (NEW) - Tasks T004-T005
2. `src/app/api/v1/auth/register/route.ts` (NEW) - Tasks T006-T025
