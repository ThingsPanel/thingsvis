# Tasks: Foundation Scaffold Initialization

**Input**: Design documents from `/specs/001-foundation-scaffold/`  
**Prerequisites**: plan.md (required), spec.md (required for user stories); research/data-model/contracts not provided

**Tests**: Not explicitly requested for this scaffold; focus on build/typecheck verification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Monorepo: `apps/studio/`, `apps/preview/` (placeholder), `packages/thingsvis-kernel/`, `packages/thingsvis-schema/`, `packages/thingsvis-ui/`
- Tests: to be added later per package/app; not in scope for this scaffold
- Avoid introducing new top-level apps/packages without constitution justification

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish root workspace tooling and shared configs.

- [x] T001 Create root `package.json` with `private`, `packageManager` (pnpm), and scripts `dev/build/lint/typecheck` delegating to turbo (`package.json`).
- [x] T002 Create `pnpm-workspace.yaml` defining `apps/*` and `packages/*` workspaces (`pnpm-workspace.yaml`).
- [x] T003 Create `turbo.json` with pipelines for `build`, `dev`, `lint`, `typecheck` including dependency ordering (`turbo.json`).
- [x] T004 Create root `tsconfig.json` enabling TS 5.x strict, React JSX runtime, and base compiler options shared by apps/packages (`tsconfig.json`).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Ensure folder scaffolds and shared install are ready before story work.

- [x] T005 Create base folders for `apps/studio`, `apps/preview`, `packages/thingsvis-schema`, `packages/thingsvis-kernel`, `packages/thingsvis-ui` (`apps/`, `packages/`).
- [x] T006 Run initial workspace install to generate lockfile and validate workspace detection (`.` run `pnpm install`).

---

## Phase 3: User Story 1 - Monorepo Root Ready (Priority: P1) 🎯 MVP

**Goal**: Root workspace usable with pnpm + Turbo; pipelines recognized.
**Independent Test**: Fresh clone + `pnpm install` succeeds; turbo commands run without config errors.

- [x] T007 [US1] Verify turbo pipeline invocation works via `pnpm turbo run typecheck --filter ./packages/...` using root config (`.`).
- [x] T008 [US1] Document quick check steps in `specs/001-foundation-scaffold/quickstart.md` for install + turbo usage (create file).

---

## Phase 4: User Story 2 - Core Packages Bootstrapped (Priority: P2)

**Goal**: Schema and kernel packages build via tsup with initial exports; UI package exposes a dummy component.
**Independent Test**: `pnpm build --filter @thingsvis/schema`, `@thingsvis/kernel`, `@thingsvis/ui` succeed and emit types.

- [x] T009 [US2] Create `packages/thingsvis-schema/package.json` with name `@thingsvis/schema`, tsup build scripts, exports/entrypoints (`packages/thingsvis-schema/package.json`).
- [x] T010 [US2] Add `packages/thingsvis-schema/tsconfig.json` extending root and including `src/**/*` (`packages/thingsvis-schema/tsconfig.json`).
- [x] T011 [US2] Add `packages/thingsvis-schema/tsup.config.ts` (or CLI flags) configuring ESM/CJS output and DTS (`packages/thingsvis-schema/tsup.config.ts`).
- [x] T012 [US2] Implement `PageSchema` with Zod in `src/page-schema.ts` and export via `src/index.ts` (`packages/thingsvis-schema/src/`).
- [x] T013 [US2] Create `packages/thingsvis-kernel/package.json` with name `@thingsvis/kernel`, tsup scripts, and entrypoints (`packages/thingsvis-kernel/package.json`).
- [x] T014 [US2] Add `packages/thingsvis-kernel/tsconfig.json` extending root (`packages/thingsvis-kernel/tsconfig.json`).
- [x] T015 [US2] Add `packages/thingsvis-kernel/tsup.config.ts` mirroring schema build targets (`packages/thingsvis-kernel/tsup.config.ts`).
- [x] T016 [US2] Implement placeholder `EventBus` class in `src/event-bus.ts` and export via `src/index.ts` (`packages/thingsvis-kernel/src/`).
- [x] T017 [US2] Create `packages/thingsvis-ui/package.json` with name `@thingsvis/ui`, React peer deps, tsup scripts, and entrypoints (`packages/thingsvis-ui/package.json`).
- [x] T018 [US2] Add `packages/thingsvis-ui/tsconfig.json` with `jsx: react-jsx` extending root (`packages/thingsvis-ui/tsconfig.json`).
- [x] T019 [US2] Add `packages/thingsvis-ui/tsup.config.ts` externalizing `react`/`react-dom` and emitting types (`packages/thingsvis-ui/tsup.config.ts`).
- [x] T020 [US2] Implement dummy `Button` component and export via `src/index.ts` (`packages/thingsvis-ui/src/`).
- [x] T021 [US2] Build all packages via `pnpm build --filter @thingsvis/schema --filter @thingsvis/kernel --filter @thingsvis/ui` to verify outputs (`.`).

