# Grid Schema Contract

**Feature Branch**: `002-grid-layout`  
**Date**: 2026-01-19

## Overview

This document defines the Zod schema contracts for the grid layout system. All schemas are defined in `packages/thingsvis-schema/src/grid/`.

---

## GridSettings Schema

**File**: `packages/thingsvis-schema/src/grid/grid-settings.ts`

### Schema Definition

```typescript
import { z } from 'zod';

export const BreakpointConfigSchema = z.object({
  minWidth: z.number().int().nonnegative(),
  cols: z.number().int().min(1).max(48),
  rowHeight: z.number().int().positive().optional(),
});

export const GridSettingsSchema = z.object({
  cols: z.number().int().min(1).max(48).default(24),
  rowHeight: z.number().int().positive().default(30),
  gap: z.number().int().nonnegative().default(10),
  compactVertical: z.boolean().default(true),
  minW: z.number().int().min(1).default(1),
  minH: z.number().int().min(1).default(1),
  showGridLines: z.boolean().default(true),
  breakpoints: z.array(BreakpointConfigSchema).default([]),
  responsive: z.boolean().default(true),
});
```

### Example Values

```json
// Minimal (uses all defaults)
{}

// Fully specified
{
  "cols": 24,
  "rowHeight": 30,
  "gap": 10,
  "compactVertical": true,
  "minW": 1,
  "minH": 1,
  "showGridLines": true,
  "responsive": true,
  "breakpoints": [
    { "minWidth": 1200, "cols": 24 },
    { "minWidth": 992, "cols": 12 },
    { "minWidth": 768, "cols": 6 },
    { "minWidth": 0, "cols": 1 }
  ]
}

// Dashboard with larger cells
{
  "cols": 12,
  "rowHeight": 60,
  "gap": 16
}

// Mobile-first design
{
  "cols": 4,
  "rowHeight": 40,
  "gap": 8,
  "responsive": true,
  "breakpoints": [
    { "minWidth": 768, "cols": 8 },
    { "minWidth": 1024, "cols": 12 },
    { "minWidth": 0, "cols": 4 }
  ]
}
```

### Validation Rules

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| cols | integer | 1-48 | 24 |
| rowHeight | integer | > 0 | 30 |
| gap | integer | ≥ 0 | 10 |
| compactVertical | boolean | - | true |
| minW | integer | ≥ 1 | 1 |
| minH | integer | ≥ 1 | 1 |
| showGridLines | boolean | - | true |
| responsive | boolean | - | true |
| breakpoints | array | - | [] |

---

## GridPosition Schema

**File**: `packages/thingsvis-schema/src/grid/grid-position.ts`

### Schema Definition

```typescript
import { z } from 'zod';

export const GridPositionSchema = z.object({
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
  w: z.number().int().min(1),
  h: z.number().int().min(1),
  static: z.boolean().default(false),
  isDraggable: z.boolean().default(true),
  isResizable: z.boolean().default(true),
  minW: z.number().int().min(1).optional(),
  maxW: z.number().int().min(1).optional(),
  minH: z.number().int().min(1).optional(),
  maxH: z.number().int().min(1).optional(),
});
```

### Example Values

```json
// Minimal (required fields only)
{
  "x": 0,
  "y": 0,
  "w": 4,
  "h": 2
}

// Full featured widget
{
  "x": 4,
  "y": 0,
  "w": 8,
  "h": 4,
  "static": false,
  "isDraggable": true,
  "isResizable": true,
  "minW": 4,
  "maxW": 12,
  "minH": 2,
  "maxH": 8
}

// Static header widget
{
  "x": 0,
  "y": 0,
  "w": 24,
  "h": 2,
  "static": true,
  "isDraggable": false,
  "isResizable": false
}

// Small info card
{
  "x": 0,
  "y": 2,
  "w": 4,
  "h": 2,
  "minW": 2,
  "minH": 2
}
```

### Validation Rules

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| x | integer | ≥ 0 | - |
| y | integer | ≥ 0 | - |
| w | integer | ≥ 1 | - |
| h | integer | ≥ 1 | - |
| static | boolean | - | false |
| isDraggable | boolean | - | true |
| isResizable | boolean | - | true |
| minW | integer? | ≥ 1 | undefined |
| maxW | integer? | ≥ 1 | undefined |
| minH | integer? | ≥ 1 | undefined |
| maxH | integer? | ≥ 1 | undefined |

