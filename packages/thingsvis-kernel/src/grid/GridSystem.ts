import type { GridItem, GridLayoutResult, GridPreviewResult } from './types';
import { GridLayoutError } from './errors';
import { detectCollision, resolveCollisions } from './GridCollision';
import { compact, compactWithSort } from './GridCompaction';

/**
 * GridSystem - Headless grid layout engine
 * 
 * Provides pure functional layout calculations without any UI dependencies.
 * All methods are static and operate on immutable data.
 */
export class GridSystem {
  /**
   * Compact all items vertically (gravity effect)
   * 
   * @param items - Array of grid items to compact
   * @param cols - Number of columns in the grid
   * @returns GridLayoutResult with compacted positions
   * 
   * @example
   * const result = GridSystem.compact(items, 24);
   * console.log(result.changedIds); // IDs of items that moved
   */
  static compact(items: GridItem[], cols: number): GridLayoutResult {
    return compact(items, cols);
  }
  
  /**
   * Check if two items collide (overlap)
   * 
   * @param a - First grid item
   * @param b - Second grid item
   * @returns true if items overlap
   * 
   * @example
   * if (GridSystem.detectCollision(itemA, itemB)) {
   *   console.log('Collision detected');
   * }
   */
  static detectCollision(a: GridItem, b: GridItem): boolean {
    return detectCollision(a, b);
  }
  
  /**
   * Resolve all collisions by pushing items down
   * 
   * @param items - Array of all grid items
   * @param movingItem - The item that is moving/expanding
   * @param cols - Number of columns
   * @returns Array of items with resolved positions
   */
  static resolveCollisions(
    items: GridItem[],
    movingItem: GridItem,
    cols: number
  ): GridItem[] {
    return resolveCollisions(items, movingItem, cols);
  }
  
  /**
   * Move an item to a new position
   * 
   * @param items - Array of all grid items
   * @param id - ID of the item to move
   * @param newPos - Target grid position { x, y }
   * @param cols - Number of columns
   * @param shouldCompact - Whether to run compaction after move (default: true)
   * @returns GridLayoutResult with updated positions
   * 
   * @throws {GridLayoutError} If item not found or position invalid
   * 
   * @example
   * const result = GridSystem.moveItem(items, 'node-1', { x: 4, y: 2 }, 24);
   */
  static moveItem(
    items: GridItem[],
    id: string,
    newPos: { x: number; y: number },
    cols: number,
    shouldCompact: boolean = true
  ): GridLayoutResult {
    const item = items.find(i => i.id === id);
    if (!item) {
      throw GridLayoutError.itemNotFound(id);
    }
    
    // Validate position
    if (isNaN(newPos.x) || isNaN(newPos.y) || newPos.x < 0 || newPos.y < 0) {
      throw GridLayoutError.invalidPosition({ x: newPos.x, y: newPos.y });
    }
    
    // Clamp x to grid bounds
    const clampedX = Math.max(0, Math.min(newPos.x, cols - item.w));
    const clampedY = Math.max(0, newPos.y);
    
    // Create moved item
    const movedItem: GridItem = {
      ...item,
      x: clampedX,
      y: clampedY,
    };
    
    // Resolve collisions
    let result = resolveCollisions(items, movedItem, cols);
    
    // Apply compaction if enabled
    if (shouldCompact) {
      const compacted = compact(result, cols);
      result = compacted.items;
    }
    
    // Track changed items
    const changedIds: string[] = [];
    for (const newItem of result) {
      const original = items.find(i => i.id === newItem.id);
      if (original && (original.x !== newItem.x || original.y !== newItem.y)) {
        changedIds.push(newItem.id);
      }
    }
    
    // Calculate total height
    const totalHeight = result.reduce((max, item) => {
      return Math.max(max, item.y + item.h);
    }, 0);
    
    return {
      items: result,
      changedIds,
      totalHeight,
    };
  }
  
