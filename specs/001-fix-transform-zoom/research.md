# Research: Fix Transform Coordinates Under Canvas Zoom

## Decision: Treat Moveable deltas/sizes as screen-space and convert at commit time

- Decision: Convert final drag/resize deltas (and resize width/height) from screen-space to world-space using the current viewport zoom at the time of commit.
- Rationale:
  - In Studio, proxy targets are positioned in world units, but rendered inside a wrapper with `translate(offsetX, offsetY) scale(zoom)`.
  - Moveable interaction reports deltas and sizes in CSS pixels relative to what the user sees (screen-space).
  - Committing those values directly into world-space causes overshoot at zoom > 1 and undershoot at zoom < 1, matching the reported drift/jump.
- Alternatives considered:
  - Apply inverse scaling to the entire Moveable container so events are world-space: rejected because it introduces global side effects and coupling between Moveable internals and the canvas viewport.
  - Read `target.style.left/top/width/height` as the single source of truth: rejected because these values are intermediate UI artifacts and become unreliable under scaled parents and undo/redo.

## Decision: Pass viewport access to TransformControls via a lightweight callback

- Decision: Add a `getViewport(): { zoom: number; offsetX: number; offsetY: number; width: number; height: number }` prop from `apps/studio/src/components/CanvasView.tsx` into `apps/studio/src/components/tools/TransformControls.tsx`.
- Rationale:
  - Keeps kernel and schema unchanged (required constraint).
  - Avoids adding global state or cross-package dependencies.
  - Supports edge case “zoom changes during drag/resize” by reading the latest zoom at commit time.
- Alternatives considered:
  - Use a global module singleton for viewport: rejected as it adds hidden coupling and makes testing harder.
  - Query DOM transform matrices from the proxy wrapper: rejected as more brittle and harder to keep type-safe.

## Decision: Use kernel state as the base geometry for commits

- Decision: On dragStart/resizeStart, capture base world geometry from the kernel state (position and size for the selected node(s)), and store it in memory keyed by nodeId.
- Rationale:
  - Prevents drift from accumulating across interactions.
  - Ensures undo/redo and programmatic updates remain consistent with Moveable commits.
- Alternatives considered:
  - Use `target.dataset.baseLeft/baseTop` derived from DOM: rejected because DOM may be stale or reflect scaled geometry.

## Decision: Keep pan offsets out of transform commits

- Decision: Do not include `offsetX/offsetY` in the position/size commit math for drag/resize; they are part of viewport rendering only.
- Rationale:
  - Stored node geometry is world-space.
  - Proxy wrapper already applies offsets for display.

## Practical verification notes (non-blocking)

- Expected invariant (Figma/Excalidraw style): cursor movement in screen pixels maps 1:1 to node movement in screen pixels.
  - Therefore: `worldDelta = screenDelta / zoom`.
- Quick smoke verification during implementation:
  - At zoom=2, dragging ~200px on screen should change world position by ~100.
  - At zoom=0.5, dragging ~200px on screen should change world position by ~400.
