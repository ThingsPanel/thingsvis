import type { GridSettings, GridPosition, BreakpointConfig } from '@thingsvis/schema';

/**
 * Pixel rectangle for rendering
 */
export interface PixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculate column width in pixels
 * 
 * @param settings - Grid settings
 * @param containerWidth - Container width in pixels
 * @returns Column width in pixels
 * 
 * Formula: (containerWidth - (cols - 1) * gap) / cols
 */
export function calculateColWidth(
  settings: Pick<GridSettings, 'cols' | 'gap'>,
  containerWidth: number
): number {
  const { cols, gap } = settings;
  return (containerWidth - (cols - 1) * gap) / cols;
}

/**
 * Convert grid position to pixel rect
 * 
 * @param grid - Grid position { x, y, w, h }
 * @param settings - Grid settings
 * @param containerWidth - Current container width in pixels
 * @returns Pixel rect { x, y, width, height }
 * 
 * @example
 * const pixelRect = gridToPixel({ x: 0, y: 0, w: 4, h: 2 }, settings, 1920);
 */
export function gridToPixel(
  grid: Pick<GridPosition, 'x' | 'y' | 'w' | 'h'>,
  settings: Pick<GridSettings, 'cols' | 'rowHeight' | 'gap'>,
  containerWidth: number
): PixelRect {
  const { rowHeight, gap } = settings;
  const colWidth = calculateColWidth(settings, containerWidth);
  
  return {
    x: grid.x * (colWidth + gap),
    y: grid.y * (rowHeight + gap),
    width: grid.w * colWidth + (grid.w - 1) * gap,
    height: grid.h * rowHeight + (grid.h - 1) * gap,
  };
}

/**
 * Convert pixel position to grid position (snap to nearest cell)
 * 
 * @param pixel - Pixel position { x, y, width?, height? }
 * @param settings - Grid settings
 * @param containerWidth - Current container width in pixels
 * @returns Grid position { x, y, w?, h? }
 * 
 * @example
 * const gridPos = pixelToGrid({ x: 100, y: 50 }, settings, 1920);
 */
export function pixelToGrid(
  pixel: { x: number; y: number; width?: number; height?: number },
  settings: Pick<GridSettings, 'cols' | 'rowHeight' | 'gap'>,
  containerWidth: number
): { x: number; y: number; w?: number; h?: number } {
  const { cols, rowHeight, gap } = settings;
  const colWidth = calculateColWidth(settings, containerWidth);
  const cellWidth = colWidth + gap;
  const cellHeight = rowHeight + gap;
  
  // Calculate grid position (round to nearest cell)
  const x = Math.max(0, Math.min(cols - 1, Math.round(pixel.x / cellWidth)));
  const y = Math.max(0, Math.round(pixel.y / cellHeight));
  
  const result: { x: number; y: number; w?: number; h?: number } = { x, y };
  
  // Calculate grid size if pixel dimensions provided
  if (pixel.width !== undefined) {
    result.w = Math.max(1, Math.round((pixel.width + gap) / cellWidth));
  }
  if (pixel.height !== undefined) {
    result.h = Math.max(1, Math.round((pixel.height + gap) / cellHeight));
  }
  
  return result;
}

/**
 * Snap a pixel position to the nearest grid cell boundary
 * 
 * @param pixel - Pixel position { x, y }
 * @param settings - Grid settings
 * @param containerWidth - Container width
 * @returns Snapped pixel position
 * 
 * @example
 * const snapped = snapToGrid({ x: 105, y: 47 }, settings, 1920);
 */
export function snapToGrid(
  pixel: { x: number; y: number },
  settings: Pick<GridSettings, 'cols' | 'rowHeight' | 'gap'>,
  containerWidth: number
): { x: number; y: number } {
  const { rowHeight, gap } = settings;
  const colWidth = calculateColWidth(settings, containerWidth);
  const cellWidth = colWidth + gap;
  const cellHeight = rowHeight + gap;
  
  return {
    x: Math.round(pixel.x / cellWidth) * cellWidth,
    y: Math.round(pixel.y / cellHeight) * cellHeight,
  };
}

/**
 * Get the active breakpoint for current container width
 * 
 * @param breakpoints - Array of breakpoint configs (sorted by minWidth desc)
 * @param containerWidth - Current container width
 * @returns Active breakpoint config or null
 * 
 * @example
 * const breakpoint = getActiveBreakpoint(breakpoints, 800);
 * // Returns { minWidth: 768, cols: 6 } for 800px width
 */
export function getActiveBreakpoint(
  breakpoints: BreakpointConfig[],
  containerWidth: number
): BreakpointConfig | null {
  if (!breakpoints || breakpoints.length === 0) {
    return null;
  }
  
  // Sort by minWidth descending
  const sorted = [...breakpoints].sort((a, b) => b.minWidth - a.minWidth);
  
  // Find the first breakpoint where containerWidth >= minWidth
  for (const bp of sorted) {
    if (containerWidth >= bp.minWidth) {
      return bp;
    }
  }
  
  // If no breakpoint matches, return the smallest one
  return sorted[sorted.length - 1] ?? null;
}

/**
 * Get effective column count based on container width and breakpoints
 * 
 * @param settings - Grid settings with breakpoints
 * @param containerWidth - Current container width
 * @returns Effective number of columns
 */
export function getEffectiveCols(
  settings: Pick<GridSettings, 'cols' | 'responsive' | 'breakpoints'>,
  containerWidth: number
): number {
  if (!settings.responsive || !settings.breakpoints || settings.breakpoints.length === 0) {
    return settings.cols;
  }
  
  const activeBreakpoint = getActiveBreakpoint(settings.breakpoints, containerWidth);
  return activeBreakpoint?.cols ?? settings.cols;
}
