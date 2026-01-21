# Research: 栅格布局系统（Gridstack 风格）

**Feature Branch**: `002-grid-layout`  
**Date**: 2026-01-19

## Overview

This research document consolidates findings for implementing a Gridstack-style grid layout system within the existing Canvas/Leafer architecture.

---

## Decision 1: Grid Layout Engine Architecture

**Question**: How to implement a headless grid layout engine that integrates with the existing Kernel without introducing UI dependencies?

**Decision**: Implement `GridSystem` as a pure functional engine in `packages/thingsvis-kernel/src/grid/`

**Rationale**:
- Follows Constitution Principle I (Micro-Kernel & Separation of Concerns)
- GridSystem receives grid positions and outputs layout results
- No DOM/React/UI dependencies—operates purely on data
- Integrates with KernelStore via new grid-specific actions

**Alternatives Considered**:
1. Use react-grid-layout library directly → Rejected: violates kernel UI-free principle
2. Embed grid logic in UI layer → Rejected: makes testing harder, duplicates state

**Implementation Approach**:
```typescript
// GridSystem is a pure function-based engine
class GridSystem {
  // Core layout calculation - no side effects
  static compact(items: GridItem[], cols: number): GridItem[];
  static resolveCollision(items: GridItem[], movingItem: GridItem, cols: number): GridItem[];
  static moveItem(items: GridItem[], id: string, newPos: GridPosition, cols: number): GridItem[];
  static resizeItem(items: GridItem[], id: string, newSize: GridSize, cols: number): GridItem[];
}
```

---

## Decision 2: Grid Coordinate System Design

**Question**: How to handle the dual coordinate system (grid units vs. pixels)?

**Decision**: Grid coordinates are the source of truth in grid mode; pixels are derived for rendering

**Rationale**:
- Grid positions (x, y, w, h in grid units) stored in schema
- Pixel positions computed dynamically based on container width
- Column width formula: `colWidth = (containerWidth - (cols - 1) * gap) / cols`
- Row height is fixed (configurable, default 30px)

**Coordinate Mapping**:
```typescript
interface GridSettings {
  cols: number;           // Default: 24
  rowHeight: number;      // Default: 30px
  gap: number;            // Default: 10px (both horizontal and vertical)
  breakpoints?: BreakpointConfig[];
}

interface GridPosition {
  x: number;  // Start column (0-indexed)
  y: number;  // Start row (0-indexed)
  w: number;  // Width in columns (min: 1)
  h: number;  // Height in rows (min: 1)
}

// Pixel derivation (in UI layer)
function gridToPixel(grid: GridPosition, settings: GridSettings, containerWidth: number): PixelRect {
  const colWidth = (containerWidth - (settings.cols - 1) * settings.gap) / settings.cols;
  return {
    x: grid.x * (colWidth + settings.gap),
    y: grid.y * (settings.rowHeight + settings.gap),
    width: grid.w * colWidth + (grid.w - 1) * settings.gap,
    height: grid.h * settings.rowHeight + (grid.h - 1) * settings.gap,
  };
}
```

**Alternatives Considered**:
1. Store both grid and pixel coordinates → Rejected: data redundancy, sync issues
2. Pixels as source, derive grid → Rejected: loses grid precision, rounding errors accumulate

---

## Decision 3: Collision Detection & Compaction Algorithm

**Question**: How to implement efficient collision detection and vertical compaction?

**Decision**: Adopt Gridstack's proven algorithm with optimizations

**Algorithm Overview**:
1. **Collision Detection**: Check if two items overlap using bounding box intersection
2. **Push Down**: When collision detected, move conflicting items down by the minimum required distance
3. **Vertical Compaction**: After any move, compact all items upward to fill gaps (gravity effect)

**Rationale**:
- Gridstack's algorithm is well-tested and performant
- O(n²) worst case but typically O(n log n) with spatial indexing
- Handles edge cases like chain reactions and multi-item conflicts

**Algorithm Details**:
```typescript
function detectCollision(a: GridItem, b: GridItem): boolean {
  return !(
    a.x + a.w <= b.x ||  // a is left of b
    b.x + b.w <= a.x ||  // b is left of a
    a.y + a.h <= b.y ||  // a is above b
    b.y + b.h <= a.y     // b is above a
  );
}

function compactVertical(items: GridItem[], cols: number): GridItem[] {
  // Sort by y, then x
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x);
  const result: GridItem[] = [];
  
  for (const item of sorted) {
    let newY = 0;
    // Find the lowest valid position
    while (result.some(placed => detectCollision({ ...item, y: newY }, placed))) {
      newY++;
    }
    result.push({ ...item, y: newY });
  }
  return result;
}
```

