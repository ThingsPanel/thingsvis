import type { GridItem, GridLayoutResult } from './types';
import { detectCollision } from './GridCollision';

/**
 * Vertical compaction utilities for grid layout
 * Implements the "gravity" effect where items float up to fill gaps
 */

/**
 * Compact all items vertically (gravity effect)
 * Items move up to the lowest valid position (no collisions)
 * 
 * @param items - Array of grid items to compact
 * @param cols - Number of columns in the grid
 * @returns GridLayoutResult with compacted positions
 * 
 * @example
 * const result = compact(items, 24);
 * console.log(result.changedIds); // IDs of items that moved
 */
export function compact(items: GridItem[], cols: number): GridLayoutResult {
  // Sort by y, then x (process top-left items first)
  const sorted = [...items].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });
  
  const result: GridItem[] = [];
  const changedIds: string[] = [];
  
  for (const item of sorted) {
    // Static items don't move
    if (item.static) {
      result.push({ ...item });
      continue;
    }
    
    // Find the lowest valid Y position for this item
    let newY = 0;
    const testItem = { ...item, y: newY };
    
    // Keep moving down until we find a valid position
    while (result.some(placed => detectCollision({ ...testItem, y: newY }, placed))) {
      newY++;
      // Safety: don't go too high
      if (newY > 1000) break;
    }
    
    const compactedItem = { ...item, y: newY };
    result.push(compactedItem);
    
    if (newY !== item.y) {
      changedIds.push(item.id);
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
 * Compact items with breakpoint-aware sorting
 * Used when switching breakpoints to maintain logical order
 * 
 * @param items - Array of grid items to compact
 * @param cols - Number of columns in the grid
 * @returns GridLayoutResult with compacted positions
 */
export function compactWithSort(items: GridItem[], cols: number): GridLayoutResult {
  // Sort by y, then x for logical reading order
  const sorted = [...items].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });
  
  const result: GridItem[] = [];
  const changedIds: string[] = [];
  
  for (const item of sorted) {
    if (item.static) {
      result.push({ ...item });
      continue;
    }
    
    // For column reduction, clamp width first
    const clampedW = Math.min(item.w, cols);
    const clampedX = Math.min(item.x, cols - clampedW);
    
    // Find lowest valid position
    let newY = 0;
    const testItem = { ...item, x: clampedX, w: clampedW };
    
    while (result.some(placed => detectCollision({ ...testItem, y: newY }, placed))) {
      newY++;
      if (newY > 1000) break;
    }
    
    const compactedItem = { 
      ...item, 
      x: clampedX, 
      y: newY, 
      w: clampedW 
    };
    result.push(compactedItem);
    
    if (newY !== item.y || clampedX !== item.x || clampedW !== item.w) {
      changedIds.push(item.id);
    }
  }
  
  const totalHeight = result.reduce((max, item) => {
    return Math.max(max, item.y + item.h);
  }, 0);
  
  return {
    items: result,
    changedIds,
    totalHeight,
  };
}
