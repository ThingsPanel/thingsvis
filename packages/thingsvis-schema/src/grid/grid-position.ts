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
}).refine(
  (data) => !data.minW || !data.maxW || data.minW <= data.maxW,
  { message: 'minW must be <= maxW' }
).refine(
  (data) => !data.minH || !data.maxH || data.minH <= data.maxH,
  { message: 'minH must be <= maxH' }
);

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
