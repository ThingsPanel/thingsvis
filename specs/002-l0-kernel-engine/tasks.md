---
description: "Tasks for Phase 2 - L0 Kernel Engine (Interaction & Data Sync)"
---

## Tasks: Phase 2 - L0 Kernel Engine (Interaction & Data Sync)

**Input**: Design documents from `specs/002-l0-kernel-engine/`  
**Prerequisites**: `plan.md`, `spec.md`, `data-model.md`, `quickstart.md`

**Tests**: No automated test tasks are mandated in this phase; verification is primarily via the preview app flows described in `quickstart.md`.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., [US1], [US2], [US3])
- All descriptions include concrete file paths

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Ensure the monorepo, build tooling, and preview app are ready for interaction and data-sync work.

- [ ] T001 Verify pnpm workspace and Turbo configuration in `pnpm-workspace.yaml` and `turbo.json`
- [ ] T002 Ensure root tooling and scripts are wired for this feature in `package.json`
- [ ] T003 [P] Install all workspace dependencies from repo root (`pnpm install`) using `package.json`
- [ ] T004 [P] Confirm Rspack/Rsbuild library builds succeed for all packages via root `package.json` scripts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core kernel and UI infrastructure that MUST exist before interaction & history behavior.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [ ] T005 Ensure vanilla Zustand kernel store with Immer middleware is implemented in `packages/thingsvis-kernel/src/store/KernelStore.ts`
- [ ] T006 Ensure Leafer-backed `VisualEngine` with `sync()` diff loop is implemented in `packages/thingsvis-ui/src/engine/VisualEngine.ts`
- [ ] T007 Ensure React Bypass wrapper `<CanvasView />` mounts `VisualEngine` in `packages/thingsvis-ui/src/components/CanvasView.tsx`
- [ ] T008 Ensure preview app mounts `<CanvasView />` and loads `schema-1000-rects.json` in `apps/preview/src/App.tsx` and `apps/preview/src/main.tsx`

**Checkpoint**: Kernel store, VisualEngine, and preview wiring exist and build/run successfully.

---

## Phase 3: User Story 1 - Initialize and render a large scene (Priority: P1) 🎯 MVP

**Goal**: Initialize the kernel with a page schema containing 1000 rectangle nodes and render them headlessly via LeaferJS with no editor UI.

**Independent Test**: Load the preview app, ensure all 1000 rectangles from `apps/preview/src/schema-1000-rects.json` render on the canvas with correct positions/dimensions and no editor chrome.

### Implementation for User Story 1

- [ ] T009 [P] [US1] Validate `PageSchema` and `NodeSchema` wiring from `@thingsvis/schema` into kernel state in `packages/thingsvis-kernel/src/store/KernelStore.ts`
- [ ] T010 [P] [US1] Ensure kernel initialization from a `PageSchema` builds `nodesById` and initial `KernelState` in `packages/thingsvis-kernel/src/store/KernelStore.ts`
- [ ] T011 [P] [US1] Ensure `VisualEngine` subscribes to kernel state and calls `sync()` on node changes in `packages/thingsvis-ui/src/engine/VisualEngine.ts`
- [ ] T012 [US1] Wire preview app bootstrap to initialize kernel with `schema-1000-rects.json` in `apps/preview/src/App.tsx`
- [ ] T013 [US1] Verify Leafer canvas is created and attaches to DOM container in `apps/preview/src/App.tsx`
- [ ] T014 [US1] Document manual verification steps for 1000-node render in `specs/002-l0-kernel-engine/quickstart.md`

**Checkpoint**: User Story 1 is independently demonstrable via the preview app (static render).

---

## Phase 4: User Story 2 - Interact with nodes and track state changes (Priority: P1)

**Goal**: Allow users to interact with nodes (click/drag) and persist those interactions into kernel state so applications can respond to selection and movement.

**Independent Test**: Using the preview app, click and drag different rectangles; confirm the kernel store updates `selection` and node `{ x, y }` positions, and that this state is observable from outside the rendering layer.

### Implementation for User Story 2

