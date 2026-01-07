# Feature Specification: Editor Core Features (编辑器核心功能)

**Feature Branch**: `010-editor-core-features`  
**Created**: 2026-01-06  
**Status**: Draft  
**Input**: User description: "编辑器核心功能：自动保存、项目管理、快捷键、预览模式"

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Auto-Save & Manual Save (Priority: P1)

As a user, I can have my project automatically saved 1 second after any content change, and I can also manually save using Ctrl+S. All data is persisted to browser local storage (IndexedDB).

**Why this priority**: Data persistence is the most critical feature—without it, users lose their work. This is the foundation that enables all other editing features to be useful.

**Independent Test**: Can be fully tested by making changes to the canvas, waiting 1 second to verify auto-save triggers, and pressing Ctrl+S to verify manual save. Value delivered: users never lose their work.

**Acceptance Scenarios**:

1. **Given** I have made changes to my project, **When** 1 second passes without further changes, **Then** the project is automatically saved to local storage
2. **Given** I am editing my project, **When** I press Ctrl+S, **Then** the project is immediately saved to local storage
3. **Given** auto-save is in progress, **When** I press Ctrl+S, **Then** the manual save takes precedence and completes
4. **Given** I have unsaved changes, **When** the save completes successfully, **Then** I see a visual confirmation (e.g., "Saved" indicator)
5. **Given** a save operation fails, **When** the error occurs, **Then** I see an error notification and the system retries automatically

---

### User Story 2 - Project Management (Priority: P1)

As a user, I can open a list of my recent projects, or import a .thingsvis JSON file to continue working on an existing visualization.

**Why this priority**: Users need to access their previous work and import projects. This is essential for any practical use of the editor beyond single-session work.

**Independent Test**: Can be fully tested by creating a project, closing the editor, reopening, and verifying the project appears in recent projects list. Also test by exporting a project, then importing it back.

**Acceptance Scenarios**:

1. **Given** I have previously saved projects, **When** I open the recent projects list, **Then** I see my projects sorted by last modified date (most recent first)
2. **Given** I am viewing the recent projects list, **When** I click on a project, **Then** the project opens in the editor
3. **Given** I have a .thingsvis JSON file, **When** I import it, **Then** the project loads and displays correctly in the editor
4. **Given** I import an invalid or corrupted JSON file, **When** the import fails, **Then** I see a clear error message explaining the problem
5. **Given** the browser does not support File System Access API, **When** I want to import/export, **Then** the system falls back to standard file download/upload dialogs

---

### User Story 3 - Tool Switching Shortcuts (Priority: P2)

As a user, I can use keyboard shortcuts to quickly switch between editing tools: V for Select, R for Rectangle, T for Text, and H for Pan/Hand tool.

**Why this priority**: Keyboard shortcuts significantly improve editing efficiency. While the editor is usable without them (via toolbar clicks), power users depend on shortcuts for productive work.

**Independent Test**: Can be fully tested by pressing each shortcut key and verifying the corresponding tool becomes active, with visual feedback showing the current tool.

**Acceptance Scenarios**:

1. **Given** I am in the editor, **When** I press V, **Then** the Select tool becomes active and the cursor changes accordingly
2. **Given** I am in the editor, **When** I press R, **Then** the Rectangle drawing tool becomes active
3. **Given** I am in the editor, **When** I press T, **Then** the Text tool becomes active
4. **Given** I am in the editor, **When** I press H, **Then** the Pan/Hand tool becomes active for canvas navigation
5. **Given** I am typing in a text input field, **When** I press any tool shortcut, **Then** the shortcut is ignored and the character is typed normally

---

### User Story 4 - Undo/Redo Operations (Priority: P2)

As a user, I can undo my last action with Ctrl+Z and redo with Ctrl+Y to correct mistakes or restore changes.

**Why this priority**: Undo/redo is essential for a forgiving editing experience. Users expect this standard functionality and it enables confident experimentation.

**Independent Test**: Can be fully tested by performing actions, pressing Ctrl+Z to undo, and Ctrl+Y to redo, verifying the canvas state changes correctly each time.

**Acceptance Scenarios**:

1. **Given** I have performed an action on the canvas, **When** I press Ctrl+Z, **Then** the action is undone and the canvas returns to its previous state
2. **Given** I have undone an action, **When** I press Ctrl+Y, **Then** the action is redone and the canvas returns to the state before undo
3. **Given** I have performed multiple actions, **When** I press Ctrl+Z multiple times, **Then** each action is undone in reverse order
4. **Given** I have undone actions and then perform a new action, **When** I try to redo, **Then** the redo history is cleared (new action replaces redo stack)
5. **Given** there is nothing to undo, **When** I press Ctrl+Z, **Then** nothing happens and no error is shown

---

### User Story 5 - Preview Mode (Priority: P2)

As a user, I can preview my visualization in a new browser tab using Ctrl+P, or enter fullscreen presentation mode for demonstrations.

**Why this priority**: Preview allows users to see their work as end-users will see it, which is essential for validation. Fullscreen mode enables professional presentations.

**Independent Test**: Can be fully tested by pressing Ctrl+P to open preview tab, and by clicking fullscreen button to verify the visualization fills the entire screen.

**Acceptance Scenarios**:

