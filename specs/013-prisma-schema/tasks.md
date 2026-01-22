# Tasks: Define Database Schema with Prisma

**Input**: Design documents from `/specs/013-prisma-schema/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: No tests explicitly requested in the feature specification. Tasks focus on schema definition and verification.

**Organization**: Tasks follow user stories (P1, P2, P3) to enable independent verification.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1, US2, US3) - only in user story phases
- Exact file paths included in descriptions

## Path Conventions

- **Package**: `packages/thingsvis-server/`
- **Schema**: `packages/thingsvis-server/prisma/schema.prisma`
- **Environment**: `packages/thingsvis-server/.env`

---

## Phase 1: Setup

**Purpose**: Ensure environment and dependencies are ready

- [x] T001 Verify .env file exists with DATABASE_URL in packages/thingsvis-server/.env
- [x] T002 Run `pnpm install` in packages/thingsvis-server/ to ensure Prisma dependencies

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Clean existing schema for fresh definition

**⚠️ CRITICAL**: Must complete before user story implementation

- [x] T003 Backup existing schema content from packages/thingsvis-server/prisma/schema.prisma
- [x] T004 Define datasource (sqlite) and generator (prisma-client-js) in packages/thingsvis-server/prisma/schema.prisma

**Checkpoint**: Schema file ready for model definitions

---

## Phase 3: User Story 1 - Define Core Data Models (Priority: P1) 🎯 MVP

**Goal**: Define Tenant, User, Project, Dashboard, DashboardVersion models with all fields, relationships, and constraints

**Independent Test**: Run `pnpm db:push` successfully and verify all 5 tables exist in Prisma Studio

### Implementation for User Story 1

- [x] T005 [P] [US1] Define Tenant model with id, name, slug, plan, settings, timestamps in packages/thingsvis-server/prisma/schema.prisma
- [x] T006 [P] [US1] Define User model with id, email, name, passwordHash, avatar, role, SSO fields, tenantId FK, timestamps in packages/thingsvis-server/prisma/schema.prisma
- [x] T007 [P] [US1] Define Project model with id, name, description, thumbnail, tenantId FK, createdById FK, timestamps in packages/thingsvis-server/prisma/schema.prisma
- [x] T008 [P] [US1] Define Dashboard model with id, name, version, JSON fields, publishing fields, sharing fields, projectId FK, createdById FK, timestamps in packages/thingsvis-server/prisma/schema.prisma
- [x] T009 [P] [US1] Define DashboardVersion model with id, version, JSON snapshot fields, dashboardId FK, timestamp in packages/thingsvis-server/prisma/schema.prisma
- [x] T010 [US1] Add all relationship annotations (@relation) linking models in packages/thingsvis-server/prisma/schema.prisma
- [x] T011 [US1] Add unique constraints (email, slug, shareToken, ssoProvider+ssoSubject composite) in packages/thingsvis-server/prisma/schema.prisma
- [x] T012 [US1] Add indexes (tenantId on Project, projectId and shareToken on Dashboard) in packages/thingsvis-server/prisma/schema.prisma
- [x] T013 [US1] Add cascade delete rules (onDelete: Cascade) for ownership relationships in packages/thingsvis-server/prisma/schema.prisma
- [x] T014 [US1] Add table mapping annotations (@@map) for all models in packages/thingsvis-server/prisma/schema.prisma
- [x] T015 [US1] Run `npx prisma format` to validate and format schema in packages/thingsvis-server/

**Checkpoint**: Schema file complete with all 5 models, relationships, constraints, and indexes ✅

---

## Phase 4: User Story 2 - Run Database Migrations (Priority: P2)

**Goal**: Create database and verify tables are created correctly

**Independent Test**: SQLite database file exists with correct table structure

### Implementation for User Story 2

- [x] T016 [US2] Run `pnpm db:generate` to generate Prisma Client in packages/thingsvis-server/
- [x] T017 [US2] Run `pnpm db:push` to create/update SQLite database in packages/thingsvis-server/
- [x] T018 [US2] Verify dev.db file created at packages/thingsvis-server/prisma/dev.db

**Checkpoint**: Database created with all tables ✅

---

## Phase 5: User Story 3 - Support JSON Storage for Canvas Data (Priority: P3)

**Goal**: Verify JSON string fields work correctly for dashboard data storage

**Independent Test**: Can view Dashboard model in Prisma Studio and see JSON string fields with default values

### Implementation for User Story 3

- [x] T019 [US3] Run `pnpm db:studio` to open Prisma Studio in packages/thingsvis-server/
- [x] T020 [US3] Verify all 5 tables visible: tenants, users, projects, dashboards, dashboard_versions in Prisma Studio
- [x] T021 [US3] Verify Dashboard table shows canvasConfig, nodes, dataSources as String fields with defaults in Prisma Studio
- [x] T022 [US3] Verify foreign key relationships are correctly established between tables in Prisma Studio

**Checkpoint**: All user stories complete - schema supports multi-tenant dashboard storage with JSON fields ✅

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation

- [x] T023 [P] Verify schema matches data-model.md entity definitions
- [x] T024 [P] Run quickstart.md verification checklist
- [x] T025 Add .gitignore entry for prisma/dev.db if not present in packages/thingsvis-server/.gitignore

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion
- **User Story 1 (Phase 3)**: Depends on Foundational - schema definition
- **User Story 2 (Phase 4)**: Depends on User Story 1 - needs complete schema to push
- **User Story 3 (Phase 5)**: Depends on User Story 2 - needs database to verify
- **Polish (Phase 6)**: Depends on all user stories complete

### Within User Story 1

- T005-T009 (model definitions) can run in parallel [P]
- T010-T014 (relationships, constraints, indexes) must run after model definitions
- T015 (format) runs last to validate complete schema

### Parallel Opportunities

```text
# Phase 3 parallelization - all model definitions together:
T005: Define Tenant model
T006: Define User model
T007: Define Project model
T008: Define Dashboard model
T009: Define DashboardVersion model

# Phase 6 parallelization:
T023: Verify against data-model.md
T024: Run quickstart verification
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (schema definition)
4. **STOP and VALIDATE**: Run `npx prisma format` - no errors
5. Proceed to User Story 2 to actually create database

### Incremental Delivery

1. Setup + Foundational → Environment ready
2. User Story 1 → Schema file complete (can review)
3. User Story 2 → Database created (can inspect)
4. User Story 3 → Full verification complete
5. Each story adds confidence without breaking previous work

---

## Notes

- All model definitions (T005-T009) edit the SAME FILE but different sections
- Use Prisma format command to catch syntax errors early
- SQLite dev.db should be in .gitignore
- Schema uses String for enums (SQLite compatibility) per research.md
- All JSON fields use String type with JSON.stringify/parse at application layer
- Cascade deletes configured for ownership (Tenant→User/Project, Project→Dashboard, Dashboard→Version)
- Creator references (createdById) do NOT cascade delete
