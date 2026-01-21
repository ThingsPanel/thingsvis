# Grid Kernel API Contract

**Feature Branch**: `002-grid-layout`  
**Date**: 2026-01-19

## Overview

This document defines the API contracts for the GridSystem engine in `packages/thingsvis-kernel/src/grid/`.

---

## GridSystem Static Methods

### `GridSystem.compact(items, cols)`

Performs vertical compaction on all grid items, moving them upward to fill gaps.

```typescript
/**
 * Compact all items vertically (gravity effect)
 * 
 * @param items - Array of grid items to compact
 * @param cols - Number of columns in the grid
 * @returns GridLayoutResult with compacted positions
 * 
 * @example
 * const result = GridSystem.compact(items, 24);
 * console.log(result.changedIds); // IDs of items that moved
 */
static compact(items: GridItem[], cols: number): GridLayoutResult;
```

**Behavior**:
- Items are sorted by `y` then `x` before processing
- Each item moves up to the lowest valid `y` position (no collisions)
- Static items (`static: true`) do not move
- Returns all items with updated positions

---

### `GridSystem.moveItem(items, id, newPos, cols)`

Moves an item to a new grid position, handling collisions via push-down.

```typescript
/**
 * Move an item to a new position
 * 
 * @param items - Array of all grid items
 * @param id - ID of the item to move
 * @param newPos - Target grid position { x, y }
 * @param cols - Number of columns
 * @returns GridLayoutResult with updated positions
 * 
 * @example
 * const result = GridSystem.moveItem(items, 'node-1', { x: 4, y: 2 }, 24);
 */
static moveItem(
  items: GridItem[],
  id: string,
  newPos: { x: number; y: number },
  cols: number
): GridLayoutResult;
```

**Behavior**:
1. Validates `newPos` is within grid bounds
2. Clamps x to `[0, cols - item.w]`
3. Clamps y to `[0, Infinity)` (no upper bound)
4. Detects collisions with other items
5. Pushes colliding items down by minimum required distance
6. Applies vertical compaction if enabled
7. Returns all affected items

---

### `GridSystem.resizeItem(items, id, newSize, cols)`

Resizes an item, handling collisions and constraints.

```typescript
/**
 * Resize an item
 * 
 * @param items - Array of all grid items
 * @param id - ID of the item to resize
 * @param newSize - New size { w, h }
 * @param cols - Number of columns
 * @returns GridLayoutResult with updated positions
 * 
 * @example
 * const result = GridSystem.resizeItem(items, 'node-1', { w: 6, h: 3 }, 24);
 */
static resizeItem(
  items: GridItem[],
  id: string,
  newSize: { w: number; h: number },
  cols: number
): GridLayoutResult;
```

**Behavior**:
1. Applies minW/maxW/minH/maxH constraints
2. Clamps width to fit within grid (`x + w <= cols`)
3. Detects new collisions caused by expansion
4. Pushes affected items down
5. Applies vertical compaction if enabled

---

### `GridSystem.detectCollision(a, b)`

Checks if two grid items overlap.

```typescript
/**
 * Check if two items collide (overlap)
 * 
 * @param a - First grid item
 * @param b - Second grid item
 * @returns true if items overlap
 * 
 * @example
 * if (GridSystem.detectCollision(itemA, itemB)) {
 *   console.log('Collision detected');
 * }
 */
static detectCollision(a: GridItem, b: GridItem): boolean;
```

**Behavior**:
- Returns `true` if bounding boxes intersect
- Returns `false` if items are adjacent but not overlapping

---

### `GridSystem.resolveCollisions(items, movingItem, cols)`

Resolves all collisions caused by a moving item.

```typescript
/**
 * Resolve all collisions by pushing items down
 * 
 * @param items - Array of all grid items
 * @param movingItem - The item that is moving/expanding
 * @param cols - Number of columns
 * @returns Array of items with resolved positions
 */
static resolveCollisions(
  items: GridItem[],
  movingItem: GridItem,
  cols: number
): GridItem[];
```

**Behavior**:
1. Finds all items colliding with `movingItem`
2. For each collision, pushes the other item down by `(movingItem.y + movingItem.h) - other.y`
3. Recursively resolves any new collisions caused by pushed items
4. Handles chain reactions (item A pushes B which pushes C)

---

### `GridSystem.previewMove(items, id, targetPos, cols)`

Generates a preview of what would happen if an item were moved.

```typescript
/**
 * Preview the result of moving an item (without committing)
 * 
 * @param items - Array of all grid items
 * @param id - ID of the item to preview moving
 * @param targetPos - Target position { x, y }
 * @param cols - Number of columns
 * @returns Preview result with affected item IDs
 */
static previewMove(
  items: GridItem[],
  id: string,
  targetPos: { x: number; y: number },
  cols: number
): {
  previewItems: GridItem[];
  affectedIds: string[];
  isValid: boolean;
};
```

**Behavior**:
- Same logic as `moveItem` but returns preview state
- Used during drag to show real-time feedback
- Does not modify original items array

---

## KernelStore Grid Actions

### `setGridSettings(settings)`

Updates the grid configuration for the current page.

```typescript
interface KernelActions {
  /**
   * Update grid settings
   */
  setGridSettings: (settings: Partial<GridSettings>) => void;
}
```

**Effects**:
- Merges with existing settings
- Triggers recalculation of derived pixel positions
- Triggers re-render of grid overlay

---

### `moveGridItem(nodeId, newPos)`

Moves a node to a new grid position.

```typescript
interface KernelActions {
  /**
   * Move a node to a new grid position
   * Triggers collision resolution and compaction
   */
  moveGridItem: (nodeId: string, newPos: { x: number; y: number }) => void;
}
```

