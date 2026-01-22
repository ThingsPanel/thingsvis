import { z } from 'zod';

/**
 * Breakpoint configuration for responsive grid
 * Defines how the grid behaves at different container widths
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
 * Defines the configuration for a Gridstack-style grid layout
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
 * Sorted by minWidth descending for lookup efficiency
 */
export const DEFAULT_BREAKPOINTS: BreakpointConfig[] = [
  { minWidth: 1200, cols: 24 },
  { minWidth: 992, cols: 12 },
  { minWidth: 768, cols: 6 },
  { minWidth: 480, cols: 2 },
  { minWidth: 0, cols: 1 },
];

/**
 * Default grid settings
 */
export const DEFAULT_GRID_SETTINGS: GridSettings = {
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
