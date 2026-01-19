# Quickstart: 栅格布局系统

**Feature Branch**: `002-grid-layout`  
**Date**: 2026-01-19

## Overview

This quickstart guide covers how to use the Gridstack-style grid layout system in ThingsVis.

---

## Prerequisites

- ThingsVis Studio is running (`pnpm dev` in `apps/studio`)
- Familiarity with the existing canvas modes (fixed/infinite)

---

## Quick Start: Enable Grid Mode

### 1. Create or Open a Page

In Studio, create a new page or open an existing one.

### 2. Switch to Grid Mode

1. Open the **Page Settings** panel (gear icon in top toolbar)
2. Under **Layout Mode**, select **Grid**
3. Configure grid settings:
   - **Columns**: 24 (default, suitable for most dashboards)
   - **Row Height**: 30px (default)
   - **Gap**: 10px (default)

```json
// Resulting page config
{
  "mode": "grid",
  "gridSettings": {
    "cols": 24,
    "rowHeight": 30,
    "gap": 10
  }
}
```

### 3. Add Components

Drag components from the left panel onto the canvas. They will automatically snap to grid cells.

---

## Grid Interactions

### Drag to Reposition

1. Click and hold a component
2. Drag to a new position
3. A **placeholder** shows where the component will land
4. If other components are in the way, they **push down** automatically
5. Release to drop

### Resize Components

1. Hover over a component edge or corner
2. Drag to resize
3. Size snaps to whole grid cells
4. Other components push down if needed

### Vertical Compaction

When you move or delete a component, others automatically **float up** to fill gaps. This keeps your layout compact.

---

## Grid Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `cols` | number | 24 | Number of columns |
| `rowHeight` | number | 30 | Row height in pixels |
| `gap` | number | 10 | Gap between items (px) |
| `compactVertical` | boolean | true | Auto-compact items upward |
| `showGridLines` | boolean | true | Show grid helper lines |
| `responsive` | boolean | true | Enable responsive breakpoints |

### Column Recommendations

| Use Case | Recommended Columns |
|----------|---------------------|
| Dashboard | 24 |
| Data cards | 12 |
| Mobile-first | 4 |
| Simple layout | 6 |

---

## Component Grid Properties

Each component in grid mode has these properties:

```typescript
interface GridPosition {
  x: number;   // Start column (0-indexed)
  y: number;   // Start row (0-indexed)
  w: number;   // Width in columns
  h: number;   // Height in rows
  static?: boolean;      // Cannot be moved
  isDraggable?: boolean; // Can be dragged
  isResizable?: boolean; // Can be resized
  minW?: number;         // Minimum width
  maxW?: number;         // Maximum width
  minH?: number;         // Minimum height
  maxH?: number;         // Maximum height
}
```

### Example: Static Header

Make a component that spans the full width and cannot be moved:

```json
{
  "grid": {
    "x": 0,
    "y": 0,
    "w": 24,
    "h": 2,
    "static": true
  }
}
```

### Example: Constrained Chart

A chart that must be at least 4 columns wide:

```json
{
  "grid": {
    "x": 0,
    "y": 2,
    "w": 8,
    "h": 4,
    "minW": 4,
    "minH": 2
  }
}
```

---

## Responsive Breakpoints

Configure how the grid adapts to different screen sizes:

```json
{
  "gridSettings": {
    "cols": 24,
    "responsive": true,
    "breakpoints": [
      { "minWidth": 1200, "cols": 24 },
      { "minWidth": 992, "cols": 12 },
      { "minWidth": 768, "cols": 6 },
      { "minWidth": 0, "cols": 1 }
    ]
  }
}
```

| Screen Width | Columns | Behavior |
|--------------|---------|----------|
| ≥1200px | 24 | Full desktop layout |
| 992-1199px | 12 | Tablet layout |
| 768-991px | 6 | Small tablet |
| <768px | 1 | Mobile (stacked) |

---

## Migration from Pixel Positioning

If you have existing pages with pixel-based positioning:

### Automatic Migration

1. Open the page in Studio
2. Switch layout mode to **Grid**
3. When prompted, click **"Migrate to Grid"**
4. Components are converted to grid coordinates using nearest-cell snapping
5. Vertical compaction is applied to clean up the layout

### Manual Migration

For precise control, set grid positions manually in the component properties panel.

### Formula

The migration uses this formula:

```typescript
gridX = Math.round(pixelX / (colWidth + gap));
gridY = Math.round(pixelY / (rowHeight + gap));
gridW = Math.max(1, Math.round(pixelWidth / colWidth));
gridH = Math.max(1, Math.round(pixelHeight / rowHeight));
```

Where `colWidth = (containerWidth - (cols - 1) * gap) / cols`

---

## Programmatic Usage

### Create a Grid Page

