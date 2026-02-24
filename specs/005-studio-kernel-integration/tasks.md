# Tasks: Studio–Kernel Deep Integration

**Input**: Design documents from `/specs/005-studio-kernel-integration/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo (ThingsVis)**: `apps/studio/`, `apps/preview/`, `packages/thingsvis-kernel/`, `packages/thingsvis-schema/`, `packages/thingsvis-ui/`, `packages/widgets/*`
- **Tests**: colocate per package when possible; integration/contract tests can live under `apps/*/tests/` or `packages/*/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 [P] Create `specs/005-studio-kernel-integration/contracts/kernel-actions.md` if not already present
- [x] T002 Initialize `apps/studio/src/widgets/registryClient.ts` to fetch `registry.json` from dev/preview server

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [x] T003 Update `KernelState` in `packages/thingsvis-kernel/src/store/KernelStore.ts` to include `selection` and `canvas` state fields
- [x] T004 Implement `PageSchema` loading logic in `packages/thingsvis-kernel/src/store/KernelStore.ts` to properly initialize `nodesById`
- [x] T005 [P] Implement `SafeExecutor` wrapper in `packages/thingsvis-kernel/src/executor/SafeExecutor.ts` for plugin lifecycle protection
- [x] T006 [P] Add error reporting action `setNodeError` to `packages/thingsvis-kernel/src/store/KernelStore.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - 大屏模式 (Fixed) 像素级还原 (Priority: P1) 🎯 MVP

**Goal**: Support fixed benchmark size (e.g., 1920x1080) with centered masking and scale-to-fit display.

**Independent Test**: Load a page with `mode: 'fixed'`, verify the canvas is centered and masked, and coordinates match benchmark size regardless of window size.

### Implementation for User Story 1

- [x] T007 [P] [US1] Implement `fixed` mode centering and masking UI in `packages/thingsvis-ui/src/components/CanvasView.tsx`
- [x] T008 [US1] Update `screenToWorld` in `packages/thingsvis-ui/src/components/CanvasView.tsx` to handle `fixed` mode offset and zoom
- [x] T009 [US1] Implement scale-to-fit calculation logic in `packages/thingsvis-ui/src/modes/mode-controller.ts`
- [x] T010 [P] [US1] Add smoke tests for `fixed` mode coordinate accuracy in `packages/thingsvis-ui/tests/coords.spec.ts`

**Checkpoint**: At this point, Fixed mode display and coordinate mapping are fully functional.

---

## Phase 4: User Story 2 - 组态模式 (Infinite) 无限画布与交互 (Priority: P2)

**Goal**: Support infinite panning/zooming and professional editing handles via Moveable.

**Independent Test**: Pan/zoom on an infinite canvas, select a node, and see Moveable handles appear. Drag/rotate the node and verify store updates.

### Implementation for User Story 2

- [x] T011 [P] [US2] Implement real `Moveable` integration in `apps/studio/src/components/tools/TransformControls.tsx`
- [x] T012 [US2] Create Proxy Layer in `apps/studio/src/components/CanvasView.tsx` that renders invisible DOM targets for each canvas node
- [x] T013 [US2] Integrate `Selecto` for box selection in `apps/studio/src/components/CanvasView.tsx`
- [x] T014 [US2] Wire `Moveable` drag/resize/rotate events to `store.updateNode` in `apps/studio/src/components/CanvasView.tsx`
- [x] T015 [P] [US2] Implement grid snapping logic in `packages/thingsvis-ui/src/utils/snapping.ts` and apply to Moveable config

**Checkpoint**: Infinite canvas with full editing interactions is functional.

---

## Phase 5: User Story 3 - 工业拓扑连线 (Priority: P3)

**Goal**: Connect nodes with lines that stay attached during movement.

**Independent Test**: Create a line between two nodes, move one node, and verify the line updates its endpoints.

### Implementation for User Story 3

- [x] T016 [P] [US3] Implement `Connection` entity rendering in `packages/thingsvis-ui/src/engine/VisualEngine.ts` using LeaferJS Line/Bezier
- [x] T017 [US3] Add `addConnection` and `removeConnection` actions to `packages/thingsvis-kernel/src/store/KernelStore.ts`
- [x] T018 [US3] Implement interactive connection tool in `apps/studio/src/components/tools/ConnectionTool.tsx`
- [x] T019 [US3] Ensure connections are updated in `VisualEngine.sync()` when node positions change

**Checkpoint**: Topology connections are functional and integrated into the rendering loop.

---

## Phase 6: User Story 4 - 撤销/重做与稳定性隔离 (Priority: P4)

**Goal**: Ensure all edits are undoable and single component failures do not crash the app.

**Independent Test**: Perform multiple edits, Undo/Redo them. Trigger a widget error and verify only that node shows an error placeholder.

### Implementation for User Story 4

- [x] T020 [US4] Implement `Command` wrapper for `Moveable` interactions to ensure discrete history steps in `apps/studio/src/lib/StudioCmdStack.ts`
- [x] T021 [P] [US4] Integrate `HeadlessErrorBoundary` in `packages/thingsvis-ui/src/engine/renderers/widgetRenderer.ts`
- [x] T022 [US4] Configure `zundo` (temporal) history limit and filters in `packages/thingsvis-kernel/src/store/KernelStore.ts`
- [x] T023 [P] [US4] Add E2E tests for Undo/Redo stability in `apps/studio/tests/dnd-undo.spec.ts`

**Checkpoint**: System is robust with full history support and error isolation.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T024 [P] Update `quickstart.md` with integrated setup instructions
- [x] T025 Performance profiling: ensure >50fps with 500+ nodes using `VisualEngine` optimizations
- [x] T026 Code cleanup: remove legacy `StudioCmdStack` if kernel history is sufficient
- [x] T027 Run full `specs/005-studio-kernel-integration/quickstart.md` validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on T001-T002. Blocks all US phases.
- **User Stories (Phase 3+)**:
  - US1 (Fixed Mode) and US2 (Infinite Mode) are mostly independent but share the foundational store.
  - US3 (Topology) depends on US2 for node selection/interaction.
  - US4 (Stability) can be layered on top of US1/US2.
- **Polish (Final Phase)**: Depends on completion of US1 and US2.

### User Story Dependencies

- **US1 (P1)**: Independent.
- **US2 (P2)**: Independent.
- **US3 (P3)**: Depends on US2 (for node selection).
- **US4 (P4)**: Cross-cutting.

### Parallel Opportunities

- T005, T006, T007, T010, T011, T016, T021, T023 are all marked [P] as they involve different files or isolated logic.
- Phase 3 (US1) and Phase 4 (US2) can be worked on in parallel by different developers once Phase 2 is complete.

---

## Implementation Strategy

### MVP First (User Story 1 & 2)

1. Complete Phase 1 & 2 (Setup & Foundation).
2. Complete Phase 3 (US1) for Fixed mode display.
3. Complete Phase 4 (US2) for basic Infinite mode interaction.
4. **STOP and VALIDATE**: Test basic editing cycle (Load -> Select -> Move -> Save).

### Incremental Delivery

1. Foundation -> Display (US1) -> Interaction (US2) -> Topology (US3) -> Robustness (US4).
2. Each step adds a measurable "Industrial Grade" feature.