### Cross-Field Validation

```typescript
// Additional refinements applied after parsing
GridPositionSchema.refine(
  (data) => !data.minW || !data.maxW || data.minW <= data.maxW,
  { message: "minW must be <= maxW" }
).refine(
  (data) => !data.minH || !data.maxH || data.minH <= data.maxH,
  { message: "minH must be <= maxH" }
).refine(
  (data) => data.w >= (data.minW ?? 1) && data.w <= (data.maxW ?? Infinity),
  { message: "w must be within minW/maxW bounds" }
).refine(
  (data) => data.h >= (data.minH ?? 1) && data.h <= (data.maxH ?? Infinity),
  { message: "h must be within minH/maxH bounds" }
);
```

---

## Extended PageConfig Schema

**File**: `packages/thingsvis-schema/src/page.ts` (modifications)

### Schema Definition

```typescript
import { z } from 'zod';
import { GridSettingsSchema } from './grid';

export const LayoutModeSchema = z.enum(['fixed', 'infinite', 'reflow', 'grid']);

export const PageConfigSchema = z.object({
  mode: LayoutModeSchema,
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  theme: z.enum(['dark', 'light', 'auto']),
  gridSettings: GridSettingsSchema.optional(),
}).refine(
  (data) => data.mode !== 'grid' || data.gridSettings !== undefined,
  { message: "gridSettings required when mode is 'grid'" }
);
```

### Example Values

```json
// Fixed mode (unchanged)
{
  "mode": "fixed",
  "width": 1920,
  "height": 1080,
  "theme": "dark"
}

// Grid mode
{
  "mode": "grid",
  "width": 1920,
  "height": 1080,
  "theme": "dark",
  "gridSettings": {
    "cols": 24,
    "rowHeight": 30,
    "gap": 10
  }
}

// Grid mode with responsive breakpoints
{
  "mode": "grid",
  "width": 1920,
  "height": 1080,
  "theme": "light",
  "gridSettings": {
    "cols": 24,
    "rowHeight": 40,
    "gap": 12,
    "responsive": true,
    "breakpoints": [
      { "minWidth": 1200, "cols": 24 },
      { "minWidth": 768, "cols": 12 },
      { "minWidth": 0, "cols": 1 }
    ]
  }
}
```

---

## Extended VisualComponent Schema

**File**: `packages/thingsvis-schema/src/component.ts` (modifications)

### Schema Definition

```typescript
import { z } from 'zod';
import { GridPositionSchema } from './grid';

export const VisualComponentSchema = z.object({
  identity: ComponentIdentitySchema,
  transform: ComponentTransformSchema,
  data: ComponentDataSchema,
  props: ComponentPropsSchema,
  events: z.array(ComponentEventSchema).default([]),
  grid: GridPositionSchema.optional(),
});
```

### Example Values

```json
// Component without grid (fixed/infinite mode)
{
  "identity": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "basic/text",
    "name": "Title",
    "locked": false,
    "hidden": false
  },
  "transform": {
    "x": 100,
    "y": 50,
    "width": 300,
    "height": 80,
    "rotation": 0
  },
  "data": {
    "sourceId": "",
    "topic": "",
    "transform": ""
  },
  "props": {
    "text": "Dashboard Title"
  },
  "events": []
}

// Component with grid position (grid mode)
{
  "identity": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "type": "chart/line",
    "name": "Sales Chart",
    "locked": false,
    "hidden": false
  },
  "transform": {
    "x": 0,
    "y": 0,
    "width": 480,
    "height": 240,
    "rotation": 0
  },
  "data": {
    "sourceId": "sales-api",
    "topic": "monthly",
    "transform": ""
  },
  "props": {
    "title": "Monthly Sales"
  },
  "events": [],
  "grid": {
    "x": 0,
    "y": 0,
    "w": 8,
    "h": 4,
    "minW": 4,
    "minH": 2
  }
}
```

---

## Complete Page Example

A complete page document in grid mode:

