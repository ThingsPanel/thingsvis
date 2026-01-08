# Quickstart: Fix Transform Coordinates Under Canvas Zoom

## Goal

Verify that dragging and resizing commit correct world coordinates at any zoom level and remain stable under pan and undo/redo.

## Prerequisites

- Install deps: `pnpm i`
- Run Studio: `pnpm -w turbo run dev --filter=studio`

## Manual QA Matrix

### Drag

1. Create a node (any resizable node).
2. Set zoom to 1.0 and drag ~200px to the right.
   - Expect: stored `position.x` increases by ~200.
3. Set zoom to 2.0 and drag ~200px to the right.
   - Expect: stored `position.x` increases by ~100.
4. Set zoom to 0.5 and drag ~200px to the right.
   - Expect: stored `position.x` increases by ~400.

### Resize

1. At zoom 2.0, resize width larger by ~200px on screen.
   - Expect: stored `size.width` increases by ~100.
2. At zoom 0.5, resize width larger by ~200px on screen.
   - Expect: stored `size.width` increases by ~400.

### Pan interaction

1. Pan the viewport (non-zero `offsetX/offsetY`).
2. Drag and resize again at zoom 1.0 and 2.0.
   - Expect: commits remain correct; no additional offset is baked into stored geometry.

### Undo/Redo

1. Perform one drag and one resize at a non-1.0 zoom.
2. Change zoom.
3. Undo twice.
4. Redo twice.
   - Expect: stored values are restored exactly; visuals match and no drift occurs.

## Automated gate

- Run: `pnpm -w turbo run typecheck --filter=studio`
