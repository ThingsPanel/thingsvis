import type { GridPosition } from '@thingsvis/schema';

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

/**
 * Preview result for move/resize operations
 */
export interface GridPreviewResult {
  /** Preview items with new positions */
  previewItems: GridItem[];
  
  /** IDs of items that would be affected */
  affectedIds: string[];
  
  /** Whether the operation is valid */
  isValid: boolean;
}

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
  gridSettingsSnapshot: {
    cols: number;
    rowHeight: number;
    gap: number;
  };
  
  /** Migration timestamp */
  migratedAt: string;
}

/**
 * Pixel rectangle for rendering
 */
export interface PixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