```json
{
  "meta": {
    "id": "550e8400-e29b-41d4-a716-446655440100",
    "version": "1.0.0",
    "name": "Sales Dashboard",
    "scope": "app"
  },
  "config": {
    "mode": "grid",
    "width": 1920,
    "height": 1080,
    "theme": "dark",
    "gridSettings": {
      "cols": 24,
      "rowHeight": 40,
      "gap": 12,
      "compactVertical": true,
      "showGridLines": true,
      "responsive": true,
      "breakpoints": [
        { "minWidth": 1200, "cols": 24 },
        { "minWidth": 768, "cols": 12 },
        { "minWidth": 0, "cols": 1 }
      ]
    }
  },
  "content": {
    "nodes": [
      {
        "identity": {
          "id": "header-001",
          "type": "basic/text",
          "name": "Header",
          "locked": false,
          "hidden": false
        },
        "transform": { "x": 0, "y": 0, "width": 1908, "height": 80, "rotation": 0 },
        "data": { "sourceId": "", "topic": "", "transform": "" },
        "props": { "text": "Sales Dashboard" },
        "events": [],
        "grid": { "x": 0, "y": 0, "w": 24, "h": 2, "static": true }
      },
      {
        "identity": {
          "id": "chart-001",
          "type": "chart/line",
          "name": "Revenue Chart",
          "locked": false,
          "hidden": false
        },
        "transform": { "x": 0, "y": 92, "width": 636, "height": 320, "rotation": 0 },
        "data": { "sourceId": "sales-api", "topic": "revenue", "transform": "" },
        "props": {},
        "events": [],
        "grid": { "x": 0, "y": 2, "w": 8, "h": 8 }
      },
      {
        "identity": {
          "id": "chart-002",
          "type": "chart/bar",
          "name": "Sales by Region",
          "locked": false,
          "hidden": false
        },
        "transform": { "x": 648, "y": 92, "width": 636, "height": 320, "rotation": 0 },
        "data": { "sourceId": "sales-api", "topic": "regions", "transform": "" },
        "props": {},
        "events": [],
        "grid": { "x": 8, "y": 2, "w": 8, "h": 8 }
      },
      {
        "identity": {
          "id": "kpi-001",
          "type": "basic/kpi",
          "name": "Total Revenue",
          "locked": false,
          "hidden": false
        },
        "transform": { "x": 1296, "y": 92, "width": 612, "height": 160, "rotation": 0 },
        "data": { "sourceId": "sales-api", "topic": "totals", "transform": "" },
        "props": { "label": "Total Revenue" },
        "events": [],
        "grid": { "x": 16, "y": 2, "w": 8, "h": 4 }
      }
    ]
  }
}
```

---

## Schema Migration Path

### v1.0.0 → v1.1.0 (Adding Grid Support)

**Backward Compatible**: Yes

**Changes**:
1. `PageConfigSchema.mode` enum extended with `'grid'`
2. `PageConfigSchema` gains optional `gridSettings` field
3. `VisualComponentSchema` gains optional `grid` field

**Migration Strategy**:
- Existing documents parse without modification
- `grid` field absence means component uses `transform` directly
- When `mode: 'grid'` and `grid` is missing, migration can be triggered

**Validation**:
```typescript
// Old document (still valid)
const oldDoc = {
  config: { mode: 'fixed', width: 1920, height: 1080, theme: 'dark' },
  // ...
};
PageConfigSchema.parse(oldDoc.config); // ✅ Passes

// New document (grid mode)
const newDoc = {
  config: {
    mode: 'grid',
    width: 1920,
    height: 1080,
    theme: 'dark',
    gridSettings: { cols: 24, rowHeight: 30, gap: 10 }
  },
  // ...
};
PageConfigSchema.parse(newDoc.config); // ✅ Passes
```

---

## TypeScript Types (Derived)

```typescript
// Re-exported from packages/thingsvis-schema/src/grid/index.ts

export type GridSettings = z.infer<typeof GridSettingsSchema>;
export type BreakpointConfig = z.infer<typeof BreakpointConfigSchema>;
export type GridPosition = z.infer<typeof GridPositionSchema>;
export type LayoutMode = z.infer<typeof LayoutModeSchema>;

// Updated existing types
export type IPageConfig = z.infer<typeof PageConfigSchema>;
export type IVisualComponent = z.infer<typeof VisualComponentSchema>;
```
