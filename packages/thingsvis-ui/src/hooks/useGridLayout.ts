import { useCallback, useMemo, useRef } from 'react';
import type { GridSettings, GridPosition } from '@thingsvis/schema';
import type { KernelStore } from '@thingsvis/kernel';
import { pixelToGrid, gridToPixel, calculateColWidth, getEffectiveCols } from '../utils/grid-mapper';

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
  const { store, containerWidth, settings, isGridMode } = options;
  
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
  
  // Debounce timer for preview calculations
  const previewTimerRef = useRef<number | null>(null);
  
  // Calculate column width
  const colWidth = useMemo(() => {
    if (!settings || containerWidth <= 0) return 0;
    return calculateColWidth(settings, containerWidth);
  }, [settings, containerWidth]);
  
  // Calculate effective column count
  const effectiveCols = useMemo(() => {
    if (!settings) return 24;
    return getEffectiveCols(settings, containerWidth);
  }, [settings, containerWidth]);
  
  // Get grid position for a node
  const getGridPosition = useCallback((nodeId: string): GridPosition | null => {
    const state = store.getState();
    const node = state.nodesById[nodeId];
    if (!node) return null;
    
    const schema = node.schemaRef as any;
    return schema.grid ?? null;
  }, [store]);
  
  // Convert grid position to pixel rect
  const getPixelRect = useCallback((gridPos: GridPosition) => {
    if (!settings) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    return gridToPixel(gridPos, settings, containerWidth);
  }, [settings, containerWidth]);
  
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
    
    // Show initial preview
    store.getState().setGridPreview({
      active: true,
      itemId: nodeId,
      targetPosition: gridPos,
      affectedItems: [],
    });
  }, [isGridMode, settings, getGridPosition, store]);
  
  const onDragMove = useCallback((pixelPos: { x: number; y: number }) => {
    const dragState = dragStateRef.current;
    if (!dragState.isDragging || !dragState.nodeId || !dragState.startPixelPos || !settings) {
      return;
    }
    
    // Calculate pixel delta
    const dx = pixelPos.x - dragState.startPixelPos.x;
    const dy = pixelPos.y - dragState.startPixelPos.y;
    
    // Convert delta to grid units
    const cellWidth = colWidth + settings.gap;
    const cellHeight = settings.rowHeight + settings.gap;
    
    const gridDx = Math.round(dx / cellWidth);
    const gridDy = Math.round(dy / cellHeight);
    
    // Calculate new grid position
    const startPos = dragState.startGridPos!;
    const newX = Math.max(0, Math.min(effectiveCols - startPos.w, startPos.x + gridDx));
    const newY = Math.max(0, startPos.y + gridDy);
    
    // Only update if position changed
    if (newX === dragState.currentGridPos?.x && newY === dragState.currentGridPos?.y) {
      return;
    }
    
    dragState.currentGridPos = { ...startPos, x: newX, y: newY };
    
    // Debounce preview calculation
    if (previewTimerRef.current !== null) {
      cancelAnimationFrame(previewTimerRef.current);
    }
    
    previewTimerRef.current = requestAnimationFrame(() => {
      // Update preview with target position
      // Note: Full collision preview is calculated in KernelStore when needed
      store.getState().setGridPreview({
        active: true,
        itemId: dragState.nodeId,
        targetPosition: { ...startPos, x: newX, y: newY },
        affectedItems: [], // Affected items will be calculated on commit
      });
    });
  }, [settings, colWidth, effectiveCols, store]);
  
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
    store.getState().setGridPreview({
      active: false,
      itemId: null,
      targetPosition: null,
      affectedItems: [],
    });
    
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
    
    // Show initial preview
    store.getState().setGridPreview({
      active: true,
      itemId: nodeId,
      targetPosition: gridPos,
      affectedItems: [],
    });
  }, [isGridMode, settings, getGridPosition, store]);
  
  const onResizeMove = useCallback((pixelDelta: { dx: number; dy: number }) => {
    const resizeState = resizeStateRef.current;
    if (!resizeState.isResizing || !resizeState.nodeId || !resizeState.startSize || !settings) {
      return;
    }
    
    // Convert delta to grid units
    const cellWidth = colWidth + settings.gap;
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
    
    // Get current position for preview
    const gridPos = getGridPosition(resizeState.nodeId);
    if (!gridPos) return;
    
    store.getState().setGridPreview({
      active: true,
      itemId: resizeState.nodeId,
      targetPosition: { ...gridPos, w: newW, h: newH },
      affectedItems: [],
    });
  }, [settings, colWidth, getGridPosition, store]);
  
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
    store.getState().setGridPreview({
      active: false,
      itemId: null,
      targetPosition: null,
      affectedItems: [],
    });
    
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
