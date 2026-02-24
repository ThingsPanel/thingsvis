# Tasks: Studio Toolbar Basic Tools

**Input**: Design documents from `/specs/001-toolbar-basic-nodes/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Not explicitly requested in spec, tests are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md, the project structure uses:
- `apps/studio/src/components/tools/` - Creation tool layer
- `apps/studio/src/lib/commands/` - Command system
- `plugins/basic/` - Basic shape plugins (rectangle, circle)
- `plugins/media/` - Media widgets (image)
- `apps/studio/public/registry.json` - Component registry

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create plugin scaffolds and update registry

- [X] T001 Create rectangle plugin scaffold at plugins/basic/rectangle/ (copy structure from plugins/basic/text/)
- [X] T002 [P] Create circle plugin scaffold at plugins/basic/circle/ (copy structure from plugins/basic/text/)
- [X] T003 [P] Create media directory and image plugin scaffold at plugins/media/image/ (copy structure from plugins/basic/text/)
- [X] T004 Register basic/rectangle, basic/circle, media/image in apps/studio/public/registry.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Define NodeCreationSpec type and tool default sizes (Rectangle: 120×80, Circle: 100×100, Text: 200×40, Image: 240×240) in apps/studio/src/components/tools/types.ts
- [X] T006 [P] Add tool.circle command id and shortcut (O key) in apps/studio/src/lib/commands/constants.ts
- [X] T007 [P] Add tool.image command id in apps/studio/src/lib/commands/constants.ts
- [X] T008 Register tool.circle and tool.image commands in apps/studio/src/lib/commands/defaultCommands.ts
- [X] T009 Implement screen-to-world coordinate conversion utility in apps/studio/src/components/tools/coordUtils.ts
- [X] T010 Implement CreateToolLayer skeleton component that listens to pointer events on canvas in apps/studio/src/components/tools/CreateToolLayer.tsx
- [X] T011 Wire CreateToolLayer into CanvasView.tsx so it renders when a creation tool is active in apps/studio/src/components/CanvasView.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create Basic Shapes (Priority: P1) 🎯 MVP

**Goal**: Rectangle and Circle tools allow drag-to-create and click-to-create shapes on canvas

**Independent Test**: Select Rectangle tool, drag on canvas, verify rectangle created at correct bounds. Select Circle tool, click on canvas, verify circle created with default size.

### Implementation for User Story 1

- [X] T012 [US1] Implement rectangle plugin component rendering a basic rectangle in plugins/basic/rectangle/src/index.tsx
- [X] T013 [P] [US1] Implement circle plugin component rendering a basic circle/ellipse in plugins/basic/circle/src/index.tsx
- [X] T014 [US1] Build and export rectangle plugin (ensure dist/ generated) in plugins/basic/rectangle/
- [X] T015 [P] [US1] Build and export circle plugin (ensure dist/ generated) in plugins/basic/circle/
- [X] T016 [US1] Implement drag gesture tracking (pointerDown/Move/Up) with live preview rectangle in apps/studio/src/components/tools/CreateToolLayer.tsx
- [X] T017 [US1] Implement click-vs-drag detection (distance threshold < 5px = click) in apps/studio/src/components/tools/CreateToolLayer.tsx
- [X] T018 [US1] Implement Escape key cancellation during drag gesture in apps/studio/src/components/tools/CreateToolLayer.tsx
- [X] T019 [US1] Implement atomic node creation + selection using kernel store (single history entry) in apps/studio/src/components/tools/CreateToolLayer.tsx
- [X] T020 [US1] Add rectangle-specific creation handler using componentId basic/rectangle in apps/studio/src/components/tools/CreateToolLayer.tsx
- [X] T021 [US1] Add circle-specific creation handler using componentId basic/circle in apps/studio/src/components/tools/CreateToolLayer.tsx
- [X] T022 [US1] Ensure tool remains sticky after creation (no auto-switch to select) in apps/studio/src/components/tools/CreateToolLayer.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional - Rectangle and Circle creation works

---

## Phase 4: User Story 2 - Create and Edit Text (Priority: P2)

**Goal**: Text tool creates text elements that are editable via property panel

**Independent Test**: Select Text tool, click on canvas, verify text element created with default content. Update text in property panel, verify canvas updates.

### Implementation for User Story 2

- [X] T023 [US2] Verify existing basic/text plugin renders correctly and accepts text content prop in plugins/basic/text/src/index.tsx
- [X] T024 [US2] Add text-specific creation handler using componentId basic/text with default content "Text" in apps/studio/src/components/tools/CreateToolLayer.tsx
- [X] T025 [US2] Ensure text node props include editable text content field in apps/studio/src/components/tools/CreateToolLayer.tsx
- [X] T026 [US2] Verify text content is editable via RightPanel property editor in apps/studio/src/components/RightPanel/

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - shapes and text creation functional

---

## Phase 5: User Story 3 - Place Image on Canvas (Priority: P3)

**Goal**: Image tool prompts for image file, then places image element on canvas

**Independent Test**: Select Image tool, choose image file, click/drag on canvas, verify image element created. Cancel picker, verify no element created.

### Implementation for User Story 3

- [X] T027 [US3] Implement image plugin component rendering an img element from dataUrl prop in plugins/media/image/src/index.tsx
- [X] T028 [US3] Build and export image plugin (ensure dist/ generated) in plugins/media/image/
- [X] T029 [US3] Implement file picker utility for image selection (accept image/*) in apps/studio/src/components/tools/imagePicker.ts
- [X] T030 [US3] Implement file-to-dataURL conversion utility in apps/studio/src/components/tools/imagePicker.ts
- [X] T031 [US3] Add image-specific creation flow: trigger picker on tool activation, store dataUrl in pending state in apps/studio/src/components/tools/CreateToolLayer.tsx
- [X] T032 [US3] Handle picker cancellation (reset to select tool, no node created) in apps/studio/src/components/tools/CreateToolLayer.tsx
- [X] T033 [US3] Handle picker error (invalid file, show toast notification) in apps/studio/src/components/tools/CreateToolLayer.tsx
- [X] T034 [US3] Add image-specific creation handler using componentId media/image with dataUrl prop in apps/studio/src/components/tools/CreateToolLayer.tsx
- [X] T035 [US3] Calculate image default size preserving aspect ratio within 240×240 bounding box in apps/studio/src/components/tools/CreateToolLayer.tsx

**Checkpoint**: At this point, all user stories (1-3) should be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T036 [P] Add minimum size enforcement (avoid near-zero bounds) for all creation tools in apps/studio/src/components/tools/CreateToolLayer.tsx
- [X] T037 [P] Add preview styling (dashed border, semi-transparent fill) during drag in apps/studio/src/components/tools/CreateToolLayer.tsx
- [X] T038 [P] Add Chinese labels (labelZh) to tool.circle and tool.image commands in apps/studio/src/lib/commands/defaultCommands.ts
- [X] T039 Verify component catalog shows correct categorization (Basic: rectangle/circle/text, Media: image) in apps/studio/src/components/LeftPanel/
- [X] T040 Run pnpm -w turbo run typecheck --filter=studio to verify type safety
- [X] T041 Run quickstart.md manual QA checklist to validate all acceptance scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

| Story | Priority | Depends On | Can Start After |
|-------|----------|------------|-----------------|
| US1 - Basic Shapes | P1 | Foundational + plugins built | Phase 2 |
| US2 - Text | P2 | Foundational (uses existing basic/text) | Phase 2 |
| US3 - Image | P3 | Foundational + image plugin built | Phase 2 |

### Within Each User Story

- Plugin implementation before Studio integration
- Plugin build before Studio can load it
- Core gesture handling before tool-specific handlers
- Story complete before moving to next priority

### Parallel Opportunities

All tasks marked [P] can run in parallel:

**Phase 1 (Setup)**:
- T001, T002, T003 (all plugin scaffolds can be created in parallel)

**Phase 2 (Foundational)**:
- T006, T007 (command constants in same file but additive)

**User Stories**:
- T012, T013 (rectangle and circle plugins are independent)
- T014, T015 (plugin builds are independent)
- US1, US2, US3 can start in parallel after Foundational (if team capacity allows)

**Polish**:
- T036, T037, T038 (all different concerns)

---

## Parallel Example: Plugin Creation (Phase 1)

```bash
# Launch all plugin scaffolds in parallel:
Task: T001 "Create rectangle plugin scaffold at plugins/basic/rectangle/"
Task: T002 [P] "Create circle plugin scaffold at plugins/basic/circle/"
Task: T003 [P] "Create image plugin scaffold at plugins/media/image/"
```

---

## Parallel Example: User Story 1 Implementation

```bash
# Launch plugin implementations in parallel:
Task: T012 "Implement rectangle plugin component in plugins/basic/rectangle/src/index.tsx"
Task: T013 [P] "Implement circle plugin component in plugins/basic/circle/src/index.tsx"

