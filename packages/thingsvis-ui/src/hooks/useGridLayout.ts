import { useState, useCallback, useMemo, useRef } from 'react';
import type { GridSettings, GridPosition } from '@thingsvis/schema';
import type { KernelStore } from '@thingsvis/kernel';
import { GridSystem } from '@thingsvis/kernel';
import { pixelToGrid, gridToPixel, getEffectiveCols } from '../utils/grid-mapper';

/**
 * Hook options for grid layout interactions
 */
export interface UseGridLayoutOptions {
  /** Kernel store instance */
  store: KernelStore;
  /** Container width in pixels */
  containerWidth: number;
  /** Grid settings */
  settings: GridSettings | null;
  /** Whether grid mode is active */
  isGridMode: boolean;
  /** Current canvas zoom scale */
  zoom?: number;
}

/**
 * Drag state for tracking active drag operations
 */
interface DragState {
  isDragging: boolean;
  nodeId: string | null;
  startGridPos: GridPosition | null;
  currentGridPos: GridPosition | null;
  startPixelPos: { x: number; y: number } | null;
}

/**
 * Resize state for tracking active resize operations
 */
interface ResizeState {
  isResizing: boolean;
  nodeId: string | null;
  startSize: { w: number; h: number } | null;
  currentSize: { w: number; h: number } | null;
  handle: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null;
}

/**
 * Return type for useGridLayout hook
 */
export interface UseGridLayoutReturn {
  // Computed values
  colWidth: number;
  effectiveCols: number;
  localPreview: {
    active: boolean;
    itemId: string | null;
    targetPosition: GridPosition | null;
    pushedItems: Record<string, { x: number; y: number; w: number; h: number }>;
  } | null;

  // Drag handlers
  onDragStart: (nodeId: string, pixelPos: { x: number; y: number }) => void;
  onDragMove: (pixelPos: { x: number; y: number }) => void;
  onDragEnd: () => void;

  // Resize handlers
  onResizeStart: (nodeId: string, handle: ResizeState['handle']) => void;
  onResizeMove: (pixelDelta: { dx: number; dy: number }) => void;
  onResizeEnd: () => void;

  // Utilities
  getGridPosition: (nodeId: string) => GridPosition | null;
  getPixelRect: (gridPos: GridPosition) => { x: number; y: number; width: number; height: number };
  snapPixelToGrid: (pixel: { x: number; y: number }) => { x: number; y: number };
}

/**
 * React hook for grid layout interactions
 * 
 * Provides drag and resize handlers that integrate with the grid system,
 * handling coordinate conversion and preview calculations.
 * 
 * @param options - Hook configuration
 * @returns Grid layout interaction handlers and utilities
 * 
 * @example
 * const { onDragStart, onDragMove, onDragEnd, colWidth } = useGridLayout({
 *   store,
 *   containerWidth: 1920,
 *   settings: gridSettings,
 *   isGridMode: true,
 * });
 */
