import type { GridItem } from './types';

/**
 * Collision detection utilities for grid layout
 */

/**
 * Check if two grid items collide (overlap)
 * 
 * @param a - First grid item
 * @param b - Second grid item
 * @returns true if items overlap, false otherwise
 * 
 * @example
 * if (detectCollision(itemA, itemB)) {
 *   console.log('Collision detected');
 * }
 */
export function detectCollision(a: GridItem, b: GridItem): boolean {
  // Items don't collide if:
  // - a is completely to the left of b (a.x + a.w <= b.x)
  // - a is completely to the right of b (b.x + b.w <= a.x)
  // - a is completely above b (a.y + a.h <= b.y)
  // - a is completely below b (b.y + b.h <= a.y)
  return !(
    a.x + a.w <= b.x ||
    b.x + b.w <= a.x ||
    a.y + a.h <= b.y ||
    b.y + b.h <= a.y
  );
}

/**
 * Find all items that collide with the given item
 * 
 * @param items - Array of all grid items
 * @param item - The item to check collisions against
 * @returns Array of items that collide with the given item
 */
export function findCollisions(items: GridItem[], item: GridItem): GridItem[] {
  return items.filter(other =>
    other.id !== item.id && detectCollision(item, other)
  );
}

/**
 * Resolve all collisions by pushing items down
 * 
 * @param items - Array of all grid items
 * @param movingItem - The item that is moving/expanding
 * @param cols - Number of columns in the grid
 * @returns Array of items with resolved positions
 */
export function resolveCollisions(
  items: GridItem[],
  movingItem: GridItem,
  cols: number
): GridItem[] {
  const result = items.map(item => ({ ...item }));
  const movingIndex = result.findIndex(item => item.id === movingItem.id);

  if (movingIndex >= 0) {
    result[movingIndex] = { ...movingItem };
  }

  // Find and resolve collisions iteratively
  let hasChanges = true;
  const maxIterations = items.length * 2; // Prevent infinite loops
  let iterations = 0;

  while (hasChanges && iterations < maxIterations) {
    hasChanges = false;
    iterations++;

    for (const item of result) {
      // Skip the moving item itself
      if (item.id === movingItem.id) continue;

      // Skip static items
      if (item.static) continue;

      // Check if this item collides with the moving item
      const currentMoving = result.find(i => i.id === movingItem.id) ?? movingItem;

      if (detectCollision(currentMoving, item)) {
        // Push this item down to be below the moving item
        const newY = currentMoving.y + currentMoving.h;
        if (item.y !== newY) {
          item.y = newY;
          hasChanges = true;
        }
      }
    }

    // Also check for cascading collisions between non-moving items
    for (let i = 0; i < result.length; i++) {
      const itemA = result[i];
      if (!itemA || itemA.static || itemA.id === movingItem.id) continue;

      for (let j = 0; j < result.length; j++) {
        if (i === j) continue;
        const itemB = result[j];
        if (!itemB || itemB.id === movingItem.id) continue;

        if (detectCollision(itemA, itemB)) {
          // Push the higher-indexed item down
          const lowerItem = itemA.y <= itemB.y ? itemA : itemB;
          const upperItem = itemA.y <= itemB.y ? itemB : itemA;

          if (upperItem && !upperItem.static) {
            const newY = lowerItem.y + lowerItem.h;
            if (upperItem.y < newY) {
              upperItem.y = newY;
              hasChanges = true;
            }
          }
        }
      }
    }
  }

  return result;
}