```typescript
import { createKernelStore } from '@thingsvis/kernel';
import { PageSchema } from '@thingsvis/schema';

const page = {
  meta: {
    id: crypto.randomUUID(),
    version: '1.0.0',
    name: 'My Dashboard',
    scope: 'app',
  },
  config: {
    mode: 'grid',
    width: 1920,
    height: 1080,
    theme: 'dark',
    gridSettings: {
      cols: 24,
      rowHeight: 40,
      gap: 12,
    },
  },
  content: { nodes: [] },
};

const store = createKernelStore();
store.getState().loadPage(page);
```

### Add a Grid Component

```typescript
const { addNodes } = store.getState();

addNodes([{
  id: crypto.randomUUID(),
  type: 'chart/line',
  name: 'Sales Chart',
  position: { x: 0, y: 0 },       // Will be overwritten by grid
  size: { width: 0, height: 0 },  // Will be calculated from grid
  props: { title: 'Monthly Sales' },
  grid: {
    x: 0,
    y: 0,
    w: 8,
    h: 4,
  },
}]);
```

### Move a Grid Component

```typescript
const { moveGridItem } = store.getState();

// Move component to column 8, row 2
moveGridItem('component-id', { x: 8, y: 2 });
```

### Resize a Grid Component

```typescript
const { resizeGridItem } = store.getState();

// Make component 12 columns wide, 6 rows tall
resizeGridItem('component-id', { w: 12, h: 6 });
```

### Listen for Grid Changes

```typescript
import { eventBus } from '@thingsvis/kernel';

eventBus.on('grid.layout.changed', ({ changedIds, totalHeight }) => {
  console.log('Components moved:', changedIds);
  console.log('New grid height:', totalHeight);
});
```

---

## Testing Your Grid Layout

### Unit Test Example

```typescript
import { GridSystem } from '@thingsvis/kernel';

describe('GridSystem', () => {
  it('should detect collision', () => {
    const a = { id: '1', x: 0, y: 0, w: 4, h: 2 };
    const b = { id: '2', x: 2, y: 1, w: 4, h: 2 };
    
    expect(GridSystem.detectCollision(a, b)).toBe(true);
  });

  it('should compact items vertically', () => {
    const items = [
      { id: '1', x: 0, y: 5, w: 4, h: 2 },  // Has gap above
      { id: '2', x: 4, y: 0, w: 4, h: 2 },
    ];
    
    const result = GridSystem.compact(items, 24);
    
    expect(result.items.find(i => i.id === '1')?.y).toBe(0);  // Floated up
  });
});
```

---

## Common Patterns

### Dashboard with Header

```json
[
  { "id": "header", "grid": { "x": 0, "y": 0, "w": 24, "h": 2, "static": true } },
  { "id": "chart1", "grid": { "x": 0, "y": 2, "w": 8, "h": 6 } },
  { "id": "chart2", "grid": { "x": 8, "y": 2, "w": 8, "h": 6 } },
  { "id": "kpi1", "grid": { "x": 16, "y": 2, "w": 8, "h": 3 } },
  { "id": "kpi2", "grid": { "x": 16, "y": 5, "w": 8, "h": 3 } }
]
```

### Card Grid

```json
[
  { "id": "card1", "grid": { "x": 0, "y": 0, "w": 6, "h": 4 } },
  { "id": "card2", "grid": { "x": 6, "y": 0, "w": 6, "h": 4 } },
  { "id": "card3", "grid": { "x": 12, "y": 0, "w": 6, "h": 4 } },
  { "id": "card4", "grid": { "x": 18, "y": 0, "w": 6, "h": 4 } },
  { "id": "card5", "grid": { "x": 0, "y": 4, "w": 6, "h": 4 } },
  { "id": "card6", "grid": { "x": 6, "y": 4, "w": 6, "h": 4 } }
]
```

---

## Troubleshooting

### Components Overlapping

**Cause**: Vertical compaction is disabled or there's a bug.

**Solution**: 
1. Check `gridSettings.compactVertical` is `true`
2. Run `store.getState().compactGrid()` to force compaction

### Grid Lines Not Showing

**Cause**: Grid lines are hidden in settings.

**Solution**: Set `gridSettings.showGridLines = true`

### Component Won't Move

**Cause**: Component is marked as `static` or not `isDraggable`.

**Solution**: Check the component's `grid.static` and `grid.isDraggable` properties

### Responsive Not Working

**Cause**: Breakpoints not configured or `responsive` is false.

**Solution**: 
1. Ensure `gridSettings.responsive = true`
2. Add breakpoints array with at least one entry having `minWidth: 0`

---

## Next Steps

- Read [data-model.md](data-model.md) for schema details
- Read [contracts/grid-kernel-api.md](contracts/grid-kernel-api.md) for API reference
- Check [research.md](research.md) for design decisions
