---

description: "Task list for Initialize thingsvis-server Package"
---

# Tasks: Initialize thingsvis-server Package

**Input**: Design documents from [specs/012-init-server-package/](specs/012-init-server-package/)  
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/  
**Tests**: Not requested for this feature.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create base directories for the server package in packages/thingsvis-server/ (including src/app and prisma)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [x] T002 [P] Create packages/thingsvis-server/package.json with Next.js/Prisma scripts and dependencies
- [x] T003 [P] Create packages/thingsvis-server/next.config.js with `output: 'standalone'` and serverActions limits
- [x] T004 [P] Create packages/thingsvis-server/tsconfig.json baseline TypeScript configuration (Next.js compatible)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Start Backend Development Server (Priority: P1) 🎯 MVP

**Goal**: Developers can run `pnpm dev` and see a working root page.

**Independent Test**: Run `pnpm dev` in packages/thingsvis-server and confirm http://localhost:3001 renders the root page.

### Implementation for User Story 1

- [x] T005 [P] [US1] Add RootLayout in packages/thingsvis-server/src/app/layout.tsx with html/body shell
- [x] T006 [P] [US1] Add root page content in packages/thingsvis-server/src/app/page.tsx ("ThingsVis Server")

**Checkpoint**: User Story 1 is independently testable

---

## Phase 4: User Story 2 - Monorepo Build Integration (Priority: P1)

**Goal**: The server package participates in pnpm workspaces and Turborepo build/dev tasks.

**Independent Test**: Run `pnpm build` at repo root and confirm @thingsvis/server is included in the task graph.

### Implementation for User Story 2

- [x] T007 [P] [US2] Ensure packages/* is present in pnpm-workspace.yaml for server package registration
- [x] T008 [P] [US2] Update turbo.json to include a db:generate pipeline task and ensure build depends on it

**Checkpoint**: User Story 2 is independently testable

---

## Phase 5: User Story 3 - Database Connection Verification (Priority: P2)

**Goal**: Prisma is configured for SQLite dev and can generate a client/database.

**Independent Test**: Run `pnpm db:generate` and `pnpm db:push` in packages/thingsvis-server without errors.

### Implementation for User Story 3

- [x] T009 [P] [US3] Create packages/thingsvis-server/prisma/schema.prisma with SQLite datasource and SystemHealth model
- [x] T010 [P] [US3] Add packages/thingsvis-server/.env.example with DATABASE_URL="file:./prisma/dev.db"

**Checkpoint**: User Story 3 is independently testable

---

## Phase 6: User Story 4 - TypeScript Strict Mode Development (Priority: P2)

**Goal**: Strict TypeScript and path aliases are enabled for the server package.

**Independent Test**: Run `pnpm tsc --noEmit` and verify `@/*` imports resolve.

### Implementation for User Story 4

- [x] T011 [US4] Update packages/thingsvis-server/tsconfig.json to enable strict mode
- [x] T012 [US4] Add baseUrl and `@/*` path alias to packages/thingsvis-server/tsconfig.json

**Checkpoint**: User Story 4 is independently testable

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation alignment

- [x] T013 [P] Validate quickstart steps and update specs/012-init-server-package/quickstart.md if needed
- [x] T014 [P] Ensure README references are consistent (if any) in docs/feature/p0-backend-speckit-commands.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → **Foundational (Phase 2)** → **User Stories (Phase 3–6)** → **Polish (Phase 7)**

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 2 completion
- **US2 (P1)**: Depends on Phase 2 completion
- **US3 (P2)**: Depends on Phase 2 completion
- **US4 (P2)**: Depends on Phase 2 completion

### Parallel Opportunities

- Phase 2 tasks T002–T004 can run in parallel after T001
- US1 tasks T005–T006 can run in parallel
- US2 tasks T007–T008 can run in parallel
- US3 tasks T009–T010 can run in parallel
- US4 tasks T011–T012 are sequential within the same file
- Polish tasks T013–T014 can run in parallel

---

## Parallel Example: User Story 1

- Parallel work items: T005 (layout) and T006 (page) in packages/thingsvis-server/src/app/

## Parallel Example: User Story 2

- Parallel work items: T007 (workspace registration) and T008 (turbo pipeline)

## Parallel Example: User Story 3

- Parallel work items: T009 (schema.prisma) and T010 (.env.example)

## Parallel Example: User Story 4

- Sequential within one file: T011 then T012 in packages/thingsvis-server/tsconfig.json
