---

description: "Task list for implementing delete-selected-nodes"
---

# Tasks: Delete Selected Nodes via Delete Key

**Input**: Design documents from `/specs/001-delete-selected-nodes/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Not requested in spec; tasks focus on implementation + manual QA and typecheck.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] T### [P?] [US#?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[US#]**: Which user story this task belongs to
- Every task includes an exact file path (or a doc path for validation tasks)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Ensure the workspace is ready to implement and validate the change.

- [x] T001 Confirm active feature docs are present in specs/001-delete-selected-nodes/{spec.md,plan.md,research.md,quickstart.md}
- [x] T002 Confirm baseline typecheck is green via package scripts in apps/studio/package.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Minimal command-plumbing required before any story behaviors can be delivered.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 Verify `edit.delete` shortcut exists in apps/studio/src/lib/commands/constants.ts
- [x] T004 Add delete-related dependencies to DefaultCommandsDependencies in apps/studio/src/lib/commands/defaultCommands.ts
- [x] T005 Implement Backspace→Delete normalization for shortcut matching in apps/studio/src/lib/commands/useKeyboardShortcuts.ts

**Checkpoint**: Foundation ready — the codebase can safely register and execute an `edit.delete` command.

---

## Phase 3: User Story 1 - Delete selected nodes with keyboard (Priority: P1) 🎯 MVP

**Goal**: Pressing Delete removes the currently selected (unlocked) nodes.

**Independent Test**: Follow the “Delete single selection” and “Delete multi-selection” checks in specs/001-delete-selected-nodes/quickstart.md

### Implementation for User Story 1

- [x] T006 [US1] Register `edit.delete` command in createDefaultCommands in apps/studio/src/lib/commands/defaultCommands.ts
- [x] T007 [US1] Wire delete command dependencies (getKernelState/deleteNodes) in apps/studio/src/components/Editor.tsx
- [x] T008 [US1] Filter locked nodes out of deletion using `state.nodesById[id].locked` in apps/studio/src/lib/commands/defaultCommands.ts
- [X] T009 [US1] Ensure command enablement reflects deletable selection via `when` predicate in apps/studio/src/lib/commands/defaultCommands.ts

**Checkpoint**: User Story 1 is functional and testable independently.

---

## Phase 4: User Story 2 - Delete with no selection is safe (Priority: P2)

**Goal**: Pressing Delete with no selection is a no-op and does not error.

**Independent Test**: Follow the “No selection” check in specs/001-delete-selected-nodes/quickstart.md

### Implementation for User Story 2

- [x] T010 [US2] Ensure `edit.delete` execute handler returns early when selection is empty in apps/studio/src/lib/commands/defaultCommands.ts
- [x] T011 [US2] Verify shortcut does not fire while typing (input/contenteditable) and document the behavior in specs/001-delete-selected-nodes/research.md

**Checkpoint**: User Story 2 is functional and testable independently.

---

## Phase 5: User Story 3 - Delete is undoable and redoable (Priority: P3)

**Goal**: Delete participates in undo/redo; undo restores nodes exactly and redo deletes them again.

**Independent Test**: Follow the “Undo/Redo” check in specs/001-delete-selected-nodes/quickstart.md

### Implementation for User Story 3

- [x] T012 [US3] Verify delete uses kernel store mutation (removeNodes) so zundo tracks it in apps/studio/src/components/Editor.tsx
- [ ] T013 [US3] Manually validate undo/redo restores/deletes correctly and record results in specs/001-delete-selected-nodes/quickstart.md

**Checkpoint**: User Story 3 is functional and testable independently.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and guardrails.

- [x] T014 [P] Run Studio typecheck via package scripts in apps/studio/package.json
- [ ] T015 [P] Run full manual QA checklist and confirm acceptance scenarios in specs/001-delete-selected-nodes/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup completion; BLOCKS all user stories
- **User Stories (Phase 3+)**: Depend on Foundational completion
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 2 (T003–T005)
- **US2 (P2)**: Depends on US1 (shares the same command implementation)
- **US3 (P3)**: Depends on US1 (shares the same command implementation)

### Parallel Opportunities

- Phase 2: `T004` (default command deps) and `T005` (shortcut normalization) can be done in parallel.
- Polish: `T014` and `T015` can be done in parallel if a second person runs manual QA.

---

## Parallel Example: User Story 1

```bash
Task: "Register `edit.delete` command in createDefaultCommands in apps/studio/src/lib/commands/defaultCommands.ts"
Task: "Wire delete command dependencies (getKernelState/deleteNodes) in apps/studio/src/components/Editor.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 → Phase 2
2. Complete US1 tasks (T006–T009)
3. Validate US1 via specs/001-delete-selected-nodes/quickstart.md

### Incremental Delivery

- Add US2 safety checks (T010–T011)
- Add US3 undo/redo validation (T012–T013)
- Finish with polish (T014–T015)
