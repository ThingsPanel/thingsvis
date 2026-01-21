# Data Model: 栅格布局系统

**Feature Branch**: `002-grid-layout`  
**Date**: 2026-01-19

## Overview

This document defines the data model extensions for the Gridstack-style grid layout system. All new schemas follow the project's Schema-First approach using Zod.

---

## Entity Definitions

### 1. GridSettings (栅格配置)

**Purpose**: Defines the grid system parameters for a page in grid layout mode.

**Location**: `packages/thingsvis-schema/src/grid/grid-settings.ts`

```typescript
import { z } from 'zod';

/**
 * Breakpoint configuration for responsive grid
 */
export const BreakpointConfigSchema = z.object({
  /**
   * Minimum container width for this breakpoint (inclusive)
   */
  minWidth: z.number().int().nonnegative(),
  
  /**
   * Number of columns at this breakpoint
   */
  cols: z.number().int().min(1).max(48),
  
  /**
   * Optional row height override for this breakpoint
   */
  rowHeight: z.number().int().positive().optional(),
});

/**
 * Grid layout settings schema
 */
export const GridSettingsSchema = z.object({
  /**
   * Number of columns in the grid (1-48, default: 24)
   */
  cols: z.number().int().min(1).max(48).default(24),
  
  /**
   * Height of each row in pixels (default: 30)
   */
  rowHeight: z.number().int().positive().default(30),
  
  /**
   * Gap between grid items in pixels (default: 10)
   * Applied both horizontally and vertically
   */
  gap: z.number().int().nonnegative().default(10),
  
  /**
   * Enable/disable vertical compaction (default: true)
   * When true, items float up to fill gaps
   */
  compactVertical: z.boolean().default(true),
  
  /**
   * Minimum item width in columns (default: 1)
   */
  minW: z.number().int().min(1).default(1),
  
  /**
   * Minimum item height in rows (default: 1)
   */
  minH: z.number().int().min(1).default(1),
  
  /**
   * Show grid lines helper (default: true in edit mode)
   */
  showGridLines: z.boolean().default(true),
  
  /**
   * Responsive breakpoints configuration
   * If empty, uses default breakpoints
   */
  breakpoints: z.array(BreakpointConfigSchema).default([]),
  
  /**
   * Enable responsive mode (default: true)
   */
  responsive: z.boolean().default(true),
});

export type BreakpointConfig = z.infer<typeof BreakpointConfigSchema>;
export type GridSettings = z.infer<typeof GridSettingsSchema>;

/**
 * Default breakpoints for responsive grid
 */
export const DEFAULT_BREAKPOINTS: BreakpointConfig[] = [
  { minWidth: 1200, cols: 24 },
  { minWidth: 992, cols: 12 },
  { minWidth: 768, cols: 6 },
  { minWidth: 480, cols: 2 },
  { minWidth: 0, cols: 1 },
];
```

---

### 2. GridPosition (栅格位置)

**Purpose**: Defines a component's position and size within the grid coordinate system.

**Location**: `packages/thingsvis-schema/src/grid/grid-position.ts`

```typescript
import { z } from 'zod';

/**
 * Grid position schema for a component
 * Coordinates are in grid units (columns/rows), not pixels
 */
export const GridPositionSchema = z.object({
  /**
   * Starting column (0-indexed)
   */
  x: z.number().int().nonnegative(),
  
  /**
   * Starting row (0-indexed)
   */
  y: z.number().int().nonnegative(),
  
  /**
   * Width in columns (minimum: 1)
   */
  w: z.number().int().min(1),
  
  /**
   * Height in rows (minimum: 1)
   */
  h: z.number().int().min(1),
  
  /**
   * Whether this item is static (cannot be moved/resized)
   * Default: false
   */
  static: z.boolean().default(false),
  
  /**
   * Whether this item can be dragged
   * Default: true
   */
  isDraggable: z.boolean().default(true),
  
  /**
   * Whether this item can be resized
   * Default: true
   */
  isResizable: z.boolean().default(true),
  
  /**
   * Minimum width constraint in columns
   */
  minW: z.number().int().min(1).optional(),
  
  /**
   * Maximum width constraint in columns
   */
  maxW: z.number().int().min(1).optional(),
  
  /**
   * Minimum height constraint in rows
   */
  minH: z.number().int().min(1).optional(),
  
  /**
   * Maximum height constraint in rows
   */
  maxH: z.number().int().min(1).optional(),
});

export type GridPosition = z.infer<typeof GridPositionSchema>;

/**
 * Default grid position for new items
 */
export const DEFAULT_GRID_POSITION: GridPosition = {
  x: 0,
  y: 0,
  w: 4,
  h: 2,
  static: false,
  isDraggable: true,
  isResizable: true,
};
```