**Effects**:
1. Calls `GridSystem.moveItem`
2. Updates all affected nodes' `grid` property
3. Recalculates `transform` (px position) for affected nodes
4. Pushes to undo history

---

### `resizeGridItem(nodeId, newSize)`

Resizes a node in the grid.

```typescript
interface KernelActions {
  /**
   * Resize a node in the grid
   * Triggers collision resolution and compaction
   */
  resizeGridItem: (nodeId: string, newSize: { w: number; h: number }) => void;
}
```

**Effects**:
1. Calls `GridSystem.resizeItem`
2. Updates affected nodes
3. Recalculates pixel sizes
4. Pushes to undo history

---

### `compactGrid()`

Forces a vertical compaction of all grid items.

```typescript
interface KernelActions {
  /**
   * Force compact all grid items
   */
  compactGrid: () => void;
}
```

---

### `setGridPreview(preview)`

Updates the preview state during drag/resize operations.

```typescript
interface KernelActions {
  /**
   * Update the drag/resize preview state
   */
  setGridPreview: (preview: {
    active: boolean;
    itemId: string | null;
    targetPosition: GridPosition | null;
    affectedItems: string[];
  }) => void;
}
```

---

### `migrateToGrid(nodeId)`

Migrates a single node from pixel positioning to grid positioning.

```typescript
interface KernelActions {
  /**
   * Migrate a node from px to grid coordinates
   * Uses current grid settings and container width
   */
  migrateToGrid: (nodeId: string) => void;
}
```

---

### `migrateAllToGrid()`

Migrates all nodes on the page to grid positioning.

```typescript
interface KernelActions {
  /**
   * Migrate all nodes from px to grid coordinates
   */
  migrateAllToGrid: () => void;
}
```

---

## CoordinateMapper API

**Location**: `packages/thingsvis-ui/src/utils/grid-mapper.ts`

### `gridToPixel(grid, settings, containerWidth)`

Converts grid coordinates to pixel coordinates.

```typescript
/**
 * Convert grid position to pixel rect
 * 
 * @param grid - Grid position { x, y, w, h }
 * @param settings - Grid settings
 * @param containerWidth - Current container width in pixels
 * @returns Pixel rect { x, y, width, height }
 */
export function gridToPixel(
  grid: GridPosition,
  settings: GridSettings,
  containerWidth: number
): PixelRect;
```

---

### `pixelToGrid(pixel, settings, containerWidth)`

Converts pixel coordinates to grid coordinates.

```typescript
/**
 * Convert pixel position to grid position (snap to nearest cell)
 * 
 * @param pixel - Pixel position { x, y, width?, height? }
 * @param settings - Grid settings
 * @param containerWidth - Current container width in pixels
 * @returns Grid position { x, y, w?, h? }
 */
export function pixelToGrid(
  pixel: { x: number; y: number; width?: number; height?: number },
  settings: GridSettings,
  containerWidth: number
): { x: number; y: number; w?: number; h?: number };
```

---

### `snapToGrid(pixel, settings, containerWidth)`

Snaps a pixel position to the nearest grid cell.

```typescript
/**
 * Snap a pixel position to the nearest grid cell boundary
 * 
 * @param pixel - Pixel position { x, y }
 * @param settings - Grid settings
 * @param containerWidth - Container width
 * @returns Snapped pixel position
 */
export function snapToGrid(
  pixel: { x: number; y: number },
  settings: GridSettings,
  containerWidth: number
): { x: number; y: number };
```

---

### `calculateColWidth(settings, containerWidth)`

Calculates the width of a single column in pixels.

```typescript
/**
 * Calculate column width in pixels
 * 
 * @param settings - Grid settings
 * @param containerWidth - Container width
 * @returns Column width in pixels
 */
export function calculateColWidth(
  settings: GridSettings,
  containerWidth: number
): number;

// Formula: (containerWidth - (cols - 1) * gap) / cols
```

---

### `getActiveBreakpoint(breakpoints, containerWidth)`

Determines which breakpoint is active based on container width.

```typescript
/**
 * Get the active breakpoint for current container width
 * 
 * @param breakpoints - Array of breakpoint configs (sorted by minWidth desc)
 * @param containerWidth - Current container width
 * @returns Active breakpoint config or null
 */
export function getActiveBreakpoint(
  breakpoints: BreakpointConfig[],
  containerWidth: number
): BreakpointConfig | null;
```

---

## Event Bus Events

New events emitted by the kernel for grid operations:

```typescript
// Grid layout changed (after move/resize/compact)
eventBus.emit('grid.layout.changed', {
  changedIds: string[];
  totalHeight: number;
});

// Grid settings updated
eventBus.emit('grid.settings.changed', {
  settings: GridSettings;
});

// Grid preview updated (during drag)
eventBus.emit('grid.preview.updated', {
  active: boolean;
  itemId: string | null;
  affectedIds: string[];
});

// Breakpoint changed (responsive)
eventBus.emit('grid.breakpoint.changed', {
  previousCols: number;
  newCols: number;
  breakpoint: BreakpointConfig;
});
```

---

## Error Handling

All GridSystem methods throw `GridLayoutError` for invalid operations:

```typescript
class GridLayoutError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_POSITION' | 'OUT_OF_BOUNDS' | 'ITEM_NOT_FOUND' | 'CONSTRAINT_VIOLATION',
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'GridLayoutError';
  }
}
```

**Error Codes**:
- `INVALID_POSITION`: Position has negative values or NaN
- `OUT_OF_BOUNDS`: Position exceeds grid column count
- `ITEM_NOT_FOUND`: Referenced item ID doesn't exist
- `CONSTRAINT_VIOLATION`: Size exceeds min/max constraints
