# Tasks: Fix Transform Coordinates Under Canvas Zoom

**Input**: Design documents from `/specs/001-fix-transform-zoom/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Not requested in the feature specification; tasks focus on implementation + manual QA + existing typecheck gates.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm baseline and get ready to change transform math safely.

- [X] T001 Confirm current drift bug reproduction steps in apps/studio/src/components/tools/TransformControls.tsx
- [X] T002 [P] Identify and document viewport semantics (zoom/offset) in packages/thingsvis-ui/src/components/CanvasView.tsx
- [X] T003 [P] Confirm proxy-layer world positioning + scaled wrapper in apps/studio/src/components/CanvasView.tsx

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared plumbing needed for all user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 [P] Add a typed viewport getter prop to TransformControls in apps/studio/src/components/tools/TransformControls.tsx
- [X] T005 [P] Wire getViewport callback from CanvasView to TransformControls in apps/studio/src/components/CanvasView.tsx
- [X] T006 Create a small, local conversion helper in apps/studio/src/components/tools/TransformControls.tsx (screen → world using zoom)
- [X] T007 Ensure TransformControls can read base geometry from kernel state in apps/studio/src/components/tools/TransformControls.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Dragging Works Under Any Zoom (Priority: P1) 🎯 MVP

**Goal**: Drag commits correct world positions at any zoom, with no drift/jump.

**Independent Test**: Set zoom to 0.5 and 2.0, drag ~200px on screen; verify world delta equals `screenDelta / zoom` and no drift after changing zoom.

### Implementation for User Story 1

- [X] T008 [US1] Capture base world position from kernel state on dragStart in apps/studio/src/components/tools/TransformControls.tsx
- [X] T009 [US1] On dragEnd, convert Moveable screen delta to world delta using current zoom from getViewport() in apps/studio/src/components/tools/TransformControls.tsx
- [X] T010 [US1] Commit updated node.position (world) via kernelStore.updateNode on dragEnd in apps/studio/src/components/tools/TransformControls.tsx
- [X] T011 [US1] Ensure DOM proxy left/top are set from committed world position (not screen) after dragEnd in apps/studio/src/components/tools/TransformControls.tsx
- [ ] T012 [US1] Manual QA for drag at zoom 1.0/2.0/0.5 and with pan using specs/001-fix-transform-zoom/quickstart.md

**Checkpoint**: User Story 1 is fully functional and testable independently

---

## Phase 4: User Story 2 - Resizing Works Under Any Zoom (Priority: P2)

**Goal**: Resize commits correct world width/height and position at any zoom.

**Independent Test**: At zoom 2.0 and 0.5, resize by ~200px on screen; verify world size delta equals `screenDelta / zoom` and visuals remain stable after zoom changes.

### Implementation for User Story 2

- [X] T013 [US2] Capture base world position and base world size from kernel state on resizeStart in apps/studio/src/components/tools/TransformControls.tsx
- [X] T014 [US2] Determine final screen width/height from Moveable resizeEnd and convert to world size using current zoom from getViewport() in apps/studio/src/components/tools/TransformControls.tsx
- [X] T015 [US2] Convert resizeEnd translate (screen delta) to world delta and apply to base world position in apps/studio/src/components/tools/TransformControls.tsx
- [X] T016 [US2] Commit node.size (world) and node.position (world) via kernelStore.updateNode on resizeEnd in apps/studio/src/components/tools/TransformControls.tsx
- [ ] T017 [US2] Manual QA for resize at zoom 1.0/2.0/0.5 and with pan using specs/001-fix-transform-zoom/quickstart.md

**Checkpoint**: User Stories 1 AND 2 both work independently

---

## Phase 5: User Story 3 - Undo/Redo Restores Exact Results (Priority: P3)

**Goal**: Undo/redo restores exact stored position/size regardless of current zoom.

**Independent Test**: Perform drag/resize at non-1.0 zoom, change zoom, undo/redo; verify values restore exactly and Moveable handles realign.

### Implementation for User Story 3

- [X] T018 [US3] Verify Moveable target re-sync after undo/redo (updateRect) still works with zoom-aware commits in apps/studio/src/components/tools/TransformControls.tsx
- [X] T019 [US3] Add a regression guard: ensure no zoom value is written into node.position/node.size (world-only) in apps/studio/src/components/tools/TransformControls.tsx
- [ ] T020 [US3] Manual QA for undo/redo matrix at zoom 2.0 and 0.5 using specs/001-fix-transform-zoom/quickstart.md

**Checkpoint**: All user stories are independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Ensure quality gates and documentation remain correct.

- [X] T021 [P] Run typecheck for Studio: `pnpm -w turbo run typecheck --filter=studio` (verifies apps/studio/tsconfig.json)
- [ ] T022 [P] Update docs/feature/p0-editor-speckit-commands.md to reflect final implementation decisions (if it diverged)
- [ ] T023 [P] Run the full quickstart.md validation steps in specs/001-fix-transform-zoom/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: Depend on Foundational phase completion
- **Polish (Phase 6)**: Depends on desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 2; no dependency on other stories
- **US2 (P2)**: Depends on Phase 2; can be done after US1 but does not require US3
- **US3 (P3)**: Depends on US1+US2 being done (undo/redo correctness requires drag/resize fixes in place)

---

## Parallel Execution Examples

### Parallel Example: User Story 1

```bash
Task: "T008 [US1] Capture base world position from kernel state on dragStart in apps/studio/src/components/tools/TransformControls.tsx"
Task: "T005 [P] Wire getViewport callback from CanvasView to TransformControls in apps/studio/src/components/CanvasView.tsx"
```

### Parallel Example: User Story 2

```bash
Task: "T013 [US2] Capture base world position and base world size from kernel state on resizeStart in apps/studio/src/components/tools/TransformControls.tsx"
Task: "T014 [US2] Determine final screen width/height from Moveable resizeEnd and convert to world size using current zoom from getViewport() in apps/studio/src/components/tools/TransformControls.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 → Phase 2
2. Implement US1 (Phase 3)
3. **STOP and VALIDATE** using specs/001-fix-transform-zoom/quickstart.md (drag checks)

### Incremental Delivery

1. US1 (drag) → validate
2. US2 (resize) → validate
3. US3 (undo/redo regression) → validate

---

## Notes

- No changes are permitted in `packages/thingsvis-kernel` or `packages/thingsvis-schema` for this feature.
- All committed node geometry must remain in world units; viewport zoom/pan must not be baked into node data.
- Marked [P] tasks are parallelizable (different files / no direct dependencies).
