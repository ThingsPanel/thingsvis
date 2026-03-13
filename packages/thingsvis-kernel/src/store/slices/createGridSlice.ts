import type { StateCreator } from 'zustand/vanilla';
import type { KernelState, KernelActions, GridState } from '../types';
import { GridSystem } from '../../grid/GridSystem';
import type { GridItem } from '../../grid/types';
import { CANVAS_DEFAULT_WIDTH } from '../../constants/default';
import { DEFAULT_BREAKPOINTS, DEFAULT_GRID_POSITION } from '@thingsvis/schema';

export const defaultGridState: GridState = {
  settings: null,
  activeBreakpoint: null,
  colWidth: 0,
  containerWidth: CANVAS_DEFAULT_WIDTH,
  effectiveCols: 24,
  preview: {
    active: false,
    itemId: null,
    targetPosition: null,
    affectedItems: [],
  },
  totalHeight: 0,
};

export type GridSliceState = {
  gridState: GridState;
};

export type GridSliceActions = Pick<
  KernelActions,
  | 'setGridSettings'
  | 'moveGridItem'
  | 'resizeGridItem'
  | 'compactGrid'
  | 'setGridPreview'
  | 'updateGridContainerWidth'
  | 'moveGridItemWithPosition'
  | 'resizeGridItemWithPosition'
>;

export type GridSlice = GridSliceState & GridSliceActions;

export const createGridSlice: StateCreator<
  KernelState & KernelActions,
  [['zustand/immer', never]],
  [],
  GridSlice