  /**
   * Resize an item
   * 
   * @param items - Array of all grid items
   * @param id - ID of the item to resize
   * @param newSize - New size { w, h }
   * @param cols - Number of columns
   * @param shouldCompact - Whether to run compaction after resize (default: true)
   * @returns GridLayoutResult with updated positions
   * 
   * @throws {GridLayoutError} If item not found or size violates constraints
   * 
   * @example
   * const result = GridSystem.resizeItem(items, 'node-1', { w: 6, h: 3 }, 24);
   */
  static resizeItem(
    items: GridItem[],
    id: string,
    newSize: { w: number; h: number },
    cols: number,
    shouldCompact: boolean = true
  ): GridLayoutResult {
    const item = items.find(i => i.id === id);
    if (!item) {
      throw GridLayoutError.itemNotFound(id);
    }
    
    // Apply constraints
    let { w, h } = newSize;
    
    // Apply min/max constraints
    if (item.minW !== undefined) w = Math.max(w, item.minW);
    if (item.maxW !== undefined) w = Math.min(w, item.maxW);
    if (item.minH !== undefined) h = Math.max(h, item.minH);
    if (item.maxH !== undefined) h = Math.min(h, item.maxH);
    
    // Ensure minimum size
    w = Math.max(1, w);
    h = Math.max(1, h);
    
    // Clamp width to fit within grid
    if (item.x + w > cols) {
      w = cols - item.x;
    }
    
    // Create resized item
    const resizedItem: GridItem = {
      ...item,
      w,
      h,
    };
    
    // Resolve collisions
    let result = resolveCollisions(items, resizedItem, cols);
    
    // Apply compaction if enabled
    if (shouldCompact) {
      const compacted = compact(result, cols);
      result = compacted.items;
    }
    
    // Track changed items
    const changedIds: string[] = [];
    for (const newItem of result) {
      const original = items.find(i => i.id === newItem.id);
      if (original && (
        original.x !== newItem.x || 
        original.y !== newItem.y ||
        original.w !== newItem.w ||
        original.h !== newItem.h
      )) {
        changedIds.push(newItem.id);
      }
    }
    
    // Calculate total height
    const totalHeight = result.reduce((max, item) => {
      return Math.max(max, item.y + item.h);
    }, 0);
    
    return {
      items: result,
      changedIds,
      totalHeight,
    };
  }
  
  /**
   * Preview the result of moving an item (without committing)
   * 
   * @param items - Array of all grid items
   * @param id - ID of the item to preview moving
   * @param targetPos - Target position { x, y }
   * @param cols - Number of columns
   * @returns Preview result with affected item IDs
   */
  static previewMove(
    items: GridItem[],
    id: string,
    targetPos: { x: number; y: number },
    cols: number
  ): GridPreviewResult {
    const item = items.find(i => i.id === id);
    if (!item) {
      return {
        previewItems: items,
        affectedIds: [],
        isValid: false,
      };
    }
    
    // Validate position
    if (isNaN(targetPos.x) || isNaN(targetPos.y) || targetPos.x < 0 || targetPos.y < 0) {
      return {
        previewItems: items,
        affectedIds: [],
        isValid: false,
      };
    }
    
    // Clamp position
    const clampedX = Math.max(0, Math.min(targetPos.x, cols - item.w));
    const clampedY = Math.max(0, targetPos.y);
    
    // Create preview item
    const previewItem: GridItem = {
      ...item,
      x: clampedX,
      y: clampedY,
      moving: true,
    };
    
    // Resolve collisions
    const resolved = resolveCollisions(items, previewItem, cols);
    
    // Apply compaction
    const compacted = compact(resolved, cols);
    
    // Find affected items
    const affectedIds: string[] = [];
    for (const newItem of compacted.items) {
      if (newItem.id === id) continue;
      const original = items.find(i => i.id === newItem.id);
      if (original && (original.x !== newItem.x || original.y !== newItem.y)) {
        affectedIds.push(newItem.id);
      }
    }
    
    return {
      previewItems: compacted.items,
      affectedIds,
      isValid: true,
    };
  }
  
  /**
   * Clamp component widths to a new column count
   * Used when breakpoints change
   * 
   * @param items - Array of grid items
   * @param newCols - New number of columns
   * @returns GridLayoutResult with clamped positions
   */
  static clampToColumns(items: GridItem[], newCols: number): GridLayoutResult {
    return compactWithSort(items, newCols);
  }
}
