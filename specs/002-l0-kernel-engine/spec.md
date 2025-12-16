# Feature Specification: Phase 2 - L0 Kernel Engine

**Feature Branch**: `002-l0-kernel-engine`  
**Created**: 2025-12-16  
**Status**: Draft  
**Input**: User description: "Build Phase 2: L0 Kernel Engine for ThingsVis. This is the headless engine, NOT the editor."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Initialize and render a large scene (Priority: P1)

An integrator or developer wants to initialize the kernel with a large number of nodes (1000 rectangles) and see them rendered on a canvas without any editor UI, so that the headless engine can be embedded in applications that need visualization capabilities.

**Why this priority**: This is the core value proposition - being able to take a schema definition and render it headlessly as a reliable runtime component.

**Independent Test**: Provide a page schema containing 1000 rectangle node definitions, initialize the kernel with this schema, and verify that all 1000 rectangles appear correctly rendered on the canvas using the LeaferJS adapter.

**Acceptance Scenarios**:

1. **Given** a valid page schema with 1000 rectangle nodes, **When** the kernel is initialized with this schema, **Then** all 1000 rectangles are rendered on the canvas with correct positions and dimensions.
2. **Given** the kernel has been initialized with a schema, **When** the application starts, **Then** the canvas renders without requiring any editor UI components or controls.

---

### User Story 2 - Interact with nodes and track state changes (Priority: P1)

An integrator wants to click on individual nodes in the rendered scene and have those interactions update the kernel's global state, so that applications can respond to user selections and track which nodes are currently selected.

**Why this priority**: User interaction and state management are fundamental to making the engine useful beyond static rendering.

**Independent Test**: Click on different rectangle nodes in the rendered scene and verify that the kernel store updates to reflect the current selection, with each click properly recorded in the state.

**Acceptance Scenarios**:

1. **Given** a rendered scene with multiple nodes, **When** a user clicks on a specific rectangle node, **Then** the kernel store updates to mark that node as selected and the selection state is accessible to the application.
2. **Given** a node is currently selected, **When** a user clicks on a different node, **Then** the previous selection is cleared and the newly clicked node becomes the selected node in the store.

---

### User Story 3 - Undo and redo state changes (Priority: P2)

An integrator wants to undo and redo state changes (such as node selections or movements) using keyboard shortcuts or programmatic commands, so that users can revert accidental changes or navigate through a history of interactions.

**Why this priority**: History management enables better user experience and debugging capabilities, making the engine more robust for production use.

**Independent Test**: Perform a sequence of node selections or movements, then press the 'Undo' key, and verify that the state reverts to the previous state and the visual representation updates accordingly.

**Acceptance Scenarios**:

1. **Given** a user has selected a node and then moved it to a new position, **When** the user presses 'Undo', **Then** the node returns to its previous position and the kernel store reflects the previous state.
2. **Given** a user has undone one or more operations, **When** the user presses 'Redo', **Then** the state advances forward through the history and the visual representation updates to match.

---

### User Story 4 - Isolate component errors without crashing (Priority: P2)

An integrator loads components that may contain errors or throw exceptions during rendering, and wants to ensure that a failure in one component does not crash the entire application or prevent other components from rendering.

**Why this priority**: Error isolation is critical for production reliability, especially when loading third-party or experimental components.

**Independent Test**: Configure a node to use a component that intentionally throws an error during render, load the page, and verify that only that component shows an error fallback while the rest of the scene continues to render and function normally.

**Acceptance Scenarios**:

1. **Given** a page schema includes a node with a component that throws an error during render, **When** the kernel attempts to render the page, **Then** only that specific component is replaced with an error fallback UI while all other nodes continue to render correctly.
2. **Given** a component has thrown an error and been replaced with a fallback, **When** the user interacts with other nodes on the page, **Then** those interactions continue to work normally and the error state does not propagate to other components.

---

### Edge Cases

- What happens when the page schema is missing required fields or contains invalid node definitions?
- How does the system handle rapid successive clicks or state changes?
- What happens when undo is pressed but there is no history to revert?
- How does the system behave when a component throws an error during update or resize operations, not just during initial mount?
- What happens when the kernel is initialized with an empty schema or zero nodes?
- How does the system handle extremely large schemas (beyond 1000 nodes) or nodes with invalid coordinates?

## Requirements *(mandatory)*

