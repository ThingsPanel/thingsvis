# Data Model: Phase 2 - L0 Kernel Engine

**Branch**: `002-l0-kernel-engine`  
**Spec**: [spec.md](./spec.md)  
**Plan**: [plan.md](./plan.md)

## Overview

The L0 Kernel Engine operates on a schema-driven model where validated page schemas are transformed into kernel state and rendered via the React Bypass pattern. This document captures the primary entities, their fields, relationships, and state transitions.

## Entities

### 1. PageSchema

- **Represents**: The complete definition of a page, including its nodes, layout, and configuration.  
- **Source**: Zod definition in `packages/thingsvis-schema/src/page-schema.ts`.

**Key Fields** (conceptual, to be defined in Zod):

- `id: string` – Unique identifier for the page.  
- `version: string` – Schema or page version for compatibility tracking.  
- `type: string` – Page type identifier (e.g., "canvas", "document").  
- `nodes: NodeSchema[]` – Ordered collection of node definitions that make up the page.  
- `metadata?: Record<string, unknown>` – Optional metadata such as title, tags, or configuration hints.

### 2. NodeSchema

- **Represents**: An individual visual element on the canvas.  
- **Source**: Zod definition in `packages/thingsvis-schema/src/node-schema.ts`.

**Key Fields** (conceptual, to be defined in Zod):

- `id: string` – Unique node identifier used for state lookups and event routing.  
- `type: string` – Logical type (e.g., `"rect"`, `"circle"`, `"group"`, `"component"`).  
- `props?: Record<string, unknown>` – Component properties or node-specific data.  
- `style?: Record<string, unknown>` – Visual styling properties (e.g., fill color, stroke, opacity).  
- `position: { x: number; y: number }` – 2D coordinates in page space.  
- `size?: { width: number; height: number }` – Optional dimensions for rectangular content.  
- `parentId?: string` – Identifier of the parent node for hierarchical scenes (optional).

### 3. KernelState

- **Represents**: The in-memory state managed by the Zustand store, derived from a page schema and updated by interactions.  
- **Source**: Type definition in `packages/thingsvis-kernel/src/store/KernelStore.ts`.

**Key Fields** (conceptual):

- `page: PageSchema` – The active page schema.  
- `nodesById: Record<string, NodeState>` – Runtime state for each node keyed by id.  
- `selection: { nodeIds: string[] }` – Current selection (array of selected node IDs).  
- `canvas: { zoom: number; offsetX: number; offsetY: number }` – Current canvas viewport state.  
- `history: HistoryState` – Undo/redo stacks and metadata.

### 4. NodeState

- **Represents**: The runtime state for a single node, beyond what is stored in the schema.  
- **Source**: Type definition in `packages/thingsvis-kernel/src/store/KernelStore.ts`.

**Key Fields**:

- `id: string` – Mirrors the schema node id.  
- `schemaRef: NodeSchema` – Reference back to the original schema definition.  
- `visible: boolean` – Whether the node is currently visible.  
- `runtimeData?: Record<string, unknown>` – Derived or live-updated data driven by events or interactions.

### 5. Command

- **Represents**: A single state-changing operation that can be applied, undone, and redone.  
- **Source**: Type definition in `packages/thingsvis-kernel/src/history/HistoryManager.ts`.

**Key Fields** (conceptual):

- `id: string` – Unique identifier for the command.  
- `type: string` – Category of change (e.g., `"node.select"`, `"node.move"`, `"canvas.zoom"`).  
- `payload: unknown` – Structured payload with details required to apply/rollback.  
- `execute(state: KernelState): KernelState` – Operation to move state forward.  
- `undo(state: KernelState): KernelState` – Operation to revert state.

### 6. HistoryState

- **Represents**: The undo/redo timeline for kernel state changes.  
- **Source**: Type definition in `packages/thingsvis-kernel/src/history/HistoryManager.ts`.

**Key Fields**:

- `past: Command[]` – Commands that have been applied and can be undone.  
- `present?: Command` – The most recent command, if needed for debugging.  
- `future: Command[]` – Commands that were undone and can be redone.

### 7. Event

- **Represents**: Events flowing between components and the kernel.  
- **Source**: Type definition in `packages/thingsvis-kernel/src/events/EventBus.ts`.

**Key Fields**:

- `type: string` – Event type (e.g., `"node.click"`, `"node.select"`, `"state.changed"`).  
- `sourceId?: string` – Node or component that emitted the event.  
- `timestamp: number` – Time of event emission.  
- `payload?: unknown` – Structured details for event handlers.

## State Transitions (High Level)

1. **Schema Load → KernelState Initialization**  
   - Input: Validated `PageSchema`.  
   - Effect: Kernel constructs `KernelState` with `page`, `nodesById` (derived from schema nodes), initial `selection` (empty), `canvas` (default zoom/offset), and empty `history`.  
   - Consumers: `VisualEngine` subscribes and renders initial scene via `sync()`.

2. **User Interaction (Click on Node)**  
   - Input: `Event` from renderer (`type: "node.click"`, `sourceId = nodeId`).  
   - Effect: Kernel creates a `Command` for selection change, applies it to state (updates `selection.nodeIds`), pushes command to `history.past`, and emits state change event.  
   - Consumers: `VisualEngine` receives state update via subscription and calls `sync()` to update LeaferJS objects.

3. **Undo Operation**  
   - Input: User presses 'Undo' key or programmatic undo call.  
   - Effect: `HistoryManager` pops the most recent command from `history.past`, calls `command.undo()` to revert state, and pushes command to `history.future`.  
   - Consumers: `VisualEngine` syncs updated state to LeaferJS.

4. **Redo Operation**  
   - Input: User presses 'Redo' key or programmatic redo call.  
   - Effect: `HistoryManager` pops the most recent command from `history.future`, calls `command.execute()` to reapply state, and pushes command back to `history.past`.  
   - Consumers: `VisualEngine` syncs updated state to LeaferJS.

5. **Component Error**  
   - Input: A component throws an error during render/update.  
   - Effect: `HeadlessErrorBoundary` catches the error, marks the component instance as failed in kernel state (or local error state), and renders `fallback` prop.  
   - Consumers: Other nodes continue to render normally; error is isolated to the failed component.

## Validation Rules

- `PageSchema` MUST be validated with Zod before kernel initialization.  
- `NodeSchema` MUST have a unique `id` within the page's `nodes` array.  
- `NodeSchema.position` MUST have valid numeric `x` and `y` values.  
- `NodeSchema.size` (if present) MUST have positive `width` and `height` values.  
- Commands MUST be immutable and idempotent (applying the same command twice should have the same effect as applying it once).  
- KernelState updates MUST go through Zustand actions (no direct mutations).