> = (set, get) => ({
  gridState: defaultGridState,

  setGridSettings: (settings) => {
    set((state) => {
      const current = state.gridState.settings ?? {
        cols: 24,
        rowHeight: 30,
        gap: 10,
        compactVertical: true,
        minW: 1,
        minH: 1,
        showGridLines: true,
        breakpoints: [],
        responsive: true,
      };
      state.gridState.settings = { ...current, ...settings };
      state.gridState.effectiveCols = state.gridState.settings.cols;

      // Recalculate column width
      if (state.gridState.containerWidth > 0 && state.gridState.settings) {
        const { cols, gap } = state.gridState.settings;
        state.gridState.colWidth = (state.gridState.containerWidth - (cols - 1) * gap) / cols;
      }
    });
  },

  moveGridItem: (nodeId, newPos) => {
    const state = get();
    if (!state.nodesById[nodeId]) return;
    if (state.canvas.mode !== 'grid') return;

    // Build grid items from nodes
    const gridItems: GridItem[] = Object.values(state.nodesById).map((node) => {
      const grid = node.schemaRef.grid ?? DEFAULT_GRID_POSITION;
      return {
        id: node.id,
        x: grid.x ?? 0,
        y: grid.y ?? 0,
        w: grid.w ?? 4,
        h: grid.h ?? 2,
        static: grid.static,
        minW: grid.minW,
        maxW: grid.maxW,
        minH: grid.minH,
        maxH: grid.maxH,
      };
    });

    const cols = state.gridState.effectiveCols;
    const shouldCompact = state.gridState.settings?.compactVertical ?? true;

    const result = GridSystem.moveItem(gridItems, nodeId, newPos, cols, shouldCompact);

    set((s) => {
      // Update all changed nodes
      for (const item of result.items) {
        const node = s.nodesById[item.id];
        if (node) {
          node.schemaRef.grid = {
            ...node.schemaRef.grid,
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h,
          } as typeof node.schemaRef.grid;
        }
      }
      s.gridState.totalHeight = result.totalHeight;
    });
  },

  resizeGridItem: (nodeId, newSize) => {
    const state = get();
    if (!state.nodesById[nodeId]) return;
    if (state.canvas.mode !== 'grid') return;

    // Build grid items from nodes
    const gridItems: GridItem[] = Object.values(state.nodesById).map((node) => {
      const grid = node.schemaRef.grid ?? DEFAULT_GRID_POSITION;
      return {
        id: node.id,
        x: grid.x ?? 0,
        y: grid.y ?? 0,
        w: grid.w ?? 4,
        h: grid.h ?? 2,
        static: grid.static,
        minW: grid.minW,
        maxW: grid.maxW,
        minH: grid.minH,
        maxH: grid.maxH,
      };
    });

    const cols = state.gridState.effectiveCols;
    const shouldCompact = state.gridState.settings?.compactVertical ?? true;

    const result = GridSystem.resizeItem(gridItems, nodeId, newSize, cols, shouldCompact);

    set((s) => {
      for (const item of result.items) {
        const node = s.nodesById[item.id];
        if (node) {
          node.schemaRef.grid = {
            ...node.schemaRef.grid,
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h,
          } as typeof node.schemaRef.grid;
        }
      }
      s.gridState.totalHeight = result.totalHeight;
    });
  },

  compactGrid: () => {
    const state = get();
    if (state.canvas.mode !== 'grid') return;

    const gridItems: GridItem[] = Object.values(state.nodesById).map((node) => {
      const grid = node.schemaRef.grid ?? DEFAULT_GRID_POSITION;
      return {
        id: node.id,
        x: grid.x ?? 0,
        y: grid.y ?? 0,
        w: grid.w ?? 4,
        h: grid.h ?? 2,
        static: grid.static,
      };
    });

    const cols = state.gridState.effectiveCols;
    const result = GridSystem.compact(gridItems, cols);

    set((s) => {
      for (const item of result.items) {
        const node = s.nodesById[item.id];
        if (node) {
          node.schemaRef.grid = {
            ...node.schemaRef.grid,
            x: item.x,
            y: item.y,
          } as typeof node.schemaRef.grid;
        }
      }
      s.gridState.totalHeight = result.totalHeight;
    });
  },

  setGridPreview: (preview) => {
    set((state) => {
      state.gridState.preview = preview;
    });
  },

  updateGridContainerWidth: (containerWidth) => {
    const currentState = get();
    const previousCols = currentState.gridState.effectiveCols;

    set((state) => {
      state.gridState.containerWidth = containerWidth;

      if (state.gridState.settings) {
        const settings = state.gridState.settings;
        const { cols, gap, breakpoints, responsive } = settings;

        // Determine active breakpoint and effective columns
        let activeBreakpoint: string = 'lg';
        let effectiveCols = cols;
        let matchedBp: { minWidth: number; cols: number } | null = null;

        if (responsive) {
          // Use configured breakpoints, or fall back to DEFAULT_BREAKPOINTS
          const bpList = breakpoints && breakpoints.length > 0 ? breakpoints : DEFAULT_BREAKPOINTS;
          // Sort descending by minWidth, find the largest minWidth that containerWidth >= bp.minWidth
          const sorted = [...bpList].sort((a, b) => b.minWidth - a.minWidth);
          let matched = false;
          for (const bp of sorted) {
            if (containerWidth >= bp.minWidth) {
              effectiveCols = bp.cols;
              matchedBp = bp;
              matched = true;
              break;
            }
          }
          // If no breakpoint matched (containerWidth < all minWidths), use the smallest breakpoint
          if (!matched && sorted.length > 0) {
            const smallest = sorted[sorted.length - 1]!;
            effectiveCols = smallest.cols;
            matchedBp = smallest;
          }
        }

        state.gridState.activeBreakpoint = matchedBp;
        state.gridState.effectiveCols = effectiveCols;
        state.gridState.colWidth = (containerWidth - (effectiveCols - 1) * gap) / effectiveCols;
      }
    });

    // Note: we intentionally do NOT mutate schema.grid here.
    // Responsive column adjustments are computed at render time (proportional scaling),
    // so the authored design-time positions are always preserved and can be fully
    // restored when the container expands back to its original width.
  },

  moveGridItemWithPosition: (nodeId, newPos) => {
    const state = get();
    if (!state.nodesById[nodeId]) return;
    if (state.canvas.mode !== 'grid') return;

    // Build grid items from nodes
    const gridItems: GridItem[] = Object.values(state.nodesById).map((node) => {
      const grid = node.schemaRef.grid ?? DEFAULT_GRID_POSITION;
      return {
        id: node.id,
        x: grid.x ?? 0,
        y: grid.y ?? 0,
        w: grid.w ?? 4,
        h: grid.h ?? 2,
        static: grid.static,
        minW: grid.minW,
        maxW: grid.maxW,
        minH: grid.minH,
        maxH: grid.maxH,
      };
    });

    const cols = state.gridState.effectiveCols;
    const shouldCompact = state.gridState.settings?.compactVertical ?? true;

    const result = GridSystem.moveItem(gridItems, nodeId, newPos, cols, shouldCompact);

    set((s) => {
      for (const item of result.items) {
        const node = s.nodesById[item.id];
        if (node) {
          node.schemaRef.grid = {
            ...node.schemaRef.grid,
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h,
          } as typeof node.schemaRef.grid;
          // schema.position / schema.size are intentionally NOT written here.
          // grid mode rendering is driven solely by schema.grid + GridCanvas;
          // writing pixel coords here would conflict with responsive render-time scaling.
        }
      }
      s.gridState.totalHeight = result.totalHeight;
    });
  },

  resizeGridItemWithPosition: (nodeId, newSize) => {
    const state = get();
    if (!state.nodesById[nodeId]) return;
    if (state.canvas.mode !== 'grid') return;

    // Build grid items from nodes
    const gridItems: GridItem[] = Object.values(state.nodesById).map((node) => {
      const grid = node.schemaRef.grid ?? DEFAULT_GRID_POSITION;
      return {
        id: node.id,
        x: grid.x ?? 0,
        y: grid.y ?? 0,
        w: grid.w ?? 4,
        h: grid.h ?? 2,
        static: grid.static,
        minW: grid.minW,
        maxW: grid.maxW,
        minH: grid.minH,
        maxH: grid.maxH,
      };
    });

    const cols = state.gridState.effectiveCols;
    const shouldCompact = state.gridState.settings?.compactVertical ?? true;

    const result = GridSystem.resizeItem(gridItems, nodeId, newSize, cols, shouldCompact);

    set((s) => {
      for (const item of result.items) {
        const node = s.nodesById[item.id];
        if (node) {
          node.schemaRef.grid = {
            ...node.schemaRef.grid,
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h,
          } as typeof node.schemaRef.grid;
          // schema.position / schema.size are intentionally NOT written here.
          // grid mode rendering is driven solely by schema.grid + GridCanvas;
          // writing pixel coords here would conflict with responsive render-time scaling.
        }
      }
      s.gridState.totalHeight = result.totalHeight;
    });
  },
});
