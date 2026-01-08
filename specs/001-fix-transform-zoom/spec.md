# Feature Specification: Fix Transform Coordinates Under Canvas Zoom

**Feature Branch**: `001-fix-transform-zoom`  
**Created**: 2026-01-08  
**Status**: Draft  
**Input**: User description: "When the canvas is zoomed (e.g., 50% or 200%), dragging or resizing nodes results in incorrect position/size updates because screen-space deltas are applied directly to world-space coordinates, causing nodes to drift/jump."

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

### User Story 1 - Dragging Works Under Any Zoom (Priority: P1)

As a user, when I drag a node at any zoom level, the node moves precisely with my cursor and the saved position remains correct.

**Why this priority**: Dragging is a core editing workflow; incorrect coordinates make the editor unusable.

**Independent Test**: Can be fully tested by setting a non-100% zoom, dragging a node, and verifying the node ends at the expected place and stays there after zoom changes.

**Acceptance Scenarios**:

1. **Given** a canvas at a non-100% zoom and a node at a known position, **When** the user drags the node, **Then** the node visually follows the cursor and the stored node position is updated correctly.
2. **Given** a node that was dragged under a non-100% zoom, **When** the user changes zoom after the drag completes, **Then** the node does not drift/jump and remains aligned with its stored world position.

---

### User Story 2 - Resizing Works Under Any Zoom (Priority: P2)

As a user, when I resize a node at any zoom level, the node’s saved width/height updates correctly and the visual size matches what I performed.

**Why this priority**: Resizing is a fundamental layout operation; incorrect dimensions break precise design.

**Independent Test**: Can be fully tested by setting a non-100% zoom, resizing a node to a target visual size, and verifying stored width/height produce the same visual size after zoom changes.

**Acceptance Scenarios**:

1. **Given** a canvas at a non-100% zoom and a node with a known size, **When** the user resizes the node using handles, **Then** the node visually resizes smoothly and the stored node size is updated correctly.

---

### User Story 3 - Undo/Redo Restores Exact Results (Priority: P3)

As a user, undo/redo restores exact positions and sizes regardless of the current zoom level.

**Why this priority**: Reliable undo/redo is essential for iterative editing and prevents data correctness issues.

**Independent Test**: Can be fully tested by performing a drag/resize under a non-100% zoom, changing zoom, then using undo/redo and verifying the node returns to the exact previous state.

**Acceptance Scenarios**:

1. **Given** a node that has been dragged or resized at a non-100% zoom, **When** the user triggers undo, **Then** the node returns to its exact prior position/size and the visual matches the stored values.
2. **Given** the previous undo state, **When** the user triggers redo, **Then** the node returns to the exact dragged/resized position/size and remains correct after changing zoom.

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- Zoom level changes during drag/resize: the interaction completes without a visible jump and commits a correct final position/size.
- Panned viewport: panning does not cause incorrect commits (no drift or offset error).
- Multi-selection consistency (if supported): moving/resizing the selection does not corrupt any selected node’s stored coordinates.
- Very small or very large zoom levels supported by the product: dragging/resizing remains stable and predictable.

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST update a dragged node’s stored position in world coordinates so that the node’s on-screen movement tracks the cursor consistently at all supported zoom levels.
- **FR-002**: System MUST update a resized node’s stored width/height in world units so that the resulting on-screen size matches what the user resized to at all supported zoom levels.
- **FR-003**: System MUST ensure the selection/transform proxy remains visually aligned with the stored node position/size after zoom changes.
- **FR-004**: System MUST preserve undo/redo correctness for drag and resize operations performed at any zoom level.
- **FR-005**: System MUST keep panning and zooming from introducing additional offset errors during transform operations.
- **FR-006**: System MUST achieve the above without requiring changes to the persisted project data model (existing projects remain compatible).

Assumptions:

- Nodes store position (x/y) and size (width/height) in world coordinates, and the viewport mapping is responsible for converting world units to on-screen pixels.

### Key Entities *(include if feature involves data)*

- **Node**: A selectable item on the canvas with stored position (x/y) and size (width/height) in world coordinates.
- **Viewport**: The current canvas view transform, including zoom level and pan offset, used to map between world coordinates and on-screen pixels.
- **Transform Interaction**: A user gesture (drag/resize) that produces a position/size change to be committed into node data.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: Across all supported zoom levels, after completing a drag the node’s on-screen position matches the cursor-intended placement with no visible jump (≤ 1 screen pixel discrepancy).
- **SC-002**: Across all supported zoom levels, after completing a resize the node’s on-screen bounds match the resize result with no visible jump after subsequent zoom changes (≤ 1 screen pixel discrepancy).
- **SC-003**: Undo/redo restores the exact stored position and size values from before/after the transform (bit-for-bit equality of the saved values).
- **SC-004**: In a defined regression matrix (drag + resize across supported zoom levels and with pan applied), 100% of test cases pass.
