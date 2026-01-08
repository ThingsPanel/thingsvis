# Data Model: Fix Transform Coordinates Under Canvas Zoom

## Overview

This feature does not introduce new persisted entities or schema fields. It clarifies and enforces correct usage of existing geometry fields under viewport transforms.

## Entities

### Node (existing)

- `id: string`
- `schemaRef.position: { x: number; y: number }` (world coordinates)
- `schemaRef.size?: { width: number; height: number }` (world units)
- `locked?: boolean`
- `visible?: boolean`

Validation / invariants:
- Position and size are stored in world units and must not depend on viewport zoom.
- Locked nodes must not be transformable (already enforced by TransformControls).

### Viewport (existing runtime state)

Provided by `@thingsvis/ui` `CanvasView` via `onViewportChange`:

- `width: number` (viewport pixel width)
- `height: number` (viewport pixel height)
- `zoom: number` (scale factor)
- `offsetX: number` (pan offset in screen pixels)
- `offsetY: number`

Validation / invariants:
- Zoom affects rendering only; it must not be baked into persisted node geometry.

### Transform Interaction (ephemeral)

- `baseWorldPositionById: Record<string, { x: number; y: number }>`
- `baseWorldSizeById: Record<string, { width: number; height: number }>`
- `commitZoom: number` (zoom read at end of interaction)

State transitions:
- On interaction start: capture base geometry from kernel state.
- During interaction: Moveable updates DOM proxy via CSS transforms for responsiveness.
- On interaction end: convert screen-space result to world-space and commit to kernel store.