# Then build plugins in parallel:
Task: T014 "Build rectangle plugin"
Task: T015 [P] "Build circle plugin"

# Then sequential gesture/creation logic:
Task: T016-T022 (sequential, same file)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T011)
3. Complete Phase 3: User Story 1 - Basic Shapes (T012-T022)
4. **STOP and VALIDATE**: Test rectangle and circle creation
5. Deploy/demo if ready - users can create shapes on canvas!

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (Basic Shapes) → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 (Text) → Test independently → Deploy/Demo
4. Add User Story 3 (Image) → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Rectangle/Circle)
   - Developer B: User Story 2 (Text - may be quick if basic/text already works)
   - Developer C: User Story 3 (Image)
3. All developers: Polish phase

---

## Summary

| Phase | Tasks | Parallel Opportunities |
|-------|-------|------------------------|
| Setup | 4 | 3 |
| Foundational | 7 | 3 |
| US1 Basic Shapes | 11 | 4 |
| US2 Text | 4 | 0 |
| US3 Image | 9 | 0 |
| Polish | 6 | 3 |
| **Total** | **41** | **13** |

---

## Notes

- All creation UI code goes in `apps/studio/src/components/tools/` (not in kernel)
- Plugins are independent packages under `plugins/` with their own build
- Use existing `activeTool` state and command system - don't reinvent
- Node creation must be atomic with selection for proper undo/redo
- Image data stored as dataUrl in node props for MVP (no asset library)
- Tool is "sticky" - remains active after creation for repeated use
- Default sizes per spec: Rectangle 120×80, Circle 100×100, Text 200×40, Image 240×240 (aspect-fit)