**Constitution Alignment**: Confirm solutions respect monorepo boundaries (pnpm+Turbo), Rspack+MF2 builds, TS 5.x strict typing, schemas in `packages/thingsvis-schema` validated with Zod, renderer discipline (Leafer/React Three Fiber; no direct DOM), state via zustand+immer, performance targets (<800KB core bundle, ≥50 FPS where applicable), and ErrorBoundary wrapping for plugins/components.

### Functional Requirements

- **FR-001**: The system MUST define strict `NodeSchema` and `PageSchema` types in `@thingsvis/schema` with Zod parsers for runtime validation.
- **FR-002**: The system MUST implement a Zustand store with Immer middleware in `@thingsvis/kernel` to manage immutable kernel state updates.
- **FR-003**: The system MUST implement a `HistoryManager` using the Command Pattern in `@thingsvis/kernel` to support undo and redo operations.
- **FR-004**: The system MUST provide a `SafeExecutor` utility in `@thingsvis/kernel` to safely execute user scripts or expressions within a logic sandbox.
- **FR-005**: The system MUST implement a loader mechanism in `@thingsvis/kernel` to load remote resources (mock implementation acceptable for this phase).
- **FR-006**: The system MUST provide a `VisualEngine` class in `@thingsvis/ui` that interacts with LeaferJS directly and includes a `sync(nodes)` method to efficiently update the canvas.
- **FR-007**: The system MUST provide a `<CanvasView />` React component in `@thingsvis/ui` that mounts the VisualEngine but does NOT re-render on every state change (React Bypass pattern).
- **FR-008**: The system MUST provide a `HeadlessErrorBoundary` functional component in `@thingsvis/ui` that catches errors and renders a `props.fallback` when triggered.
- **FR-009**: The demo application MUST be able to initialize the kernel with 1000 rectangle nodes from a schema.
- **FR-010**: The demo application MUST render all initialized nodes using the LeaferJS adapter in the `<CanvasView>` component.
- **FR-011**: The system MUST update the kernel store when a user clicks on a node, marking that node as selected.
- **FR-012**: The system MUST support pressing 'Undo' to revert the most recent selection or movement change.
- **FR-013**: The system MUST prevent the entire application from crashing when a node's component throws an error, isolating the error to that specific component.

### Key Entities *(include if feature involves data)*

- **PageSchema**: Represents the complete definition of a page, including its nodes, layout, and configuration. Must include fields for id, version, type, and an array of nodes.
- **NodeSchema**: Represents an individual visual element on the canvas, including fields for id, type, props (component properties), style (visual styling), position, and dimensions.
- **Kernel State**: Represents the current state managed by the Zustand store, including selected nodes, node positions, canvas viewport, and history stack.
- **Command**: Represents a single state-changing operation that can be applied, undone, and redone. Commands encapsulate the logic needed to transition state forward and backward.
- **Component Error State**: Represents the error information for a component that has failed, including error message, component identifier, and fallback rendering instructions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The demo application can successfully initialize the kernel with a schema containing 1000 rectangle nodes and render all of them on the canvas within 5 seconds of application start.
- **SC-002**: When clicking on any visible node in the rendered scene, the kernel store updates to reflect the selection within 100 milliseconds, and the selection state is accessible to the application.
- **SC-003**: When pressing 'Undo' after performing a selection or movement operation, the state reverts to the previous state and the visual representation updates accordingly within 200 milliseconds.
- **SC-004**: When a component throws an error during render, only that component is replaced with an error fallback while 100% of other nodes continue to render and function normally.
- **SC-005**: The headless engine can be initialized and used without requiring any editor UI components, making it suitable for embedding in third-party applications.
- **SC-006**: During a 10-second pan/zoom session on the 1000-node scene, the frame-timing log shows ≥90% of frames under 20ms and no freezes longer than 250ms (human-visible stutter).

## Assumptions

- The LeaferJS library is available and properly configured for use in the project.
- React 18 is available for the React adapter components.
- Zustand and Immer are available for state management.
- Zod is available for schema validation.
- The demo application will run in a modern browser environment with support for ES2020+ features.
- Performance expectations are based on typical desktop hardware used by developers and integrators.
- The SafeExecutor logic sandbox will use a mock implementation for this phase, with full implementation deferred to a later phase.
- The loader for remote resources will use a mock implementation for this phase, with full remote loading capabilities deferred to a later phase.

