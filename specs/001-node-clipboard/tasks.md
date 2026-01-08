---

description: "Task list for feature implementation"
---

# Tasks: Copy, Paste, Duplicate Nodes

**Input**: Design documents from `/specs/001-node-clipboard/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Not requested in spec.md; use manual QA in quickstart.md + Studio typecheck.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- All tasks include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align on feature docs and identify wiring points in Studio.

- [X] T001 Confirm acceptance criteria in specs/001-node-clipboard/spec.md
- [X] T002 Confirm implementation approach and constraints in specs/001-node-clipboard/plan.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared plumbing needed before implementing any user story commands.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [X] T003 Add `edit.duplicate` command id + default shortcut in apps/studio/src/lib/commands/constants.ts
- [X] T004 [P] Create in-memory clipboard module in apps/studio/src/lib/clipboard.ts (ClipboardPayload, paste counter, id generation, offset helpers)
- [X] T005 Extend Studio command dependencies in apps/studio/src/lib/commands/defaultCommands.ts (add `getKernelState` + `applyNodeInsertAndSelect` to dependency type)
- [X] T006 [P] Wire `getKernelState` dependency in apps/studio/src/components/Editor.tsx when calling registerDefaultCommands(...)
- [X] T007 Implement atomic `applyNodeInsertAndSelect` in apps/studio/src/components/Editor.tsx using a single kernel store `setState` update (nodes + selection together)

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 - Copy Selected Nodes (Priority: P1) 🎯 MVP

**Goal**: Copy currently selected nodes into an internal clipboard via Ctrl/⌘+C.

**Independent Test**: Use specs/001-node-clipboard/quickstart.md step 1 (Copy single selection) and verify it is a no-op with empty selection.

- [X] T008 [US1] Implement `copyNodes(...)` + `readClipboard()` in apps/studio/src/lib/clipboard.ts (reset paste counter only on successful copy)
- [X] T009 [US1] Implement `edit.copy` command in apps/studio/src/lib/commands/defaultCommands.ts (read selection via `getKernelState()`; no selection → no-op)
- [X] T010 [US1] Manually verify input safety scenario using specs/001-node-clipboard/quickstart.md step 9

**Checkpoint**: Copy works, does not interfere with text inputs.

---

## Phase 4: User Story 2 - Paste Nodes With Deterministic Offset (Priority: P1)

**Goal**: Paste copied nodes via Ctrl/⌘+V, creating new ids, preserving relative layout, applying deterministic $(20n, 20n)$ offset, and selecting the pasted nodes.

**Independent Test**: Use specs/001-node-clipboard/quickstart.md steps 2, 3, 5, and 6.

- [X] T011 [US2] Implement `nextPasteOffset()` + `makePastedNodes(...)` in apps/studio/src/lib/clipboard.ts (increment counter on each paste; apply offset to all pasted nodes)
- [X] T012 [US2] Implement `edit.paste` command in apps/studio/src/lib/commands/defaultCommands.ts (empty clipboard → no-op; else create nodes and call `applyNodeInsertAndSelect`)
- [X] T013 [US2] Ensure pasted copies are unlocked via node runtime defaults in apps/studio/src/components/Editor.tsx (do not set `locked: true` for created node states)

**Checkpoint**: Paste creates new nodes with correct offsets and selection.

---

## Phase 5: User Story 3 - Duplicate Selection (Priority: P1)

**Goal**: Duplicate current selection via Ctrl/⌘+D in one action, using the same deterministic offset behavior.

**Independent Test**: Use specs/001-node-clipboard/quickstart.md step 4 (Duplicate selection) plus multi-node relative layout from step 6.

- [X] T014 [US3] Add a non-mutating snapshot helper for duplication in apps/studio/src/lib/clipboard.ts (build payload from selection without overwriting clipboard)
- [X] T015 [US3] Implement `edit.duplicate` command in apps/studio/src/lib/commands/defaultCommands.ts (empty selection → no-op; else create nodes with `nextPasteOffset()` and call `applyNodeInsertAndSelect`)

**Checkpoint**: Duplicate works and does not require a prior Copy.

---

## Phase 6: User Story 4 - Undo/Redo For Paste & Duplicate (Priority: P2)

**Goal**: Undo/redo for paste/duplicate restores nodes and selection predictably.

**Independent Test**: Use specs/001-node-clipboard/quickstart.md step 8 (Undo/Redo) and confirm redo re-selects the created nodes.

- [X] T016 [US4] Validate paste/duplicate are a single history-visible operation by ensuring apps/studio/src/lib/commands/defaultCommands.ts only uses `applyNodeInsertAndSelect` (no separate selection-only mutation)
- [X] T017 [US4] Manually verify redo restores selection per specs/001-node-clipboard/quickstart.md step 8; adjust apps/studio/src/components/Editor.tsx atomic update if needed

**Checkpoint**: Undo removes created nodes; redo recreates them and selects them.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validate end-to-end behavior and keep docs consistent.

- [X] T018 [P] Run Studio typecheck via scripts in apps/studio/package.json (`pnpm -w turbo run typecheck --filter=studio`)
- [X] T019 Run full manual QA checklist in specs/001-node-clipboard/quickstart.md and update that file if any steps are inaccurate

---

## Dependencies & Execution Order

### User Story Completion Order

- **Foundational (Phase 2)** blocks everything.
- **US1 (Copy)** should be completed before **US2 (Paste)** to make paste testable via normal workflow.
- **US3 (Duplicate)** depends on Foundational but is otherwise independent of US1/US2.
- **US4 (Undo/Redo)** depends on US2 and/or US3 being implemented.

Suggested order:

1) Phase 1 → Phase 2
2) US1 (P1)
3) US2 (P1)
4) US3 (P1)
5) US4 (P2)
6) Polish

### Parallel Opportunities

- Phase 2 can be parallelized across different files: apps/studio/src/lib/commands/constants.ts, apps/studio/src/lib/clipboard.ts, apps/studio/src/components/Editor.tsx.
- After Phase 2:
  - US1 work in apps/studio/src/lib/commands/defaultCommands.ts can proceed while clipboard internals are finalized, as long as exported APIs are stable.
  - US3 can proceed in parallel with US1/US2 once clipboard helpers exist.

---

## Parallel Example: Foundational Phase

```bash
Task: "Add `edit.duplicate` command id + default shortcut in apps/studio/src/lib/commands/constants.ts"
Task: "Create in-memory clipboard module in apps/studio/src/lib/clipboard.ts (ClipboardPayload, paste counter, id generation, offset helpers)"
Task: "Implement atomic `applyNodeInsertAndSelect` in apps/studio/src/components/Editor.tsx using a single kernel store `setState` update (nodes + selection together)"
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Complete Phase 1 + Phase 2
2. Implement US1 (Copy)
3. Implement US2 (Paste)
4. Validate via specs/001-node-clipboard/quickstart.md steps 1–3, 5–6

### Incremental Delivery

- Add US3 (Duplicate) next, validate via quickstart steps 4 and 6.
- Add US4 (Undo/Redo) last, validate via quickstart step 8.
