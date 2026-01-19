# Tasks: 栅格布局系统（Gridstack 风格）

**Input**: Design documents from `/specs/002-grid-layout/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Not explicitly requested in feature specification - test tasks are NOT included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md structure:
- Schema: `packages/thingsvis-schema/src/`
- Kernel: `packages/thingsvis-kernel/src/`
- UI: `packages/thingsvis-ui/src/`
- Studio: `apps/studio/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create base directory structure and export files for grid layout module

- [X] T001 Create grid schema directory structure at packages/thingsvis-schema/src/grid/
- [X] T002 Create grid kernel directory structure at packages/thingsvis-kernel/src/grid/
- [X] T003 [P] Create grid UI directory structure at packages/thingsvis-ui/src/engine/grid/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Schema Layer (packages/thingsvis-schema)

- [X] T004 [P] Create GridSettingsSchema with defaults in packages/thingsvis-schema/src/grid/grid-settings.ts
- [X] T005 [P] Create BreakpointConfigSchema in packages/thingsvis-schema/src/grid/grid-settings.ts
- [X] T006 [P] Create GridPositionSchema with constraints in packages/thingsvis-schema/src/grid/grid-position.ts
- [X] T007 Create grid schema index exports in packages/thingsvis-schema/src/grid/index.ts
- [X] T008 Extend LayoutModeSchema to add 'grid' mode in packages/thingsvis-schema/src/page.ts
- [X] T009 Extend PageConfigSchema to include optional gridSettings in packages/thingsvis-schema/src/page.ts
- [X] T010 Extend VisualComponentSchema to include optional grid field in packages/thingsvis-schema/src/component.ts

### Kernel Layer (packages/thingsvis-kernel)

- [X] T011 [P] Create GridItem and GridLayoutResult types in packages/thingsvis-kernel/src/grid/types.ts
- [X] T012 [P] Create GridLayoutError class in packages/thingsvis-kernel/src/grid/errors.ts
- [X] T013 Implement GridSystem.detectCollision static method in packages/thingsvis-kernel/src/grid/GridCollision.ts
- [X] T014 Implement GridSystem.compact static method in packages/thingsvis-kernel/src/grid/GridCompaction.ts
- [X] T015 Implement GridSystem.resolveCollisions static method in packages/thingsvis-kernel/src/grid/GridCollision.ts
- [X] T016 Implement GridSystem.moveItem static method in packages/thingsvis-kernel/src/grid/GridSystem.ts
- [X] T017 Implement GridSystem.resizeItem static method in packages/thingsvis-kernel/src/grid/GridSystem.ts
- [X] T018 Implement GridSystem.previewMove static method in packages/thingsvis-kernel/src/grid/GridSystem.ts
- [X] T019 Create grid kernel index exports in packages/thingsvis-kernel/src/grid/index.ts
- [X] T020 Extend CanvasState interface to include gridState in packages/thingsvis-kernel/src/store/KernelStore.ts
- [X] T021 Add GridState interface definition in packages/thingsvis-kernel/src/store/KernelStore.ts
- [X] T022 Add setGridSettings action to KernelStore in packages/thingsvis-kernel/src/store/KernelStore.ts
- [X] T023 Add moveGridItem action to KernelStore in packages/thingsvis-kernel/src/store/KernelStore.ts
- [X] T024 Add resizeGridItem action to KernelStore in packages/thingsvis-kernel/src/store/KernelStore.ts
- [X] T025 Add compactGrid action to KernelStore in packages/thingsvis-kernel/src/store/KernelStore.ts
- [X] T026 Add setGridPreview action to KernelStore in packages/thingsvis-kernel/src/store/KernelStore.ts

### UI Layer (packages/thingsvis-ui)