**Alternatives Considered**:
1. Use R-tree spatial index → Deferred: premature optimization for <100 items
2. CSS Grid/Flexbox for layout → Rejected: doesn't provide the Gridstack-style interaction model

---

## Decision 4: Rendering Strategy for Grid Mode

**Question**: How should VisualEngine handle grid mode rendering?

**Decision**: VisualEngine renders using derived pixel positions; grid-specific visuals (grid lines, placeholders) added as overlay layers

**Rationale**:
- Preserves existing Leafer rendering pipeline
- Grid lines rendered as a background layer in VisualEngine
- Drag placeholder rendered as a semi-transparent Rect overlay
- Smooth transitions via Leafer's built-in animation support

**Rendering Layers** (z-order from bottom to top):
1. Grid background lines (dashed, subtle color)
2. Node rendering (existing pipeline, using derived px positions)
3. Connection rendering (existing)
4. Drag placeholder overlay (only during drag)
5. DOM overlays (existing, for ECharts/HTML components)

**Grid Lines Rendering**:
```typescript
// In VisualEngine, new method for grid mode
private renderGridLines(settings: GridSettings, containerWidth: number, containerHeight: number) {
  const colWidth = (containerWidth - (settings.cols - 1) * settings.gap) / settings.cols;
  const lines: Line[] = [];
  
  // Vertical lines (column separators)
  for (let i = 0; i <= settings.cols; i++) {
    const x = i * (colWidth + settings.gap) - settings.gap / 2;
    lines.push(new Line({ points: [[x, 0], [x, containerHeight]], stroke: '#e0e0e0', strokeWidth: 1, dash: [4, 4] }));
  }
  
  // Horizontal lines (row separators)
  const rowCount = Math.ceil(containerHeight / (settings.rowHeight + settings.gap));
  for (let j = 0; j <= rowCount; j++) {
    const y = j * (settings.rowHeight + settings.gap) - settings.gap / 2;
    lines.push(new Line({ points: [[0, y], [containerWidth, y]], stroke: '#e0e0e0', strokeWidth: 1, dash: [4, 4] }));
  }
  
  return lines;
}
```

---

## Decision 5: Interaction Flow for Drag/Resize

**Question**: How to wire drag/resize interactions through the grid system?

**Decision**: Intercept px-based interaction events, convert to grid operations, let Kernel compute new layout, render results

**Flow**:
```
User drags node → 
  UI captures px delta → 
  CoordinateMapper converts to grid delta → 
  Kernel.GridSystem.moveItem() computes new layout → 
  Kernel emits state update → 
  VisualEngine syncs (grid→px→render)
```

**Rationale**:
- Maintains unidirectional data flow
- Kernel remains the single source of truth
- UI only handles input translation and rendering
- Enables undo/redo through existing Kernel history

**Interaction Specifics**:
- **Drag Start**: Capture initial mouse position, show placeholder at current grid position
- **Drag Move**: Calculate target grid cell, show placeholder at snapped position, preview collision results
- **Drag End**: Commit grid position to Kernel, trigger compaction
- **Resize**: Similar flow but modifies w/h instead of x/y

**Placeholder Animation**:
- Use CSS transitions or Leafer animation for smooth 200-300ms transitions
- Placeholder follows cursor but snaps to grid visually
- Affected nodes animate to their new positions simultaneously

---

## Decision 6: Responsive Breakpoints & Mobile Adaptation

**Question**: How to handle responsive breakpoints and mobile column reduction?

**Decision**: Support configurable breakpoints with automatic column reduction

**Breakpoint Config**:
```typescript
interface BreakpointConfig {
  minWidth: number;    // Container width threshold
  cols: number;        // Number of columns at this breakpoint
  rowHeight?: number;  // Optional row height override
}

// Default breakpoints
const defaultBreakpoints: BreakpointConfig[] = [
  { minWidth: 1200, cols: 24 },
  { minWidth: 992, cols: 12 },
  { minWidth: 768, cols: 6 },
  { minWidth: 480, cols: 2 },
  { minWidth: 0, cols: 1 },    // Mobile: single column
];
```

**Column Reduction Strategy**:
- When columns reduce, items keep their relative width ratio where possible
- Items that exceed new column count are clamped to max width
- Y positions recalculated via compaction after width adjustments
- Order preserved: items sorted by original (y, x) when stacking

**Rationale**:
- Matches Gridstack behavior
- Provides usable mobile experience automatically
- Configurable for different project needs

---

## Decision 7: Data Migration from Pixel Positioning

**Question**: How to migrate existing pages with pixel positioning to grid layout?

**Decision**: Provide optional migration utility that converts px→grid on demand