- [x] T015 [P] [US2] Confirm `KernelState.selection` shape and accessors exist or add them in `packages/thingsvis-kernel/src/store/KernelStore.ts`
- [x] T016 [US2] Add `updateNode(id, props)` action on the kernel store to update node properties (including position) in `packages/thingsvis-kernel/src/store/KernelStore.ts`
- [x] T017 [P] [US2] Ensure node selection (`node.click`) events from Leafer map to kernel selection updates in `packages/thingsvis-ui/src/engine/VisualEngine.ts`
- [ ] T018 [P] [US2] Listen to Leafer’s drag lifecycle (`drag.start`, `drag.move`, `drag.end`) on node shapes in `packages/thingsvis-ui/src/engine/VisualEngine.ts`
- [x] T019 [US2] On `drag.end`, extract the final `{ x, y }` from the dragged Leafer shape and call `store.updateNode(id, { x, y })` in `packages/thingsvis-ui/src/engine/VisualEngine.ts`
- [x] T020 [P] [US2] Ensure drag-related kernel updates only fire on `drag.end` (not every `drag.move`) for performance in `packages/thingsvis-ui/src/engine/VisualEngine.ts`
- [ ] T021 [US2] Expose a minimal kernel store API from `packages/thingsvis-kernel/src/index.ts` so the preview app can introspect selection and positions
- [ ] T022 [US2] Add simple developer-facing state logging (e.g., console or debug panel) in `apps/preview/src/App.tsx` to visualize selection/position state changes

**Checkpoint**: Clicking and dragging nodes updates kernel state (selection and position) and can be observed externally.

---

## Phase 5: User Story 3 - Undo and redo state changes (Priority: P2)

**Goal**: Provide undo/redo for interaction-driven state changes (selection and movement) via temporal history so users can revert or reapply changes.

**Independent Test**: Perform a sequence of selections and drags in the preview app, then trigger Undo/Redo via the UI toolbar and verify kernel state and Leafer visuals step backward and forward through history.

### Implementation for User Story 3

- [x] T023 [P] [US3] Add `zundo` dependency to the kernel package in `packages/thingsvis-kernel/package.json`
- [x] T024 [US3] Wrap the vanilla Zustand kernel store with `zundo` middleware to capture temporal history in `packages/thingsvis-kernel/src/store/KernelStore.ts`
- [ ] T025 [P] [US3] Configure `zundo` history to track node selection and movement commands only (avoid transient/derived state) in `packages/thingsvis-kernel/src/store/KernelStore.ts`
- [x] T026 [US3] Export a temporal API (`useKernelStore.temporal` or equivalent undo/redo helpers) from `packages/thingsvis-kernel/src/index.ts`
- [ ] T027 [P] [US3] Ensure VisualEngine reacts correctly when temporal history changes (Undo/Redo) in `packages/thingsvis-ui/src/engine/VisualEngine.ts`
- [x] T028 [US3] Add a floating toolbar container to the preview layout in `apps/preview/src/App.tsx`
- [x] T029 [US3] Implement "Undo" and "Redo" buttons in the floating toolbar UI in `apps/preview/src/App.tsx`
- [x] T030 [US3] Wire "Undo" and "Redo" buttons to call the kernel temporal API functions in `apps/preview/src/App.tsx`
- [x] T031 [US3] Disable the "Undo" button when there is no undo history (and optionally "Redo" when there is no redo history) based on temporal state in `apps/preview/src/App.tsx`

**Checkpoint**: Undo/Redo work end-to-end through kernel history, VisualEngine, and preview toolbar controls.

---

## Phase 6: User Story 4 - Isolate component errors without crashing (Priority: P2)

**Goal**: Ensure failures in individual components do not crash the entire engine; errors are isolated and surfaced through configurable fallbacks.

**Independent Test**: Configure a node with a component that deliberately throws during render; verify only that node shows the error fallback while the rest of the scene remains fully interactive (including selection, drag, and history).

### Implementation for User Story 4

- [ ] T032 [P] [US4] Confirm `HeadlessErrorBoundary` is implemented and exported from `packages/thingsvis-ui/src/components/HeadlessErrorBoundary.tsx`
- [ ] T033 [P] [US4] Ensure the preview app provides a styled fallback component for the error boundary in `apps/preview/src/components/ErrorFallback.tsx`
- [ ] T034 [US4] Wrap the canvas rendering tree with `HeadlessErrorBoundary` in `apps/preview/src/App.tsx`
- [ ] T035 [P] [US4] Add or configure a demo node whose component intentionally throws for validation in `apps/preview/src/App.tsx` or the demo schema wiring
- [ ] T036 [US4] Verify interactions with non-failing nodes (click, drag, undo/redo) remain functional when one node is in an error state in `apps/preview/src/App.tsx`
- [ ] T037 [US4] Update `specs/002-l0-kernel-engine/quickstart.md` with explicit error-isolation manual test steps