---

## Phase 5: User Story 3 - Studio App Boots (Priority: P3)

**Goal**: Rsbuild (Rspack) React 18 studio app consuming internal packages with TailwindCSS.
**Independent Test**: Dev server runs; imports `PageSchema`/`EventBus`/`Button`; Tailwind utilities render.

- [x] T022 [US3] Create `apps/studio/package.json` with Rsbuild scripts (`dev`, `build`, `lint`, `typecheck`) and workspace deps on internal packages (`apps/studio/package.json`).
- [x] T023 [US3] Add `apps/studio/rsbuild.config.ts` using `@rsbuild/core` + `@rsbuild/plugin-react` with entry `src/main.tsx` (`apps/studio/rsbuild.config.ts`).
- [x] T024 [US3] Add `apps/studio/tsconfig.json` extending root and including `src/**/*` (`apps/studio/tsconfig.json`).
- [x] T025 [US3] Create Tailwind config `tailwind.config.ts` and PostCSS config `postcss.config.cjs` referencing `src/**/*` and `index.html` (`apps/studio/`).
- [x] T026 [US3] Add `apps/studio/index.html` with root mount point (`apps/studio/index.html`).
- [x] T027 [US3] Implement `src/index.css` importing Tailwind base/components/utilities (`apps/studio/src/index.css`).
- [x] T028 [US3] Implement `src/main.tsx` to bootstrap React root and render `App` (`apps/studio/src/main.tsx`).
- [x] T029 [US3] Implement `src/App.tsx` that imports `PageSchema`, instantiates `EventBus`, uses `Button`, and renders a Tailwind-styled placeholder view (`apps/studio/src/App.tsx`).
- [x] T030 [US3] Verify studio build/dev by running `pnpm build --filter ./apps/studio` or `pnpm dev --filter ./apps/studio` to confirm imports and styling (`.`).

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Validate workspace wiring and readiness.

- [x] T031 Run full workspace build `pnpm build` from root to ensure topological linking across apps and packages (`.`).
- [x] T032 Update `specs/001-foundation-scaffold/quickstart.md` with build/run commands and workspace dependency notes (`specs/001-foundation-scaffold/quickstart.md`).
- [x] T033 Capture any follow-up performance budget notes and pending tasks in `specs/001-foundation-scaffold/tasks.md` footer or backlog section (`specs/001-foundation-scaffold/tasks.md`).

---

## Dependencies & Execution Order

- **Setup (Phase 1)**: No dependencies; must precede all other phases.
- **Foundational (Phase 2)**: Depends on Phase 1; ensures workspace install before packages/apps.
- **User Story 1 (Phase 3)**: Depends on Phase 2; validates root pipelines.
- **User Story 2 (Phase 4)**: Depends on Phase 2; packages can be developed in parallel once workspace exists.
- **User Story 3 (Phase 5)**: Depends on Phase 4 package outputs for imports.
- **Polish**: Depends on all user story phases.

### Parallel Opportunities

- After Phase 2, package scaffolds (schema, kernel, UI) can progress in parallel where files do not overlap (tasks T009–T020).
- Within `apps/studio`, config files (rsbuild, tsconfig, tailwind/postcss) and HTML/CSS scaffolding can be done in parallel (T023–T027) before wiring `App.tsx` (T029).
- Builds/tests (T021, T030, T031) should run sequentially after scaffolds complete.

### Implementation Strategy

1. Complete Phase 1–2 to lock workspace structure.  
2. Deliver User Story 1 to validate root pipelines (MVP gate).  
3. Build packages (User Story 2) → build verification.  
4. Wire studio app (User Story 3) with internal imports → dev/build check.  
5. Run full `pnpm build` and update quickstart notes (Polish).

### Backlog / Notes

- No outstanding performance or linkage follow-ups identified during scaffold.

