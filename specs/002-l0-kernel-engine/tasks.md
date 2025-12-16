---

description: "Tasks for implementing Phase 2 - L0 Kernel Engine"
---

# Tasks: Phase 2 - L0 Kernel Engine

**Input**: Design documents from `/specs/002-l0-kernel-engine/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Automated tests are optional in this phase; primary validation is via the preview app behavior (rendering, selection, undo/redo, error isolation, performance feel).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Baseline workspace, tooling, and build configs using Rspack across packages and app.

- [x] T001 Create/verify Rspack base config for libraries (`rspack.config.js`) in `packages/thingsvis-schema/`
- [x] T002 Create/verify Rspack base config for libraries (`rspack.config.js`) in `packages/thingsvis-utils/`
- [x] T003 Create/verify Rspack base config for libraries (`rspack.config.js`) in `packages/thingsvis-kernel/`
- [x] T004 Create/verify Rspack config for UI library (`rspack.config.js`) in `packages/thingsvis-ui/`
- [x] T005 Create/verify Rspack config for preview app (`rspack.config.js`) in `apps/preview/`
- [x] T006 Ensure root workspace wiring for new packages/apps in `pnpm-workspace.yaml` and `turbo.json`
- [x] T007 [P] Ensure strict TS settings are inherited in `tsconfig.json` for all new packages/apps (extends root config)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core schema, utilities, kernel logic, UI engine, and headless wrappers.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T008 Define `PageSchema` Zod (id, version, type, nodes) in `packages/thingsvis-schema/src/page-schema.ts`
- [x] T009 Define `NodeSchema` Zod (id, type, props, style, position, size, parentId?) in `packages/thingsvis-schema/src/node-schema.ts`
- [x] T010 [P] Export schema parsers and inferred types in `packages/thingsvis-schema/src/index.ts`
- [x] T011 Implement `uuid` helper in `packages/thingsvis-utils/src/uuid.ts`
- [x] T012 Implement `deepClone` helper in `packages/thingsvis-utils/src/deepClone.ts`
- [x] T013 [P] Export utils barrel in `packages/thingsvis-utils/src/index.ts`
- [x] T014 Implement vanilla Zustand store scaffold (`KernelStore`) with Immer in `packages/thingsvis-kernel/src/store/KernelStore.ts`
- [x] T015 Implement `HistoryManager` (Command pattern) in `packages/thingsvis-kernel/src/history/HistoryManager.ts`
- [x] T016 Implement `EventBus` in `packages/thingsvis-kernel/src/events/EventBus.ts`
- [x] T017 Implement mock `SafeExecutor` (try/catch sandbox) in `packages/thingsvis-kernel/src/executor/SafeExecutor.ts`
- [x] T018 Implement mock `ResourceLoader` in `packages/thingsvis-kernel/src/loader/ResourceLoader.ts`
- [x] T019 [P] Export kernel public API barrel in `packages/thingsvis-kernel/src/index.ts`
- [x] T020 Implement `VisualEngine` with Leafer instance and `sync(nodes)` diff skeleton in `packages/thingsvis-ui/src/engine/VisualEngine.ts`
- [x] T021 Implement headless `CanvasView.tsx` mounting VisualEngine (React Bypass) in `packages/thingsvis-ui/src/components/CanvasView.tsx`
- [x] T022 Implement headless `HeadlessErrorBoundary.tsx` in `packages/thingsvis-ui/src/components/HeadlessErrorBoundary.tsx`
- [x] T023 [P] Export UI public API barrel in `packages/thingsvis-ui/src/index.ts`
- [x] T024 [P] Add `schema-1000-rects.json` scaffold in `apps/preview/src/schema-1000-rects.json` (placeholder data)

**Checkpoint**: Schema, utils, kernel core, UI engine, and app configs exist and build with Rspack; no React/DOM in kernel; UI is headless.

---

## Phase 3: User Story 1 - Initialize and render a large scene (Priority: P1) 🎯 MVP

**Goal**: Initialize kernel with a 1000-rectangle schema and render via LeaferJS/VisualEngine using React Bypass (no editor UI).

**Independent Test**: Load the preview app; all 1000 rectangles render via CanvasView/VisualEngine within ~5s of start.

- [ ] T025 [P] [US1] Populate 1000-rectangle schema data in `apps/preview/src/schema-1000-rects.json`
- [ ] T026 [US1] Wire schema validation/load into kernel init in `apps/preview/src/main.tsx`
- [ ] T027 [US1] Map schema nodes → kernel state (`nodesById`, positions, size) in `packages/thingsvis-kernel/src/store/KernelStore.ts`
- [ ] T028 [US1] Render nodes through `VisualEngine.sync()` using Leafer primitives in `packages/thingsvis-ui/src/engine/VisualEngine.ts`
- [ ] T029 [US1] Mount `CanvasView` in preview app and pass engine/store refs in `apps/preview/src/App.tsx`
- [ ] T030 [US1] Verify React Bypass (no per-node React re-render) and adjust Rspack build to include Leafer assets in `apps/preview/rspack.config.js`

**Checkpoint**: 1000 nodes render headlessly with LeaferJS through CanvasView/VisualEngine.

---

## Phase 4: User Story 2 - Interact with nodes and track state changes (Priority: P1)

**Goal**: Clicking nodes updates kernel selection state; selection is observable by the app.

**Independent Test**: Click several rectangles; selection state updates within ~100ms and is inspectable/logged.

- [ ] T031 [P] [US2] Add node click hit-testing and event emission in `packages/thingsvis-ui/src/engine/VisualEngine.ts`
- [ ] T032 [US2] Handle `node.click` → selection update action in `packages/thingsvis-kernel/src/store/KernelStore.ts`
- [ ] T033 [US2] Add EventBus wiring for selection events in `packages/thingsvis-kernel/src/events/EventBus.ts`
- [ ] T034 [US2] Surface selection state (e.g., console/log panel) in `apps/preview/src/App.tsx` or `apps/preview/src/components/SelectionPanel.tsx`
- [ ] T035 [P] [US2] Ensure selection overlay/visual cue (if minimal) via Leafer updates in `packages/thingsvis-ui/src/engine/VisualEngine.ts`
- [ ] T036 [US2] Validate selection latency and adjust store/actions to stay within target in `packages/thingsvis-kernel/src/store/KernelStore.ts`

**Checkpoint**: Node clicks update kernel selection and are visible/observable in the preview app.

---

## Phase 5: User Story 3 - Undo and redo state changes (Priority: P2)

**Goal**: Undo/redo selection or movement state changes via HistoryManager commands.

**Independent Test**: Perform selections/movements; Undo reverts; Redo reapplies; visuals stay in sync.

- [ ] T037 [P] [US3] Add command creation for selection/move actions in `packages/thingsvis-kernel/src/store/KernelStore.ts`
- [ ] T038 [US3] Implement undo/redo stack operations in `packages/thingsvis-kernel/src/history/HistoryManager.ts`
- [ ] T039 [US3] Expose undo/redo triggers (keyboard/UI) in `apps/preview/src/App.tsx`
- [ ] T040 [US3] Ensure `VisualEngine.sync()` reflects history-driven state in `packages/thingsvis-ui/src/engine/VisualEngine.ts`
- [ ] T041 [US3] Guard empty history cases and no-op safely in `packages/thingsvis-kernel/src/history/HistoryManager.ts`

**Checkpoint**: Undo/redo works for selection/movement with consistent visuals and state.

---

## Phase 6: User Story 4 - Isolate component errors without crashing (Priority: P2)

**Goal**: A failing component is isolated by HeadlessErrorBoundary; the rest of the scene continues.

**Independent Test**: Inject a failing component; only that node shows fallback; other nodes remain interactive.

- [ ] T042 [P] [US4] Add failing demo component and schema entry in `apps/preview/src/components/FaultyComponent.tsx` and `apps/preview/src/schema-1000-rects.json`
- [ ] T043 [US4] Wrap render path with `HeadlessErrorBoundary` in `packages/thingsvis-ui/src/components/CanvasView.tsx`
- [ ] T044 [US4] Ensure fallback rendering is styled at app layer (`apps/preview/src/components/ErrorFallback.tsx`) not in UI package
- [ ] T045 [US4] Verify error isolation does not tear down Leafer scene in `packages/thingsvis-ui/src/engine/VisualEngine.ts`
- [ ] T046 [US4] Log/track component error state (per-node) in `packages/thingsvis-kernel/src/store/KernelStore.ts`

**Checkpoint**: Component errors are contained; app keeps running and other nodes render normally.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Hardening, docs, and validation.

- [ ] T047 [P] Optimize `VisualEngine.sync()` diffing/hit-testing for 1000+ nodes in `packages/thingsvis-ui/src/engine/VisualEngine.ts`
- [ ] T048 [P] Profile Rspack builds for libs/app and tune cache/aliases in `apps/preview/rspack.config.js` and `packages/*/rspack.config.js`
- [ ] T049 Validate quickstart flow end-to-end from `specs/002-l0-kernel-engine/quickstart.md`
- [ ] T050 [P] Documentation touch-ups for public APIs in `packages/thingsvis-kernel/` and `packages/thingsvis-ui/README.md` (or equivalent)
- [ ] T051 Ensure constitution alignment checks (headless UI, no React in kernel, Rspack everywhere) across new code paths
- [ ] T052 [P] Capture startup/render timing for 1000-node load (<=5s target) in `apps/preview/src/App.tsx` (log metrics)
- [ ] T053 [P] Capture interaction latency metrics for selection and undo/redo (<=100ms/<=200ms targets) in `apps/preview/src/App.tsx` (log metrics)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Must complete before Foundational.
- **Foundational (Phase 2)**: Blocks all user stories.
- **User Stories (Phases 3–6)**: Start after Foundational; prioritize P1 (US1, US2) before P2 (US3, US4).
- **Polish (Phase 7)**: After targeted user stories are complete.

### User Story Dependencies

- **US1 (P1)**: Rendering baseline; prerequisite for meaningful interaction/perf checks.
- **US2 (P1)**: Depends on US1 rendering and kernel store; can run in parallel once rendering path is stable.
- **US3 (P2)**: Depends on kernel store/events from US1/US2.
- **US4 (P2)**: Depends on UI render path and error boundary wiring; can proceed alongside US3 after US1/US2.

### Parallel Opportunities

- Tasks marked [P] are parallelizable (distinct files/no blocking deps).
- Schema/utils/kernels/ui foundational tasks can be split across owners.
- US2 click handling and US3 undo/redo can develop in parallel once store/event plumbing is stable.
- UI error boundary work (US4) can proceed alongside history work (US3) after core rendering exists.

---

## Implementation Strategy

### MVP First (US1)
1) Complete Phase 1–2.  
2) Deliver US1 (render 1000 rectangles via React Bypass).  
3) Validate rendering/perf before adding interactions.

### Incremental Delivery
1) Add US2 (selection).  
2) Add US3 (undo/redo).  
3) Add US4 (error isolation).  
4) Polish for performance and docs; validate quickstart.