---

### 3. Extended PageConfig (页面配置扩展)

**Purpose**: Extends the existing PageConfigSchema to support grid layout mode.

**Location**: `packages/thingsvis-schema/src/page.ts` (modifications)

```typescript
import { z } from 'zod';
import { GridSettingsSchema } from './grid/grid-settings';

/**
 * Layout mode enum - extended with 'grid'
 */
export const LayoutModeSchema = z.enum(['fixed', 'infinite', 'reflow', 'grid']);
export type LayoutMode = z.infer<typeof LayoutModeSchema>;

/**
 * Extended Page configuration schema
 */
export const PageConfigSchema = z.object({
  /**
   * Page layout mode
   * - 'fixed': Fixed canvas size, centered
   * - 'infinite': Infinite canvas with pan/zoom
   * - 'reflow': Responsive reflow layout
   * - 'grid': Gridstack-style grid layout (NEW)
   */
  mode: LayoutModeSchema,
  
  /**
   * Page width in pixels (defaults to 1920)
   * For grid mode: defines the design-time reference width
   */
  width: z.number().int().positive().default(1920),
  
  /**
   * Page height in pixels (defaults to 1080)
   * For grid mode: minimum height, expands with content
   */
  height: z.number().int().positive().default(1080),
  
  /**
   * Visual theme preference
   */
  theme: z.enum(['dark', 'light', 'auto']),
  
  /**
   * Grid layout settings (only used when mode === 'grid')
   */
  gridSettings: GridSettingsSchema.optional(),
});

export type IPageConfig = z.infer<typeof PageConfigSchema>;
```

---

### 4. Extended VisualComponent (组件扩展)

**Purpose**: Extends the existing component schema to include optional grid positioning.

**Location**: `packages/thingsvis-schema/src/component.ts` (modifications)

```typescript
import { z } from 'zod';
import { GridPositionSchema } from './grid/grid-position';

/**
 * Extended visual component schema with grid support
 */
export const VisualComponentSchema = z.object({
  identity: ComponentIdentitySchema,
  
  /**
   * Pixel-based transform (x, y, width, height, rotation)
   * In grid mode: these values are DERIVED from grid position
   */
  transform: ComponentTransformSchema,
  
  data: ComponentDataSchema,
  props: ComponentPropsSchema,
  events: z.array(ComponentEventSchema).default([]),
  
  /**
   * Grid position (optional, only used in grid mode)
   * When present and page is in grid mode, this is the source of truth
   * The transform values are derived from grid position for rendering
   */
  grid: GridPositionSchema.optional(),
});

export type IVisualComponent = z.infer<typeof VisualComponentSchema>;
```

---

### 5. GridItem (内部运算用)

**Purpose**: Internal representation used by GridSystem for layout calculations.

**Location**: `packages/thingsvis-kernel/src/grid/types.ts`

```typescript
/**
 * Internal grid item representation for layout calculations
 * Used within GridSystem, not persisted
 */
export interface GridItem {
  /** Node ID reference */
  id: string;
  
  /** Grid coordinates (source of truth) */
  x: number;
  y: number;
  w: number;
  h: number;
  
  /** Constraints */
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  
  /** Interaction flags */
  static?: boolean;
  isDraggable?: boolean;
  isResizable?: boolean;
  
  /** Layout state (runtime only) */
  moving?: boolean;
  placeholder?: boolean;
}

/**
 * Layout result from GridSystem operations
 */
export interface GridLayoutResult {
  /** Updated items with new positions */
  items: GridItem[];
  
  /** IDs of items that changed position */
  changedIds: string[];
  
  /** Total grid height (max y + h of all items) */
  totalHeight: number;
}

/**
 * Grid coordinate change for move/resize operations
 */
export interface GridDelta {
  dx?: number;  // Column change
  dy?: number;  // Row change
  dw?: number;  // Width change
  dh?: number;  // Height change
}
```

---

### 6. GridState (Kernel状态扩展)

**Purpose**: Extends KernelState to track grid-specific runtime state.

**Location**: `packages/thingsvis-kernel/src/store/KernelStore.ts` (modifications)

```typescript
/**
 * Grid-specific runtime state
 */
export interface GridState {
  /** Current active breakpoint (derived from container width) */
  activeBreakpoint: BreakpointConfig | null;
  
  /** Cached column width in pixels (recalculated on resize) */
  colWidth: number;
  
  /** Current container width */
  containerWidth: number;
  
  /** Effective column count (may differ from settings due to breakpoint) */
  effectiveCols: number;
  
  /** Drag/resize preview state */
  preview: {
    active: boolean;
    itemId: string | null;
    targetPosition: GridPosition | null;
    affectedItems: string[];  // IDs of items that will move
  };
  
  /** Total grid height in pixels (for scrolling) */
  totalHeight: number;
}

/**
 * Extended CanvasState with grid support
 */
export interface CanvasState {
  mode: 'fixed' | 'infinite' | 'reflow' | 'grid';
  width: number;
  height: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
  
  /** Grid state (only populated in grid mode) */
  gridState?: GridState;
}
```