1. **Given** I have a project open, **When** I press Ctrl+P, **Then** a new browser tab opens showing the visualization in preview mode (without editing UI)
2. **Given** I am in the editor, **When** I click the fullscreen button, **Then** the visualization enters fullscreen mode hiding all editor UI
3. **Given** I am in fullscreen mode, **When** I press Escape, **Then** I exit fullscreen and return to the editor
4. **Given** I open preview in a new tab, **When** I make changes in the editor, **Then** the preview tab can be refreshed to see the latest changes

---

### User Story 6 - Keyboard Shortcuts Help Panel (Priority: P3)

As a user, I can press the ? key to view a help panel showing all available keyboard shortcuts.

**Why this priority**: Discoverability of shortcuts is helpful but not essential. Users can work without knowing shortcuts, and can learn them gradually.

**Independent Test**: Can be fully tested by pressing ? and verifying a modal/panel appears listing all shortcuts with their descriptions.

**Acceptance Scenarios**:

1. **Given** I am in the editor, **When** I press the ? key, **Then** a help panel appears showing all available keyboard shortcuts
2. **Given** the help panel is open, **When** I press ? again or press Escape, **Then** the help panel closes
3. **Given** the help panel is open, **When** I click outside the panel, **Then** the help panel closes
4. **Given** I am typing in a text input field, **When** I press ?, **Then** the character is typed normally (shortcut is ignored)

---

### Edge Cases

- What happens when IndexedDB storage quota is exceeded? → Show clear error message with guidance to export project and free up space
- How does the system handle concurrent saves (auto-save triggers while manual save is in progress)? → Queue saves and ensure data consistency
- What happens when importing a project created with a newer/older version of ThingsVis? → Attempt migration, show warning if incompatible
- How does the system behave when user has multiple editor tabs open for the same project? → Last save wins, optionally warn about potential conflicts
- What happens when browser is closed during auto-save? → Data in memory is lost, last successful save is preserved
- How does undo/redo interact with auto-save? → Undo/redo operate on in-memory state; auto-save persists current state regardless of undo history

## Requirements *(mandatory)*

### Functional Requirements

**Save & Persistence**
- **FR-001**: System MUST automatically save the project to IndexedDB 1 second after any content change (debounced)
- **FR-002**: System MUST save the project immediately when user presses Ctrl+S
- **FR-003**: System MUST display a visual indicator when save is in progress and when save completes
- **FR-004**: System MUST handle save failures gracefully with error notifications and automatic retry

**Project Management**
- **FR-005**: System MUST maintain a list of recently opened projects, sorted by last modified date
- **FR-006**: System MUST allow users to open any project from the recent projects list
- **FR-007**: System MUST allow users to import projects from .thingsvis JSON files
- **FR-008**: System MUST allow users to export projects as .thingsvis JSON files
- **FR-009**: System MUST fall back to standard download/upload when File System Access API is not supported
- **FR-010**: System MUST validate imported JSON files and show clear error messages for invalid files

**Keyboard Shortcuts**
- **FR-011**: System MUST switch to Select tool when user presses V
- **FR-012**: System MUST switch to Rectangle tool when user presses R
- **FR-013**: System MUST switch to Text tool when user presses T
- **FR-014**: System MUST switch to Pan/Hand tool when user presses H
- **FR-015**: System MUST ignore tool shortcuts when user is typing in a text input field
- **FR-016**: System MUST undo the last action when user presses Ctrl+Z
- **FR-017**: System MUST redo the last undone action when user presses Ctrl+Y
- **FR-018**: System MUST open preview in new tab when user presses Ctrl+P
- **FR-019**: System MUST display keyboard shortcuts help panel when user presses ?
- **FR-020**: System MUST close help panel when user presses ? again, Escape, or clicks outside

**Preview & Presentation**
- **FR-021**: System MUST open a preview of the current project in a new browser tab
- **FR-022**: System MUST provide a fullscreen presentation mode that hides all editor UI
- **FR-023**: System MUST exit fullscreen mode when user presses Escape

**Undo/Redo**
- **FR-024**: System MUST maintain an undo history stack for all canvas operations
- **FR-025**: System MUST clear the redo stack when a new action is performed after undo
- **FR-026**: System MUST support unlimited undo/redo within the current session

### Key Entities

- **Project**: Represents a ThingsVis visualization document. Contains canvas state, widgets, datasources, and metadata (name, created date, modified date)
- **Project Metadata**: Lightweight information about a project for the recent projects list (id, name, thumbnail, last modified date)
- **Undo History Entry**: A snapshot or delta representing a single undoable action, stored in memory for the current session
- **Keyboard Shortcut Mapping**: Association between key combinations and editor actions, used to populate the help panel

## Assumptions

- IndexedDB is available in all target browsers (modern Chrome, Firefox, Safari, Edge)
- The debounce delay of 1 second for auto-save is appropriate for typical editing patterns
- Undo history is session-only (not persisted across browser sessions) to avoid storage bloat
- Recent projects list is limited to a reasonable number (e.g., 20 most recent) to maintain performance
- Preview in new tab shares the same IndexedDB storage, allowing it to read the saved project

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users experience zero data loss due to system failures—all changes are persisted within 2 seconds
- **SC-002**: Users can switch tools using keyboard shortcuts in under 100ms response time
- **SC-003**: Undo/redo operations complete in under 50ms for typical projects (< 100 widgets)
- **SC-004**: Preview loads and displays correctly within 2 seconds of pressing Ctrl+P
- **SC-005**: 95% of users can successfully import/export projects on their first attempt
- **SC-006**: Recent projects list loads within 500ms when opening the editor
- **SC-007**: Users can discover all keyboard shortcuts within 30 seconds using the help panel