export function useGridLayout(options: UseGridLayoutOptions): UseGridLayoutReturn {
  const { store, containerWidth, settings, isGridMode, zoom = 1 } = options;

  // State refs for drag and resize tracking
  const dragStateRef = useRef<DragState>({
    isDragging: false,
    nodeId: null,
    startGridPos: null,
    currentGridPos: null,
    startPixelPos: null,
  });

  const resizeStateRef = useRef<ResizeState>({
    isResizing: false,
    nodeId: null,
    startSize: null,
    currentSize: null,
    handle: null,
  });

  const [localPreview, setLocalPreview] = useState<UseGridLayoutReturn['localPreview']>(null);

  // Debounce timer for preview calculations
  const previewTimerRef = useRef<number | null>(null);

  // Tracks whether the drag preview has been activated in the current drag session.
  // Prevents GridDropTarget from rendering on a plain click (mousedown without real grid motion).
  const previewActivatedRef = useRef(false);

  // Calculate effective column count (must be before colWidth)
  const effectiveCols = useMemo(() => {
    if (!settings) return 24;
    return getEffectiveCols(settings, containerWidth);
  }, [settings, containerWidth]);

  // Calculate column width based on effective (responsive) column count
  const colWidth = useMemo(() => {
    if (!settings || containerWidth <= 0 || effectiveCols <= 0) return 0;
    return (containerWidth - (effectiveCols - 1) * settings.gap) / effectiveCols;
  }, [settings, containerWidth, effectiveCols]);

  // Get grid position for a node
  const getGridPosition = useCallback((nodeId: string): GridPosition | null => {
    const state = store.getState();
    const node = state.nodesById[nodeId];
    if (!node) return null;

    const schema = node.schemaRef as any;
    return schema.grid ?? null;
  }, [store]);

  // Convert grid position to pixel rect (using responsive effectiveCols)
  const getPixelRect = useCallback((gridPos: GridPosition) => {
    if (!settings) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    const responsiveSettings = { ...settings, cols: effectiveCols };
    return gridToPixel(gridPos, responsiveSettings, containerWidth);
  }, [settings, containerWidth, effectiveCols]);

  // Snap pixel position to grid
  const snapPixelToGrid = useCallback((pixel: { x: number; y: number }) => {
    if (!settings) return pixel;
    const gridPos = pixelToGrid(pixel, settings, containerWidth);
    const snapped = gridToPixel({ x: gridPos.x, y: gridPos.y, w: 1, h: 1 }, settings, containerWidth);
    return { x: snapped.x, y: snapped.y };
  }, [settings, containerWidth]);

  // Drag handlers
  const onDragStart = useCallback((nodeId: string, pixelPos: { x: number; y: number }) => {
    if (!isGridMode || !settings) return;

    const gridPos = getGridPosition(nodeId);
    if (!gridPos) return;

    dragStateRef.current = {
      isDragging: true,
      nodeId,
      startGridPos: gridPos,
      currentGridPos: gridPos,
      startPixelPos: pixelPos,
    };

    // Reset activation flag; preview is deferred until the first real grid-cell motion.
    previewActivatedRef.current = false;
  }, [isGridMode, settings, getGridPosition]);

  const onDragMove = useCallback((pixelPos: { x: number; y: number }) => {
    const dragState = dragStateRef.current;
    if (!dragState.isDragging || !dragState.nodeId || !dragState.startPixelPos || !settings) {
      return;
    }

    // Calculate pixel delta, adjust for zoom
    const dx = (pixelPos.x - dragState.startPixelPos.x) / zoom;
    const dy = (pixelPos.y - dragState.startPixelPos.y) / zoom;

    // Use schema-space (maxCols) cell width so that gridDx/gridDy are in design coordinates.
    // schema.grid is always in maxCols space; effectiveCols-based colWidth would corrupt the
    // committed position when a responsive breakpoint is active.
    const schemaColWidth = (containerWidth - (settings.cols - 1) * settings.gap) / settings.cols;
    const cellWidth = schemaColWidth + settings.gap;
    const cellHeight = settings.rowHeight + settings.gap;

    const gridDx = Math.round(dx / cellWidth);
    const gridDy = Math.round(dy / cellHeight);

    // Bound within schema-space (maxCols), not effectiveCols.
    const startPos = dragState.startGridPos!;
    const newX = Math.max(0, Math.min(settings.cols - startPos.w, startPos.x + gridDx));
    const newY = Math.max(0, startPos.y + gridDy);

    // Suppress the drop-target until the drag crosses at least one full grid cell.
    // This prevents the placeholder from appearing on a plain click (mousedown + no motion).
    if (gridDx === 0 && gridDy === 0 && !previewActivatedRef.current) {
      return;
    }

    // Only update if position changed
    if (newX === dragState.currentGridPos?.x && newY === dragState.currentGridPos?.y) {
      return;
    }

    dragState.currentGridPos = { ...startPos, x: newX, y: newY };

    if (previewTimerRef.current !== null) {
      cancelAnimationFrame(previewTimerRef.current);
    }

    previewTimerRef.current = requestAnimationFrame(() => {
      // Build dummy array for GridSystem simulation
      const currentNodes = store.getState().nodesById;
      const gridItems = Object.values(currentNodes).map((node: any) => {
        const schema = node.schemaRef as any;
        const grid = schema.grid ?? { x: 0, y: 0, w: 4, h: 2 };
        return {
          id: node.id as string,
          x: grid.x ?? 0, y: grid.y ?? 0, w: grid.w ?? 4, h: grid.h ?? 2,
          static: grid.static,
          minW: grid.minW, maxW: grid.maxW, minH: grid.minH, maxH: grid.maxH,
        };
      });

      const shouldCompact = settings.compactVertical ?? true;
      let pushedItems: Record<string, { x: number; y: number; w: number; h: number }> = {};

      try {
        if (!dragState.nodeId) return;
        // Keep preview simulation in design-space so it matches the persisted schema.grid coordinates.
        const simResult = GridSystem.moveItem(gridItems, dragState.nodeId, { x: newX, y: newY }, settings.cols, shouldCompact);
        for (const item of simResult.items) {
          if (item.id !== dragState.nodeId) {
            pushedItems[item.id] = { x: item.x, y: item.y, w: item.w, h: item.h };
          }
        }
      } catch (e) {
        // ignore invalid placements during drag 
      }

      setLocalPreview({
        active: true,
        itemId: dragState.nodeId,
        targetPosition: { ...startPos, x: newX, y: newY },
        pushedItems,
      });
      // Mark that the drop-target is now visible; subsequent zero-delta moves must not hide it.
      previewActivatedRef.current = true;
    });
  }, [settings, colWidth, effectiveCols, store, zoom]);

  const onDragEnd = useCallback(() => {
    const dragState = dragStateRef.current;
    if (!dragState.isDragging || !dragState.nodeId || !dragState.currentGridPos) {
      dragStateRef.current = {
        isDragging: false,
        nodeId: null,
        startGridPos: null,
        currentGridPos: null,
        startPixelPos: null,
      };
      return;
    }

    // Commit the move
    store.getState().moveGridItem(dragState.nodeId, {
      x: dragState.currentGridPos.x,
      y: dragState.currentGridPos.y,
    });

    // Clear preview
    setLocalPreview(null);

    // Reset drag state
    dragStateRef.current = {
      isDragging: false,
      nodeId: null,
      startGridPos: null,
      currentGridPos: null,
      startPixelPos: null,
    };

    if (previewTimerRef.current !== null) {
      cancelAnimationFrame(previewTimerRef.current);
      previewTimerRef.current = null;
    }
    previewActivatedRef.current = false;
  }, [store]);

  // Resize handlers
  const onResizeStart = useCallback((nodeId: string, handle: ResizeState['handle']) => {
    if (!isGridMode || !settings) return;

    const gridPos = getGridPosition(nodeId);
    if (!gridPos) return;

    resizeStateRef.current = {
      isResizing: true,
      nodeId,
      startSize: { w: gridPos.w, h: gridPos.h },
      currentSize: { w: gridPos.w, h: gridPos.h },
      handle,
    };

    setLocalPreview({
      active: true,
      itemId: nodeId,
      targetPosition: gridPos,
      pushedItems: {},
    });
  }, [isGridMode, settings, getGridPosition]);

  const onResizeMove = useCallback((pixelDelta: { dx: number; dy: number }) => {
    const resizeState = resizeStateRef.current;
    if (!resizeState.isResizing || !resizeState.nodeId || !resizeState.startSize || !settings) {
      return;
    }

    // Use schema-space (maxCols) cell width so that gridDw/gridDh are in design coordinates.
    // Mirrors the fix applied to onDragMove — prevents mixed-unit corruption of schema.grid.
    const schemaColWidth = (containerWidth - (settings.cols - 1) * settings.gap) / settings.cols;
    const cellWidth = schemaColWidth + settings.gap;
    const cellHeight = settings.rowHeight + settings.gap;

    const gridDw = Math.round(pixelDelta.dx / cellWidth);
    const gridDh = Math.round(pixelDelta.dy / cellHeight);

    // Calculate new size based on handle
    let newW = resizeState.startSize.w;
    let newH = resizeState.startSize.h;

    const handle = resizeState.handle;
    if (handle?.includes('e')) newW = Math.max(1, resizeState.startSize.w + gridDw);
    if (handle?.includes('w')) newW = Math.max(1, resizeState.startSize.w - gridDw);
    if (handle?.includes('s')) newH = Math.max(1, resizeState.startSize.h + gridDh);
    if (handle?.includes('n')) newH = Math.max(1, resizeState.startSize.h - gridDh);

    // Only update if size changed
    if (newW === resizeState.currentSize?.w && newH === resizeState.currentSize?.h) {
      return;
    }

    resizeState.currentSize = { w: newW, h: newH };

    if (previewTimerRef.current !== null) {
      cancelAnimationFrame(previewTimerRef.current);
    }

    previewTimerRef.current = requestAnimationFrame(() => {
      const currentNodes = store.getState().nodesById;
      const gridItems = Object.values(currentNodes).map((node: any) => {
        const schema = node.schemaRef as any;
        const grid = schema.grid ?? { x: 0, y: 0, w: 4, h: 2 };
        return {
          id: node.id as string,
          x: grid.x ?? 0, y: grid.y ?? 0, w: grid.w ?? 4, h: grid.h ?? 2,
          static: grid.static,
          minW: grid.minW, maxW: grid.maxW, minH: grid.minH, maxH: grid.maxH,
        };
      });

      const shouldCompact = settings.compactVertical ?? true;
      let pushedItems: Record<string, { x: number; y: number; w: number; h: number }> = {};

      // Get current position for preview
      if (!resizeState.nodeId) return;
      const gridPos = getGridPosition(resizeState.nodeId);
      if (!gridPos) return;

      const targetPos = { ...gridPos, w: newW, h: newH };
      try {
        // Keep preview simulation in design-space so it matches the persisted schema.grid coordinates.
        const simResult = GridSystem.resizeItem(gridItems, resizeState.nodeId, { w: newW, h: newH }, settings.cols, shouldCompact);
        for (const item of simResult.items) {
          if (item.id !== resizeState.nodeId) {
            pushedItems[item.id] = { x: item.x, y: item.y, w: item.w, h: item.h };
          }
        }
      } catch (e) {
        // ignore invalid placements during resize
      }

      setLocalPreview({
        active: true,
        itemId: resizeState.nodeId,
        targetPosition: targetPos,
        pushedItems,
      });
    });
  }, [settings, colWidth, effectiveCols, getGridPosition, store]);

  const onResizeEnd = useCallback(() => {
    const resizeState = resizeStateRef.current;
    if (!resizeState.isResizing || !resizeState.nodeId || !resizeState.currentSize) {
      resizeStateRef.current = {
        isResizing: false,
        nodeId: null,
        startSize: null,
        currentSize: null,
        handle: null,
      };
      return;
    }

    // Commit the resize
    store.getState().resizeGridItem(resizeState.nodeId, {
      w: resizeState.currentSize.w,
      h: resizeState.currentSize.h,
    });

    // Clear preview
    setLocalPreview(null);

    // Reset resize state
    resizeStateRef.current = {
      isResizing: false,
      nodeId: null,
      startSize: null,
      currentSize: null,
      handle: null,
    };
  }, [store]);

  return {
    colWidth,
    effectiveCols,
    localPreview,
    onDragStart,
    onDragMove,
    onDragEnd,
    onResizeStart,
    onResizeMove,
    onResizeEnd,
    getGridPosition,
    getPixelRect,
    snapPixelToGrid,
  };
}
