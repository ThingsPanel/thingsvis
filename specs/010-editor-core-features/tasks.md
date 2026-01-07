# Tasks: Editor Core Features

**Input**: Design documents from `/specs/010-editor-core-features/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Not explicitly requested in the feature specification - test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md, the project structure uses:
- `apps/studio/src/lib/storage/` - Storage layer
- `apps/studio/src/lib/commands/` - Command system
- `apps/studio/src/components/` - UI components
- `apps/studio/src/hooks/` - React hooks
- `apps/preview/src/` - Preview application

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create storage directory structure at apps/studio/src/lib/storage/
- [x] T002 [P] Create commands directory structure at apps/studio/src/lib/commands/
- [x] T003 [P] Verify idb-keyval dependency is installed in apps/studio/package.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Define Zod schemas (ProjectFileSchema, ProjectMetaSchema, CanvasConfigSchema, RecentProjectEntrySchema) in apps/studio/src/lib/storage/schemas.ts
- [x] T005 [P] Define TypeScript types and interfaces (SaveState, PreviewSession) in apps/studio/src/lib/storage/types.ts
- [x] T006 [P] Define Command types (Command, ShortcutKey, CommandCategory) in apps/studio/src/lib/commands/types.ts
- [x] T007 [P] Define storage constants (DB_NAME, RECENT_PROJECTS_KEY, DEBOUNCE_DELAY_MS, etc.) in apps/studio/src/lib/storage/constants.ts
- [x] T008 [P] Define command constants (COMMAND_IDS, DEFAULT_SHORTCUTS) in apps/studio/src/lib/commands/constants.ts
- [x] T009 Implement IndexedDB wrapper for project CRUD operations in apps/studio/src/lib/storage/projectStorage.ts
- [x] T010 Implement CommandRegistry singleton class in apps/studio/src/lib/commands/CommandRegistry.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Auto-Save & Manual Save (Priority: P1) 🎯 MVP

**Goal**: Automatic project saving with 1-second debounce and manual Ctrl+S saving

**Independent Test**: Make changes to canvas, wait 1 second to verify auto-save triggers, press Ctrl+S to verify manual save. Verify data persists in IndexedDB.

### Implementation for User Story 1

- [x] T011 [US1] Implement RecentProjects manager (get, add, remove) in apps/studio/src/lib/storage/recentProjects.ts
- [x] T012 [US1] Implement AutoSaveManager class with debounce and periodic timers in apps/studio/src/lib/storage/autoSave.ts
- [x] T013 [US1] Create useAutoSave React hook for store integration in apps/studio/src/hooks/useAutoSave.ts
- [x] T014 [US1] Create SaveIndicator component showing save status (saving/saved/error) in apps/studio/src/components/SaveIndicator.tsx
- [x] T015 [US1] Register project.save command (Ctrl+S) in apps/studio/src/lib/commands/defaultCommands.ts
- [x] T016 [US1] Integrate useAutoSave hook into main App component in apps/studio/src/App.tsx
- [x] T017 [US1] Add SaveIndicator to editor toolbar in apps/studio/src/components/Toolbar.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Project Management (Priority: P1)

**Goal**: Open recent projects, import/export .thingsvis JSON files

**Independent Test**: Create a project, close editor, reopen, verify project appears in recent list. Export project, import it back, verify it loads correctly.

### Implementation for User Story 2

- [x] T018 [US2] Implement exportAsBlob function for .thingsvis file export in apps/studio/src/lib/storage/projectStorage.ts
- [x] T019 [US2] Implement importFromFile function with Zod validation in apps/studio/src/lib/storage/projectStorage.ts
- [x] T020 [US2] Create ProjectDialog component for open/save dialogs in apps/studio/src/components/ProjectDialog.tsx
- [x] T021 [US2] Create RecentProjectsList component showing recent projects in apps/studio/src/components/RecentProjectsList.tsx
- [x] T022 [US2] Register project.open command (Ctrl+O) in apps/studio/src/lib/commands/defaultCommands.ts
- [x] T023 [US2] Register project.export command (Ctrl+E) in apps/studio/src/lib/commands/defaultCommands.ts
- [x] T024 [US2] Add project menu with Open/Export buttons to toolbar in apps/studio/src/components/Toolbar.tsx
- [x] T025 [US2] Handle File System Access API fallback for browsers without support in apps/studio/src/lib/storage/fileSystem.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Tool Switching Shortcuts (Priority: P2)

**Goal**: Keyboard shortcuts V, R, T, H for quick tool switching

**Independent Test**: Press each shortcut key and verify the corresponding tool becomes active with visual feedback.

### Implementation for User Story 3

- [x] T026 [P] [US3] Implement useKeyboardShortcuts hook with platform detection in apps/studio/src/lib/commands/useKeyboardShortcuts.ts
- [x] T027 [P] [US3] Implement shortcut display utilities (format, isMac) in apps/studio/src/lib/commands/shortcutDisplay.ts
- [x] T028 [US3] Register tool.select command (V key) in apps/studio/src/lib/commands/defaultCommands.ts
- [x] T029 [US3] Register tool.rectangle command (R key) in apps/studio/src/lib/commands/defaultCommands.ts
- [x] T030 [US3] Register tool.text command (T key) in apps/studio/src/lib/commands/defaultCommands.ts
- [x] T031 [US3] Register tool.pan command (H key) in apps/studio/src/lib/commands/defaultCommands.ts
- [x] T032 [US3] Add input field detection to ignore shortcuts when typing in apps/studio/src/lib/commands/useKeyboardShortcuts.ts
- [x] T033 [US3] Integrate useKeyboardShortcuts hook into App component in apps/studio/src/App.tsx

**Checkpoint**: At this point, User Stories 1, 2, and 3 should all work independently

---

## Phase 6: User Story 4 - Undo/Redo Operations (Priority: P2)

**Goal**: Undo with Ctrl+Z and redo with Ctrl+Y using existing HistoryManager

**Independent Test**: Perform actions on canvas, press Ctrl+Z to undo, press Ctrl+Y to redo, verify canvas state changes correctly.

### Implementation for User Story 4

- [x] T034 [US4] Register edit.undo command (Ctrl+Z) connecting to HistoryManager in apps/studio/src/lib/commands/defaultCommands.ts
- [x] T035 [US4] Register edit.redo command (Ctrl+Y) connecting to HistoryManager in apps/studio/src/lib/commands/defaultCommands.ts
- [x] T036 [US4] Add undo/redo buttons with disabled state to toolbar in apps/studio/src/components/Toolbar.tsx
- [x] T037 [US4] Create useHistoryState hook to track canUndo/canRedo state in apps/studio/src/hooks/useHistoryState.ts

**Checkpoint**: At this point, User Stories 1-4 should all work independently

---

## Phase 7: User Story 5 - Preview Mode (Priority: P2)

**Goal**: Preview visualization in new tab with Ctrl+P, fullscreen presentation mode

**Independent Test**: Press Ctrl+P to open preview tab, click fullscreen button to enter fullscreen mode, press Escape to exit.

### Implementation for User Story 5

- [x] T038 [US5] Implement PreviewSessionManager (create, consume, openPreview) in apps/studio/src/lib/storage/previewSession.ts
- [x] T039 [US5] Register project.preview command (Ctrl+P) in apps/studio/src/lib/commands/defaultCommands.ts
- [x] T040 [US5] Create usePreviewMode hook for URL parameter parsing in apps/preview/src/hooks/usePreviewMode.ts
- [x] T041 [US5] Modify App.tsx in preview to support mode switching (dev/user/kiosk) in apps/preview/src/App.tsx
- [x] T042 [P] [US5] Create UserToolbar component for minimal user mode UI in apps/preview/src/components/UserToolbar.tsx
- [x] T043 [P] [US5] Create KioskView component for fullscreen wrapper in apps/preview/src/components/KioskView.tsx
- [x] T044 [US5] Add fullscreen button to editor toolbar in apps/studio/src/components/Toolbar.tsx
- [x] T045 [US5] Consume session token and load project in preview App in apps/preview/src/App.tsx

**Checkpoint**: At this point, User Stories 1-5 should all work independently

---

## Phase 8: User Story 6 - Keyboard Shortcuts Help Panel (Priority: P3)

**Goal**: Press ? key to view help panel showing all available keyboard shortcuts

**Independent Test**: Press ? key, verify modal appears listing all shortcuts, press Escape or click outside to close.

### Implementation for User Story 6

- [x] T046 [US6] Register help.shortcuts command (? key) in apps/studio/src/lib/commands/defaultCommands.ts
- [x] T047 [US6] Create ShortcutHelpPanel component showing categorized shortcuts in apps/studio/src/components/ShortcutHelpPanel.tsx
- [x] T048 [US6] Create useHelpPanel hook to manage open/close state in apps/studio/src/hooks/useHelpPanel.ts
- [x] T049 [US6] Integrate ShortcutHelpPanel into App with ? toggle in apps/studio/src/App.tsx

**Checkpoint**: All user stories should now be independently functional

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T050 [P] Add error handling and retry logic for save failures in apps/studio/src/lib/storage/autoSave.ts
- [x] T051 [P] Add beforeunload handler to warn about unsaved changes in apps/studio/src/lib/storage/autoSave.ts
- [x] T052 [P] Add thumbnail generation for recent projects list in apps/studio/src/lib/storage/thumbnail.ts
- [x] T053 [P] Add Chinese translations (labelZh) to all commands in apps/studio/src/lib/commands/defaultCommands.ts
- [x] T054 Code cleanup and ensure consistent error handling across storage layer
- [x] T055 Run quickstart.md validation scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P1 → P2 → P2 → P2 → P3)
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

| Story | Priority | Depends On | Can Start After |
|-------|----------|------------|-----------------|
| US1 - Auto-Save | P1 | Foundational only | Phase 2 |
| US2 - Project Management | P1 | Foundational only | Phase 2 |
| US3 - Tool Shortcuts | P2 | Foundational only | Phase 2 |
| US4 - Undo/Redo | P2 | Foundational only | Phase 2 |
| US5 - Preview Mode | P2 | US1 (needs project save) | Phase 3 |
| US6 - Help Panel | P3 | US3 (needs commands registered) | Phase 5 |

### Within Each User Story

- Core implementation before integration
- Services before UI components
- Story complete before moving to next priority

### Parallel Opportunities

All tasks marked [P] can run in parallel:

**Phase 1-2 (Setup & Foundational)**:
- T002, T003 (parallel with T001)
- T005, T006, T007, T008 (parallel with T004)

**User Stories**:
- US1, US2, US3, US4 can start in parallel after Foundational
- T026, T027 (parallel - different files)
- T042, T043 (parallel - different components)

**Polish**:
- T050, T051, T052, T053 (all parallel - different files)

---

## Parallel Example: Foundational Phase

```bash
# Launch schema and types in parallel:
Task: T004 "Define Zod schemas in apps/studio/src/lib/storage/schemas.ts"
Task: T005 [P] "Define TypeScript types in apps/studio/src/lib/storage/types.ts"
Task: T006 [P] "Define Command types in apps/studio/src/lib/commands/types.ts"
Task: T007 [P] "Define storage constants in apps/studio/src/lib/storage/constants.ts"
Task: T008 [P] "Define command constants in apps/studio/src/lib/commands/constants.ts"
```

---

## Parallel Example: User Stories 1-4 (After Foundational)

```bash
# With 4 developers, all P1/P2 stories can start in parallel:
Developer A: User Story 1 (Auto-Save) - T011-T017
Developer B: User Story 2 (Project Management) - T018-T025
Developer C: User Story 3 (Tool Shortcuts) - T026-T033
Developer D: User Story 4 (Undo/Redo) - T034-T037
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T010)
3. Complete Phase 3: User Story 1 - Auto-Save (T011-T017)
4. **STOP and VALIDATE**: Test auto-save functionality independently
5. Deploy/demo if ready - users can edit and their work is saved

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (Auto-Save) → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 (Project Management) → Test independently → Deploy/Demo
4. Add User Story 3 (Tool Shortcuts) → Test independently → Deploy/Demo
5. Add User Story 4 (Undo/Redo) → Test independently → Deploy/Demo
6. Add User Story 5 (Preview Mode) → Test independently → Deploy/Demo
7. Add User Story 6 (Help Panel) → Test independently → Deploy/Demo
8. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (1-2 developers)
2. Once Foundational is done:
   - Developer A: User Story 1 (Auto-Save)
   - Developer B: User Story 2 (Project Management)
   - Developer C: User Story 3 (Tool Shortcuts)
   - Developer D: User Story 4 (Undo/Redo)
3. After US1 complete:
   - Developer A: User Story 5 (Preview Mode)
4. After US3 complete:
   - Developer C: User Story 6 (Help Panel)
5. All developers: Polish phase

---

## Notes

- All storage logic stays in `apps/studio` per constitution (not in kernel packages)
- Use existing `idb-keyval` for IndexedDB operations
- Use existing HistoryManager from `@thingsvis/kernel` for undo/redo
- Platform detection for shortcuts: Mac uses ⌘, Windows uses Ctrl
- File format is versioned (`meta.version: '1.0.0'`) for future migrations
- Recent projects capped at 20 entries in localStorage
- Preview uses sessionStorage for one-time tokens (5-minute TTL)