**Checkpoint**: Error isolation is validated without impacting interaction and history flows.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improve documentation, performance, and ergonomics across all stories.

- [ ] T038 [P] Align kernel, UI, and preview public APIs and re-exports in `packages/thingsvis-kernel/src/index.ts` and `packages/thingsvis-ui/src/index.ts`
- [ ] T039 Improve logging, guards, and runtime validation around interaction and history flows in `packages/thingsvis-kernel/src/store/KernelStore.ts`
- [ ] T040 [P] Refine VisualEngine diffing and drag handling for large scenes in `packages/thingsvis-ui/src/engine/VisualEngine.ts`
- [ ] T041 [P] Ensure `quickstart.md` reflects final interaction, undo/redo, and error-isolation flows in `specs/002-l0-kernel-engine/quickstart.md`
- [ ] T042 Add inline developer documentation comments for key types and actions in `packages/thingsvis-kernel/src/store/KernelStore.ts`
- [ ] T043 [P] Run a full manual validation pass following `quickstart.md` and capture notes in `specs/002-l0-kernel-engine/research.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; can start immediately after cloning the repo.
- **Foundational (Phase 2)**: Depends on Setup completion; BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
  - User Story 1 (render-only) should complete before serious interaction work for easier debugging.
  - User Story 2 (interaction & data sync) builds on the rendering from User Story 1.
  - User Story 3 (undo/redo) depends on interaction commands being expressed via the kernel store.
  - User Story 4 (error isolation) can proceed in parallel once base rendering is stable but should validate against interaction/history flows.
- **Polish (Final Phase)**: Depends on all desired user stories (US1–US4) being functionally complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational; no dependencies on other stories.
- **User Story 2 (P1)**: Depends on US1’s render path; must reuse the same kernel and VisualEngine wiring.
- **User Story 3 (P2)**: Depends on US2’s interaction commands so history can track meaningful changes.
- **User Story 4 (P2)**: Depends on at least US1; should also verify behavior alongside US2 and US3 but remains independently testable.

### Within Each User Story

- Prefer to implement kernel data structures/actions before wiring UI events and preview app controls.
- Favor small, composable store actions (`updateNode`, selection changes) to keep history integration simple.
- Complete core behavior for a story (including manual verification) before moving to the next higher-priority story.

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel with each other.
- Within Foundational, tasks T006–T008 can run in parallel once T005 (kernel store existence) is confirmed.
- For **US1**, T009–T011 can be done in parallel, followed by wiring tasks T012–T014.
- For **US2**, kernel-side tasks T015–T016 and UI event tasks T017–T020 can proceed in parallel, with integration tasks T021–T022 after.
- For **US3**, kernel temporal tasks T023–T027 can run in parallel with preview toolbar tasks T028–T031, provided the temporal API surface is agreed up front.
- For **US4**, tasks T032–T035 can be done in parallel, followed by integration/validation tasks T036–T037.
- Polish-phase tasks marked [P] can be picked up opportunistically without blocking core feature delivery.

---

## Implementation Strategy

### MVP First (Render + Basic Interaction)

1. Complete Phase 1 (Setup) and Phase 2 (Foundational).
2. Implement Phase 3 (User Story 1) to achieve stable 1000-node rendering.
3. Implement Phase 4 (User Story 2) to add click/drag interaction and kernel data sync.
4. **STOP and VALIDATE**: Confirm interaction and data sync behavior via `quickstart.md` before introducing history complexity.

### Incremental Delivery

1. Deliver **US1 + US2** as the initial Interaction & Data Sync MVP.
2. Add **US3** undo/redo (Phase 5) and validate history behavior without regressing US1/US2.
3. Add **US4** error isolation (Phase 6) and verify it coexists cleanly with interaction and history flows.
4. Execute Phase N (Polish) to refine performance, documentation, and ergonomics.

### Parallel Team Strategy

With multiple implementers:

1. Complete Setup + Foundational together.
2. Assign:
   - Developer A: Kernel work in `packages/thingsvis-kernel` (store actions, zundo integration).
   - Developer B: UI engine work in `packages/thingsvis-ui` (VisualEngine events, Leafer integration).
   - Developer C: Preview app work in `apps/preview` (toolbar, wiring, manual validation).
3. Coordinate story checkpoints so each user story is independently testable before moving to the next.

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

