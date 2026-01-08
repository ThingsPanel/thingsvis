# Feature Specification: Copy, Paste, Duplicate Nodes

**Feature Branch**: `001-node-clipboard`  
**Created**: 2026-01-08  
**Status**: Draft  
**Input**: User description: "Feature: Copy, Paste, Duplicate Nodes (P0 Blocker)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Copy Selected Nodes (Priority: P1)

As an editor user, I can copy the currently selected nodes using the standard keyboard shortcut so that I can reuse them without rebuilding layouts.

**Why this priority**: Copy is the prerequisite for paste/duplicate workflows.

**Independent Test**: Select one or more nodes, press Copy, and confirm clipboard state changes (or remains unchanged when nothing is selected).

**Acceptance Scenarios**:

1. **Given** one node is selected, **When** the user triggers Copy (Ctrl/⌘+C), **Then** the system stores a serialized clipboard representing that node.
2. **Given** multiple nodes are selected, **When** the user triggers Copy, **Then** the system stores a serialized clipboard representing all selected nodes.
3. **Given** no nodes are selected, **When** the user triggers Copy, **Then** the operation is a no-op and does not throw errors.
4. **Given** the user is typing in a text field (e.g., input/textarea/contenteditable), **When** the user triggers Copy, **Then** the editor does not intercept the shortcut.

---

### User Story 2 - Paste Nodes With Deterministic Offset (Priority: P1)

As an editor user, I can paste copied nodes with a small, predictable offset so that pasted content is visible and can be placed quickly.

**Why this priority**: Paste is the core productivity action enabled by copy.

**Independent Test**: Copy a selection once, paste multiple times, and confirm each paste creates new nodes with correct offsets and selection.

**Acceptance Scenarios**:

1. **Given** the clipboard contains one or more nodes, **When** the user triggers Paste (Ctrl/⌘+V), **Then** new nodes are created with new unique IDs.
2. **Given** the clipboard contains multiple nodes, **When** the user triggers Paste, **Then** all pasted nodes preserve their relative layout compared to the copied selection.
3. **Given** the clipboard contains nodes, **When** the user triggers Paste repeatedly, **Then** the $n$th paste since the last Copy applies an offset of $(20n, 20n)$ pixels to all pasted nodes relative to the copied nodes’ positions.
4. **Given** the clipboard is empty, **When** the user triggers Paste, **Then** the operation is a no-op and does not throw errors.
5. **Given** a paste completes successfully, **When** the nodes are created, **Then** the pasted nodes become the current selection.
6. **Given** the clipboard contains one or more locked nodes, **When** the user triggers Paste, **Then** the pasted copies are created in an unlocked state.

---

### User Story 3 - Duplicate Selection (Priority: P1)

As an editor user, I can duplicate the current selection in a single action (Ctrl/⌘+D) to speed up layout creation.

**Why this priority**: Duplicate is a standard workflow in design tools and reduces repeated copy/paste steps.

**Independent Test**: Select nodes and trigger Duplicate; verify it creates a new selection with correct offsets and undo/redo behavior.

**Acceptance Scenarios**:

1. **Given** one or more nodes are selected, **When** the user triggers Duplicate (Ctrl/⌘+D), **Then** a new set of nodes is created that matches the selection content.
2. **Given** multiple nodes are selected, **When** the user triggers Duplicate, **Then** the duplicated nodes preserve relative layout.
3. **Given** no nodes are selected, **When** the user triggers Duplicate, **Then** the operation is a no-op.
4. **Given** duplicate completes successfully, **When** nodes are created, **Then** the duplicated nodes become the current selection.
5. **Given** the selection includes one or more locked nodes, **When** the user triggers Duplicate, **Then** duplicated copies are created in an unlocked state.

### User Story 4 - Undo/Redo For Paste & Duplicate (Priority: P2)

As an editor user, I can undo and redo paste/duplicate actions so that I can safely experiment without losing my prior state.

**Why this priority**: Without undo/redo, paste/duplicate mistakes are costly and error-prone.

**Independent Test**: Perform paste/duplicate once, undo once, redo once, confirming nodes and selection are restored predictably.

**Acceptance Scenarios**:

1. **Given** a paste has just created nodes, **When** the user triggers Undo, **Then** the newly created nodes are removed and the prior selection is restored.
2. **Given** an undo has removed pasted nodes, **When** the user triggers Redo, **Then** the nodes are re-created and the pasted nodes become the current selection.
3. **Given** a duplicate has just created nodes, **When** the user triggers Undo, **Then** the duplicated nodes are removed and the prior selection is restored.

### Edge Cases

- Empty clipboard paste results in a no-op.
- Copy with no selection results in a no-op.
- Multi-node copy/paste preserves relative layout.
- Locked nodes are allowed to be copied; pasted/duplicated copies are not locked.
- Shortcuts do not interfere with normal text editing in inputs/textareas/contenteditable regions.
- ID collisions are prevented even when pasting repeatedly.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The editor MUST support Copy, Paste, and Duplicate actions for nodes when the editor canvas is the active context.
- **FR-002**: Copy MUST serialize the currently selected nodes into an internal clipboard representation.
- **FR-003**: Copy with an empty selection MUST be a no-op and MUST NOT cause errors.
- **FR-004**: Paste MUST be a no-op when the clipboard is empty.
- **FR-005**: Paste MUST create new nodes from the clipboard with new unique IDs (no collisions with existing nodes).
- **FR-006**: Paste MUST preserve relative layout among all pasted nodes.
- **FR-007**: Paste MUST apply a deterministic offset of (+20px, +20px) per paste operation since the last copy/clipboard update.
- **FR-008**: After a successful paste, the pasted nodes MUST become the current selection.
- **FR-009**: Duplicate MUST create new nodes from the current selection in a single action and MUST behave equivalently to copy+paste.
- **FR-010**: Duplicate with an empty selection MUST be a no-op.
- **FR-011**: Paste and Duplicate MUST be undoable and redoable as user actions.
- **FR-012**: Locked nodes MAY be copied/duplicated, but pasted/duplicated copies MUST be unlocked.
- **FR-013**: The editor MUST NOT intercept Copy/Paste/Duplicate shortcuts while the user is typing in standard text-editable UI (input/textarea/contenteditable).

### Non-Goals (Out of Scope)

- Using the operating system clipboard to copy content between different applications.
- Copying/pasting non-node objects (e.g., images, arbitrary text) via these commands.

### Key Entities *(include if feature involves data)*

- **Node**: A visual element on the canvas with a unique identifier and position/size.
- **Selection**: The current set of selected node IDs in the editor.
- **Clipboard Payload**: A serialized snapshot of one or more nodes sufficient to recreate them.
- **Paste Operation**: A user-triggered action that creates new nodes from the clipboard payload and applies a deterministic offset.

### Assumptions

- The clipboard is scoped to the current editor session (it may reset on full page reload).
- The deterministic paste offset counter resets whenever the clipboard payload changes via Copy.
- When Copy is triggered with no selection, the existing clipboard payload is preserved.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can copy and paste a selected node and see the pasted node(s) appear within 1 second of the action.
- **SC-002**: 100% of paste operations apply the specified deterministic offset pattern (+20px x/y per paste since last copy).
- **SC-003**: 100% of paste/duplicate operations produce unique node IDs with no collisions in the current project.
- **SC-004**: Undo/redo restores the canvas to the exact prior state for paste/duplicate (including selection) in 100% of tested cases.