- [X] T027 [P] Implement calculateColWidth utility in packages/thingsvis-ui/src/utils/grid-mapper.ts
- [X] T028 [P] Implement gridToPixel coordinate mapper in packages/thingsvis-ui/src/utils/grid-mapper.ts
- [X] T029 [P] Implement pixelToGrid coordinate mapper in packages/thingsvis-ui/src/utils/grid-mapper.ts
- [X] T030 Implement snapToGrid utility in packages/thingsvis-ui/src/utils/grid-mapper.ts
- [X] T031 Implement getActiveBreakpoint utility in packages/thingsvis-ui/src/utils/grid-mapper.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - 栅格拖拽与吸附 (Priority: P1) 🎯 MVP

**Goal**: Enable designers to drag components on the canvas with automatic grid cell snapping for quick, precise alignment without manual adjustment.

**Independent Test**: Drag a single component onto an empty canvas in grid mode and observe if it snaps to grid cells with placeholder feedback.

### Implementation for User Story 1

- [X] T032 [P] [US1] Implement GridOverlay component for background grid lines in packages/thingsvis-ui/src/engine/grid/GridOverlay.ts
- [X] T033 [P] [US1] Implement GridPlaceholder component for drag feedback in packages/thingsvis-ui/src/engine/grid/GridPlaceholder.ts
- [X] T034 [US1] Add grid overlay rendering to VisualEngine (background layer) in packages/thingsvis-ui/src/engine/VisualEngine.ts
- [X] T035 [US1] Add placeholder rendering to VisualEngine (overlay layer) in packages/thingsvis-ui/src/engine/VisualEngine.ts
- [X] T036 [US1] Create useGridLayout hook for grid interactions in packages/thingsvis-ui/src/hooks/useGridLayout.ts
- [X] T037 [US1] Extend drag handler to call pixelToGrid and show grid placeholder in packages/thingsvis-ui/src/hooks/useGridLayout.ts
- [X] T038 [US1] Handle drag end to commit grid position via moveGridItem action in packages/thingsvis-ui/src/hooks/useGridLayout.ts
- [X] T039 [US1] Integrate grid mode detection in CanvasView component in apps/studio/src/components/CanvasView.tsx
- [X] T040 [US1] Add grid mode conditional rendering in CanvasView in apps/studio/src/components/CanvasView.tsx
- [X] T041 [US1] Add smooth transition animation (200-300ms ease-out) for component snap in packages/thingsvis-ui/src/engine/grid/GridPlaceholder.ts

**Checkpoint**: User Story 1 complete - drag and snap should work with placeholder feedback on empty canvas

---

## Phase 4: User Story 2 - 组件缩放与栅格对齐 (Priority: P1)

**Goal**: Enable designers to resize components with edges snapping to grid boundaries, ensuring components always occupy complete grid cells.

**Independent Test**: Resize a component by dragging its corner/edge and observe if size changes in whole column/row increments.

### Implementation for User Story 2

- [ ] T042 [P] [US2] Create GridTransformControls component for grid-aware resize handles in apps/studio/src/components/tools/GridTransformControls.tsx
- [X] T043 [US2] Extend resize handler to convert pixel deltas to grid size changes in packages/thingsvis-ui/src/hooks/useGridLayout.ts
- [X] T044 [US2] Handle resize end to commit via resizeGridItem action in packages/thingsvis-ui/src/hooks/useGridLayout.ts
- [X] T045 [US2] Add minimum size enforcement (1 column, 1 row) in resize handler in packages/thingsvis-ui/src/hooks/useGridLayout.ts
- [X] T046 [US2] Show resize preview placeholder during drag in packages/thingsvis-ui/src/engine/grid/GridPlaceholder.ts
- [ ] T047 [US2] Integrate GridTransformControls in grid mode selection in apps/studio/src/components/CanvasView.tsx

**Checkpoint**: User Story 2 complete - resize should snap to grid cells with minimum size enforcement

---

## Phase 5: User Story 3 - 垂直压缩与自动挤压 (Priority: P1)

**Goal**: Automatically move existing components downward when a component is placed in an occupied area, and float components upward to fill gaps after deletion.

**Independent Test**: Place a component on top of an existing component and observe if the existing one pushes down automatically.

### Implementation for User Story 3