---

## Entity Relationships

```
┌─────────────────┐
│     IPage       │
├─────────────────┤
│ meta            │
│ config ─────────┼──────────────────────────────────────┐
│ content         │                                      │
└────────┬────────┘                                      │
         │                                               │
         │ contains                                      │
         ▼                                               │
┌─────────────────┐                              ┌───────┴───────┐
│ IPageContent    │                              │  IPageConfig  │
├─────────────────┤                              ├───────────────┤
│ nodes[]─────────┼──┐                           │ mode          │
└─────────────────┘  │                           │ width, height │
                     │                           │ theme         │
                     │ contains                  │ gridSettings? ├───┐
                     ▼                           └───────────────┘   │
         ┌─────────────────────┐                                     │
         │  IVisualComponent   │                                     │
         ├─────────────────────┤                                     │
         │ identity            │                                     │
         │ transform           │ ◄── derived from grid in grid mode  │
         │ data                │                                     │
         │ props               │                                     │
         │ events              │                                     │
         │ grid? ──────────────┼──┐                                  │
         └─────────────────────┘  │                                  │
                                  │                                  │
                                  ▼                                  ▼
                      ┌─────────────────┐               ┌─────────────────┐
                      │  GridPosition   │               │  GridSettings   │
                      ├─────────────────┤               ├─────────────────┤
                      │ x, y, w, h      │               │ cols            │
                      │ static?         │               │ rowHeight       │
                      │ isDraggable?    │               │ gap             │
                      │ isResizable?    │               │ breakpoints[]   │
                      │ minW/maxW?      │               │ compactVertical │
                      │ minH/maxH?      │               │ showGridLines   │
                      └─────────────────┘               └─────────────────┘
```

---

## State Transitions

### GridPosition State Machine

```
                    ┌──────────────┐
                    │   Initial    │
                    │ (x,y,w,h)    │
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
   │   Dragging   │ │   Resizing   │ │   Compact    │
   │  (preview)   │ │  (preview)   │ │  (auto)      │
   └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
          │                │                │
          │ drop           │ release        │ complete
          ▼                ▼                ▼
   ┌──────────────────────────────────────────────┐
   │              Collision Detection             │
   └──────────────────────┬───────────────────────┘
                          │
                          ▼
   ┌──────────────────────────────────────────────┐
   │              Push Down (if collision)        │
   └──────────────────────┬───────────────────────┘
                          │
                          ▼
   ┌──────────────────────────────────────────────┐
   │              Vertical Compaction             │
   └──────────────────────┬───────────────────────┘
                          │
                          ▼
                    ┌──────────────┐
                    │   Settled    │
                    │ (new x,y,w,h)│
                    └──────────────┘
```

---

## Validation Rules

### GridPosition Validation

1. `x >= 0` and `x + w <= cols` (item within grid bounds)
2. `y >= 0` (no negative rows)
3. `w >= minW` and `w <= maxW` (if constraints set)
4. `h >= minH` and `h <= maxH` (if constraints set)
5. `w >= 1` and `h >= 1` (minimum size)

### GridSettings Validation

1. `cols >= 1` and `cols <= 48`
2. `rowHeight > 0`
3. `gap >= 0`
4. `breakpoints` sorted by `minWidth` descending (if provided)
5. At least one breakpoint with `minWidth: 0` if breakpoints array is non-empty

---

## Migration Schema

For migrating from pixel-based positioning to grid:

```typescript
/**
 * Migration record for tracking px→grid conversion
 */
export interface MigrationRecord {
  /** Original pixel position */
  originalTransform: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  
  /** Converted grid position */
  gridPosition: GridPosition;
  
  /** Design width used for conversion */
  designWidth: number;
  
  /** Grid settings used for conversion */
  gridSettingsSnapshot: GridSettings;
  
  /** Migration timestamp */
  migratedAt: string;
}
```

---

## Index Export

**Location**: `packages/thingsvis-schema/src/grid/index.ts`

```typescript
export {
  GridSettingsSchema,
  BreakpointConfigSchema,
  DEFAULT_BREAKPOINTS,
  type GridSettings,
  type BreakpointConfig,
} from './grid-settings';

export {
  GridPositionSchema,
  DEFAULT_GRID_POSITION,
  type GridPosition,
} from './grid-position';
```
