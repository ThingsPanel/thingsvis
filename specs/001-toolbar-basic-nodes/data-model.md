# Data Model: Studio Toolbar Basic Tools

**Feature**: [spec.md](spec.md)
**Date**: 2026-01-09

> This is a conceptual model to drive consistent behavior across UI, store updates, and plugin contracts.

## Entities

### StudioTool

Represents the currently active editor tool.

- **id**: `select | rectangle | circle | text | image | arrow | pan`
- **sticky**: boolean (always `true` for MVP; tool remains active after creation)

### CreateGesture

Represents a single user gesture on the canvas.

- **pointerDownScreen**: `{ x: number, y: number }`
- **pointerUpScreen**: `{ x: number, y: number }`
- **isClick**: boolean (true if distance < threshold)
- **boundsScreen**: `{ x: number, y: number, width: number, height: number }`
- **boundsWorld**: `{ x: number, y: number, width: number, height: number }`

Validation rules:

- width/height must be normalized to non-negative values.
- if `isClick`, `boundsWorld` is derived from tool default size centered or anchored at click.

### NodeCreationSpec

A tool-level description of what to create.

- **componentId**: string (registry key, e.g. `basic/rectangle`)
- **defaultSize**: `{ width: number, height: number }` (used for click creation)
- **minSize**: `{ width: number, height: number }` (optional; to avoid near-zero nodes)
- **defaultProps**: object (derived from plugin schema defaults)
- **resizable**: boolean (tool-level expectation; plugin may still auto-size)

### CanvasNode (existing)

Existing persisted element.

- **id**: string
- **type**: string (component id)
- **position**: `{ x, y }` (world)
- **size**: `{ width, height }` (world, optional for auto-size components)
- **props**: object

### ImageAsset (MVP)

Inline asset payload stored in node props.

- **dataUrl**: string (e.g. `data:image/png;base64,...`)
- **mimeType**: string
- **name**: string (optional)
- **width**: number (optional)
- **height**: number (optional)

Validation rules:

- dataUrl must start with `data:image/`.
- asset size is bounded by browser/IndexedDB quota; large images may fail to save (handled as an error path).

## State Transitions

### Tool selection

- `activeTool` changes via toolbar click or command execution.

### Creation gesture

- `Idle` → `Dragging` (pointer down on canvas)
- `Dragging` → `Committed` (pointer up, creates node)
- `Dragging` → `Canceled` (Escape, no node)

### Undo/Redo

- “Create node + select node” is one atomic history step.
- Undo removes the created node and restores previous selection.
