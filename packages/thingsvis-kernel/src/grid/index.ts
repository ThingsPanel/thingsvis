/**
 * Grid Layout Engine Exports
 * 
 * This module provides the headless grid layout engine for Gridstack-style layouts.
 * All exports are UI-free and operate on pure data.
 */

export { GridSystem } from './GridSystem';
export { GridLayoutError, type GridErrorCode } from './errors';
export { detectCollision, findCollisions, resolveCollisions } from './GridCollision';
export { compact, compactWithSort } from './GridCompaction';

export type {
  GridItem,
  GridLayoutResult,
  GridDelta,
  GridPreviewResult,
  MigrationRecord,
  PixelRect,
} from './types';