**Migration Algorithm**:
```typescript
function migratePixelToGrid(
  node: NodeWithPixelPosition,
  gridSettings: GridSettings,
  designWidth: number = 1920  // Original design viewport
): GridPosition {
  const colWidth = (designWidth - (gridSettings.cols - 1) * gridSettings.gap) / gridSettings.cols;
  
  return {
    x: Math.round(node.position.x / (colWidth + gridSettings.gap)),
    y: Math.round(node.position.y / (gridSettings.rowHeight + gridSettings.gap)),
    w: Math.max(1, Math.round(node.size.width / colWidth)),
    h: Math.max(1, Math.round(node.size.height / gridSettings.rowHeight)),
  };
}
```

**Rationale**:
- Uses "just-in-time" migration rather than forced bulk migration
- Preserves original px values until explicitly migrated
- Follows Constitution Principle IV (Backward Compatibility)

**Migration Flow**:
1. User switches page to grid mode
2. System prompts: "Migrate existing components to grid layout?"
3. If yes: run migration, apply compaction, save
4. If no: keep px positions, disable grid features for those nodes

---

## Decision 8: State Management Extensions

**Question**: What changes are needed in KernelStore for grid support?

**Decision**: Extend CanvasState and add grid-specific actions

**Store Extensions**:
```typescript
// Extended CanvasState
interface CanvasState {
  mode: 'fixed' | 'infinite' | 'grid';  // Add 'grid' mode
  // ... existing fields
  gridSettings?: GridSettings;  // Only present in grid mode
}

// New Grid Actions
interface GridActions {
  setGridSettings: (settings: GridSettings) => void;
  moveGridItem: (nodeId: string, newPos: { x: number; y: number }) => void;
  resizeGridItem: (nodeId: string, newSize: { w: number; h: number }) => void;
  compactGrid: () => void;
}
```

**Node Schema Extension**:
```typescript
// Extended NodeSchemaType
interface NodeSchemaType {
  id: string;
  type: string;
  position: { x: number; y: number };      // Pixel position (derived in grid mode)
  size: { width: number; height: number }; // Pixel size (derived in grid mode)
  grid?: GridPosition;                      // NEW: Grid position (source of truth in grid mode)
  // ... other fields
}
```

---

## Decision 9: Performance Optimization Strategies

**Question**: How to ensure ≥50 FPS with 50+ nodes during grid operations?

**Decision**: Implement performance optimizations at multiple levels

**Optimizations**:
1. **Debounced Compaction**: During drag, only preview collision results; full compaction on drop
2. **Batched State Updates**: Aggregate multiple grid changes into single store update
3. **Virtual Grid Lines**: Only render visible grid lines within viewport
4. **Layout Caching**: Cache layout results until grid settings or item positions change
5. **RAF Throttling**: Limit placeholder updates to requestAnimationFrame timing

**Benchmarks Target**:
- Compaction calculation: <10ms for 100 items
- Collision detection (single item): <1ms
- Grid line rendering: <5ms
- Total frame budget: <16ms (60 FPS)

---

## Decision 10: Integration with Existing Canvas Modes

**Question**: How does grid mode coexist with fixed/infinite modes?

**Decision**: Grid mode is mutually exclusive with fixed/infinite at the page level

**Mode Switching**:
- `mode: 'fixed'` → Uses existing px positioning, no grid features
- `mode: 'infinite'` → Uses existing px positioning, no grid features  
- `mode: 'grid'` → Uses grid positioning, px derived for rendering

**Shared Infrastructure**:
- Selection system works unchanged
- Layer ordering works unchanged
- Data binding/events work unchanged
- Transform handles adapted for grid snapping

**No Hybrid Mode**: A single page cannot mix grid and free-form positioned nodes (simplifies logic, matches Gridstack behavior)

---

## Summary of Key Decisions

| Decision | Choice | Impact |
|----------|--------|--------|
| Engine Architecture | Headless GridSystem in Kernel | Clean separation, testable |
| Coordinate System | Grid as source, px derived | Single source of truth |
| Collision Algorithm | Gridstack-style push-down + compact | Proven, predictable |
| Rendering | Overlay layers in VisualEngine | Non-invasive, reuses Leafer |
| Interactions | px→grid→kernel→render flow | Unidirectional, undo-friendly |
| Breakpoints | Configurable with defaults | Responsive out-of-box |
| Migration | Optional, on-demand | Backward compatible |
| State | CanvasState + NodeSchema extensions | Minimal schema changes |
| Performance | Debounce + batch + cache | Meets 50 FPS target |
| Mode Coexistence | Mutually exclusive modes | Clear semantics |