- [X] T048 [US3] Wire moveGridItem action to call GridSystem.moveItem with collision resolution in packages/thingsvis-kernel/src/store/KernelStore.ts
- [X] T049 [US3] Wire resizeGridItem action to call GridSystem.resizeItem with collision resolution in packages/thingsvis-kernel/src/store/KernelStore.ts
- [X] T050 [US3] Add automatic compaction after node deletion in KernelStore in packages/thingsvis-kernel/src/store/KernelStore.ts
- [X] T051 [US3] Implement real-time collision preview using previewMove during drag in packages/thingsvis-ui/src/hooks/useGridLayout.ts
- [X] T052 [US3] Show affected components' target positions as ghost overlays in packages/thingsvis-ui/src/engine/grid/GridPlaceholder.ts
- [ ] T053 [US3] Add smooth push-down animation for affected components in packages/thingsvis-ui/src/engine/VisualEngine.ts
- [ ] T054 [US3] Add compaction animation when gaps are filled in packages/thingsvis-ui/src/engine/VisualEngine.ts

**Checkpoint**: User Story 3 complete - collision detection, push-down, and vertical compaction should work with animations

---

## Phase 6: User Story 4 - 响应式容器自适应 (Priority: P2)

**Goal**: Automatically adjust component widths proportionally when the container/canvas width changes, maintaining relative layout.

**Independent Test**: Resize the browser window and observe if components maintain their column proportions.

### Implementation for User Story 4

- [X] T055 [P] [US4] Add container width listener in VisualEngine in packages/thingsvis-ui/src/engine/VisualEngine.ts
- [X] T056 [US4] Recalculate colWidth and re-derive pixel positions on container resize in packages/thingsvis-ui/src/engine/VisualEngine.ts
- [X] T057 [US4] Update gridState.containerWidth and colWidth in KernelStore on resize in packages/thingsvis-kernel/src/store/KernelStore.ts
- [ ] T058 [US4] Add transition animation for responsive resizing (300ms) in packages/thingsvis-ui/src/engine/VisualEngine.ts
- [ ] T059 [US4] Emit grid.layout.changed event after resize recalculation in packages/thingsvis-kernel/src/store/KernelStore.ts

**Checkpoint**: User Story 4 complete - layout should respond to container width changes proportionally

---

## Phase 7: User Story 5 - 移动端降列堆叠 (Priority: P2)

**Goal**: Automatically switch to reduced column count (e.g., 1-2 columns) on mobile screens, stacking components vertically.

**Independent Test**: Simulate mobile screen width (<768px) and observe if components stack vertically in single column.

### Implementation for User Story 5

- [X] T060 [P] [US5] Export DEFAULT_BREAKPOINTS constant in packages/thingsvis-schema/src/grid/grid-settings.ts
- [X] T061 [US5] Detect active breakpoint on container resize and update effectiveCols in packages/thingsvis-ui/src/utils/grid-mapper.ts
- [X] T062 [US5] Recalculate grid layout when effectiveCols changes in packages/thingsvis-kernel/src/store/KernelStore.ts
- [X] T063 [US5] Clamp component widths to new column count on breakpoint change in packages/thingsvis-kernel/src/grid/GridSystem.ts
- [X] T064 [US5] Re-run compaction after breakpoint change in packages/thingsvis-kernel/src/store/KernelStore.ts
- [ ] T065 [US5] Emit grid.breakpoint.changed event with previous/new cols in packages/thingsvis-kernel/src/store/KernelStore.ts
- [X] T066 [US5] Add breakpoint-aware sorting (by y then x) for stacking order in packages/thingsvis-kernel/src/grid/GridCompaction.ts

**Checkpoint**: User Story 5 complete - mobile breakpoints should trigger column reduction and vertical stacking

---

## Phase 8: User Story 6 - 栅格参数配置 (Priority: P2)

**Goal**: Allow designers to customize grid parameters (columns, row height, gap) to fit different project needs.

**Independent Test**: Open grid settings panel, modify column count, and observe if grid lines update immediately.

