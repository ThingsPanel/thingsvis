# Feature Specification: Delete Selected Nodes via Delete Key

**Feature Branch**: `001-delete-selected-nodes`  
**Created**: 2026-01-08  
**Status**: Draft  
**Input**: User description: "Delete Selected Nodes via Delete Key (P0 Blocker). Users need to remove selected nodes using the keyboard Delete key; no selection should no-op; deletion must be undoable."

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

### User Story 1 - Delete selected nodes with keyboard (Priority: P1)

As an editor user, I can press the standard Delete key while working on the canvas to remove the currently selected node(s), so I can perform basic editing quickly without using menus.

**Why this priority**: This is a fundamental editing operation; lack of keyboard delete blocks common workflows.

**Independent Test**: Select one or more nodes and press Delete; the nodes should be removed from the canvas and no errors should occur.

**Acceptance Scenarios**:

1. **Given** the canvas contains at least one node and exactly one node is selected, **When** the user presses Delete, **Then** the selected node is removed from the canvas.
2. **Given** the canvas contains multiple nodes and multiple nodes are selected, **When** the user presses Delete, **Then** all deletable selected nodes are removed from the canvas and the selection state remains valid.
3. **Given** the editor is focused on an input/text field, **When** the user presses Delete, **Then** the editor MUST NOT delete canvas nodes (normal text editing behavior remains).
4. **Given** the product supports locked nodes and the current selection includes both locked and unlocked nodes, **When** the user presses Delete, **Then** only the unlocked nodes are removed and locked nodes remain.

---

### User Story 2 - Delete with no selection is safe (Priority: P2)

As an editor user, pressing Delete when nothing is selected does nothing, so I can use the shortcut safely without fear of accidental changes.

**Why this priority**: Prevents accidental or confusing behavior and avoids error states.

**Independent Test**: Ensure no nodes are selected and press Delete; nothing changes and no errors are shown.

**Acceptance Scenarios**:

1. **Given** no nodes are selected, **When** the user presses Delete, **Then** the canvas content remains unchanged and no error is shown.

---

### User Story 3 - Delete is undoable and redoable (Priority: P3)

As an editor user, I can undo and redo a deletion, so I can recover from mistakes and iterate quickly.

**Why this priority**: Reliable undo/redo is essential for editor trust and prevents data loss.

**Independent Test**: Delete selected nodes, then undo and redo; the canvas should return to the prior states without drift or corruption.

**Acceptance Scenarios**:

1. **Given** one or more nodes were deleted using the Delete key, **When** the user performs Undo, **Then** the deleted nodes reappear exactly as they were before deletion.
2. **Given** a deletion has been undone, **When** the user performs Redo, **Then** the same nodes are deleted again.

---

### Edge Cases

- Mixed selection containing deletable and non-deletable nodes (e.g., locked nodes): only deletable nodes are removed.
- Rapid repeated Delete presses: operation remains stable (no errors; no partial corruption).
- Very large multi-selection: deletion remains responsive and completes successfully.
- Platform differences: the editor uses the platform’s standard Delete behavior (e.g., Windows Delete key; on macOS the common “delete/backspace” key mapping should trigger the delete action when the canvas is focused).

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: The system MUST provide a keyboard shortcut that triggers deletion of the current canvas selection when the canvas/editor surface is focused.
- **FR-002**: When one or more nodes are selected, the system MUST remove all deletable selected nodes from the canvas after the delete shortcut is triggered.
- **FR-003**: When no nodes are selected, triggering the delete shortcut MUST be a no-op and MUST NOT raise an error.
- **FR-004**: A deletion triggered via the delete shortcut MUST be undoable and redoable.
- **FR-005**: Undoing a deletion MUST restore the deleted nodes’ full user-visible state (including their positions, sizes, and configuration) to exactly what it was immediately before deletion.
- **FR-006**: If the product supports “locked” nodes, locked nodes MUST NOT be deleted via the delete shortcut.
- **FR-007**: After deletion completes, the selection state MUST remain valid (e.g., it cannot reference nodes that no longer exist).

### Key Entities *(include if feature involves data)*

- **Node**: A visual element placed on the canvas; may include a “locked” state.
- **Selection**: The set of currently selected node identifiers.
- **History Entry**: A reversible record of a user action (used for undo/redo).

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: Users can delete selected nodes using the delete shortcut with a 100% pass rate on the acceptance scenarios in this specification.
- **SC-002**: Undo restores deleted nodes exactly (count and user-visible state match pre-delete) with a 100% pass rate on the acceptance scenarios.
- **SC-003**: When nothing is selected, pressing the delete shortcut results in zero visible changes and zero errors (100% pass rate).
- **SC-004**: For a selection of up to 200 nodes, the deletion visibly completes within 200 ms in typical interactive use.

## Assumptions

- The editor has an explicit concept of “selected nodes” on a canvas.
- If “locked nodes” exist, they are intended to be protected from destructive editing operations like delete.

## Out of Scope

- Deleting nodes via menus, context menus, or toolbar buttons.
- Cutting nodes to a clipboard (separate from delete).
- Deleting non-node entities (e.g., guides) if such entities exist.
