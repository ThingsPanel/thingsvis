/**
 * Coordinate Conversion Utilities
 * 
 * Utilities for converting between screen and world coordinates
 */

export type Viewport = {
  width: number;
  height: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
};

export type Point = {
  x: number;
  y: number;
};

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Convert screen coordinates to world coordinates
 * 
 * @param screenPoint - Point in screen space (relative to canvas container)
 * @param viewport - Current viewport state (zoom, offset)
 * @returns Point in world space
 */
export function screenToWorld(screenPoint: Point, viewport: Viewport): Point {
  return {
    x: (screenPoint.x - viewport.offsetX) / viewport.zoom,
    y: (screenPoint.y - viewport.offsetY) / viewport.zoom,
  };
}

/**
 * Convert world coordinates to screen coordinates
 * 
 * @param worldPoint - Point in world space
 * @param viewport - Current viewport state (zoom, offset)
 * @returns Point in screen space
 */
export function worldToScreen(worldPoint: Point, viewport: Viewport): Point {
  return {
    x: worldPoint.x * viewport.zoom + viewport.offsetX,
    y: worldPoint.y * viewport.zoom + viewport.offsetY,
  };
}

/**
 * Normalize a rectangle to have positive width and height
 * Handles cases where end point is before start point (drag in negative direction)
 * 
 * @param startWorld - Start point in world coordinates
 * @param endWorld - End point in world coordinates
 * @returns Normalized rectangle with positive dimensions
 */
export function normalizeRect(startWorld: Point, endWorld: Point): Rect {
  const x = Math.min(startWorld.x, endWorld.x);
  const y = Math.min(startWorld.y, endWorld.y);
  const width = Math.abs(endWorld.x - startWorld.x);
  const height = Math.abs(endWorld.y - startWorld.y);
  
  return { x, y, width, height };
}

/**
 * Calculate the distance between two points
 */
export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if a gesture is a click (distance less than threshold)
 * 
 * @param start - Start point
 * @param end - End point
 * @param threshold - Distance threshold (default 5px)
 */
export function isClick(start: Point, end: Point, threshold = 5): boolean {
  return distance(start, end) < threshold;
}

/**
 * Apply minimum size constraints to a rectangle
 */
export function enforceMinSize(rect: Rect, minWidth: number, minHeight: number): Rect {
  return {
    x: rect.x,
    y: rect.y,
    width: Math.max(rect.width, minWidth),
    height: Math.max(rect.height, minHeight),
  };
}