### Implementation for User Story 6

- [ ] T067 [P] [US6] Create GridSettingsPanel component in apps/studio/src/pages/settings/GridSettingsPanel.tsx
- [ ] T068 [US6] Add form controls for cols, rowHeight, gap in GridSettingsPanel in apps/studio/src/pages/settings/GridSettingsPanel.tsx
- [ ] T069 [US6] Add toggle for showGridLines in GridSettingsPanel in apps/studio/src/pages/settings/GridSettingsPanel.tsx
- [ ] T070 [US6] Add toggle for compactVertical in GridSettingsPanel in apps/studio/src/pages/settings/GridSettingsPanel.tsx
- [ ] T071 [US6] Add responsive breakpoint editor in GridSettingsPanel in apps/studio/src/pages/settings/GridSettingsPanel.tsx
- [ ] T072 [US6] Connect GridSettingsPanel to setGridSettings action in apps/studio/src/pages/settings/GridSettingsPanel.tsx
- [ ] T073 [US6] Recalculate component positions when column count changes in packages/thingsvis-kernel/src/store/KernelStore.ts
- [ ] T074 [US6] Integrate GridSettingsPanel into page settings area in apps/studio/src/components/CanvasView.tsx

**Checkpoint**: User Story 6 complete - grid configuration should be customizable via settings panel

---

## Phase 9: User Story 7 - 数据模型迁移 (Priority: P3)

**Goal**: Enable automatic conversion of existing pixel-positioned layouts to grid coordinates for seamless upgrade.

**Independent Test**: Load an old pixel-based page, switch to grid mode, and observe if components convert to valid grid positions.

### Implementation for User Story 7

- [ ] T075 [P] [US7] Implement migratePixelToGrid utility function in packages/thingsvis-kernel/src/grid/GridMigration.ts
- [ ] T076 [US7] Add migrateToGrid action for single node migration in packages/thingsvis-kernel/src/store/KernelStore.ts
- [ ] T077 [US7] Add migrateAllToGrid action for batch migration in packages/thingsvis-kernel/src/store/KernelStore.ts
- [ ] T078 [US7] Create MigrationRecord type for tracking original px values in packages/thingsvis-kernel/src/grid/types.ts
- [ ] T079 [US7] Store migration record on nodes for potential rollback in packages/thingsvis-kernel/src/store/KernelStore.ts
- [ ] T080 [US7] Add migration prompt dialog when switching page to grid mode in apps/studio/src/pages/settings/GridSettingsPanel.tsx
- [ ] T081 [US7] Run compaction after migration to clean up layout in packages/thingsvis-kernel/src/store/KernelStore.ts

**Checkpoint**: User Story 7 complete - legacy pixel layouts should migrate to grid coordinates with fallback support

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T082 [P] Add JSDoc comments to all public GridSystem methods in packages/thingsvis-kernel/src/grid/
- [ ] T083 [P] Add JSDoc comments to all CoordinateMapper functions in packages/thingsvis-ui/src/utils/grid-mapper.ts
- [ ] T084 [P] Update quickstart.md with final implementation details in specs/002-grid-layout/quickstart.md
- [ ] T085 Performance optimization: debounce preview calculations during drag in packages/thingsvis-ui/src/hooks/useGridLayout.ts
- [ ] T086 Performance optimization: batch state updates for multi-item moves in packages/thingsvis-kernel/src/store/KernelStore.ts
- [ ] T087 Performance optimization: virtual grid lines rendering (viewport only) in packages/thingsvis-ui/src/engine/grid/GridOverlay.ts
- [ ] T088 Add grid.layout.changed, grid.settings.changed event emissions in packages/thingsvis-kernel/src/store/KernelStore.ts
- [ ] T089 Add grid.preview.updated event emission during drag in packages/thingsvis-kernel/src/store/KernelStore.ts
- [ ] T090 Run pnpm typecheck for thingsvis-schema, thingsvis-kernel, thingsvis-ui packages
- [ ] T091 Validate all acceptance scenarios from quickstart.md in Studio

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-9)**: All depend on Foundational phase completion
- **Polish (Phase 10)**: Depends on all desired user stories being complete

### User Story Dependencies

| Story | Priority | Can Start After | Independent? |
|-------|----------|-----------------|--------------|
| US1 - 栅格拖拽与吸附 | P1 | Foundational | ✅ Yes |
| US2 - 组件缩放与栅格对齐 | P1 | Foundational | ✅ Yes (shares hooks with US1) |
| US3 - 垂直压缩与自动挤压 | P1 | Foundational | ✅ Yes (uses GridSystem from foundational) |
| US4 - 响应式容器自适应 | P2 | Foundational | ✅ Yes |
| US5 - 移动端降列堆叠 | P2 | Foundational | ✅ Yes (builds on breakpoint config) |
| US6 - 栅格参数配置 | P2 | Foundational | ✅ Yes |
| US7 - 数据模型迁移 | P3 | Foundational | ✅ Yes |

### Within Each User Story

- Models/schemas before services/engines
- Core logic before UI integration
- Kernel actions before UI hooks
- Rendering before interaction handling

### Parallel Opportunities

**Phase 1-2 (Foundation)**:
- T004, T005, T006 can run in parallel (different schema files)
- T011, T012 can run in parallel (different kernel files)
- T027, T028, T029 can run in parallel (same file but independent functions)

**Phase 3+ (User Stories)**:
- All user stories can be worked on in parallel after foundation is complete
- Within each story, tasks marked [P] can run in parallel

---

## Parallel Example: Foundation Phase

```bash
# Launch all schema tasks together:
T004: "Create GridSettingsSchema in packages/thingsvis-schema/src/grid/grid-settings.ts"
T005: "Create BreakpointConfigSchema in packages/thingsvis-schema/src/grid/grid-settings.ts"
T006: "Create GridPositionSchema in packages/thingsvis-schema/src/grid/grid-position.ts"

# Launch all kernel type tasks together:
T011: "Create GridItem types in packages/thingsvis-kernel/src/grid/types.ts"
T012: "Create GridLayoutError in packages/thingsvis-kernel/src/grid/errors.ts"
```

## Parallel Example: User Story 1

```bash
# After foundation, launch US1 parallel tasks:
T032: "Implement GridOverlay in packages/thingsvis-ui/src/engine/grid/GridOverlay.ts"
T033: "Implement GridPlaceholder in packages/thingsvis-ui/src/engine/grid/GridPlaceholder.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1-3 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Drag & Snap)
4. Complete Phase 4: User Story 2 (Resize & Snap)
5. Complete Phase 5: User Story 3 (Collision & Compaction)
6. **STOP and VALIDATE**: Basic Gridstack-style layout should work
7. Deploy/demo if ready - this is the core MVP

### Incremental Delivery

| Increment | Stories | Value Delivered |
|-----------|---------|-----------------|
| MVP | US1 + US2 + US3 | Core Gridstack interaction |
| Release 2 | + US4 + US6 | Responsive + configurable |
| Release 3 | + US5 | Mobile support |
| Release 4 | + US7 | Legacy migration |

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 + 2 (core interactions)
   - Developer B: User Story 3 (collision engine)
   - Developer C: User Story 6 (settings UI)
3. After core is stable:
   - Developer A: User Story 4 (responsive)
   - Developer B: User Story 5 (mobile)
   - Developer C: User Story 7 (migration)

---

## Notes

- All new code in `packages/thingsvis-kernel/src/grid/` must be UI-free (Constitution Principle I)
- All schemas use Zod with proper defaults (Constitution Principle II)
- Grid coordinates are source of truth; pixel positions are derived (Research Decision 2)
- Smooth transitions: 200-300ms with ease-out (Assumptions from spec.md)
- Target performance: ≥50 FPS with 50 nodes, <50ms placeholder feedback (plan.md)
- No breaking changes to fixed/infinite layout modes (Constitution Principle IV)
