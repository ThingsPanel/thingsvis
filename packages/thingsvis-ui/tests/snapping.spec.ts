import { describe, expect, it } from 'vitest';
import { snapPointToGrid, snapToGrid } from '../src/utils/snapping';

const GRID_SIZE = 20;

describe('snapping utilities', () => {
  it('returns the original value when the grid size is invalid', () => {
    expect(snapToGrid(37, 0)).toBe(37);
    expect(snapToGrid(37, -5)).toBe(37);
  });

  it('rounds positive values to the nearest grid line', () => {
    expect(snapToGrid(29, GRID_SIZE)).toBe(20);
    expect(snapToGrid(31, GRID_SIZE)).toBe(40);
  });

  it('rounds negative values symmetrically', () => {
    expect(snapToGrid(-29, GRID_SIZE)).toBe(-20);
    expect(snapToGrid(-31, GRID_SIZE)).toBe(-40);
  });

  it('snaps both point axes using the scalar helper', () => {
    expect(snapPointToGrid({ x: 11, y: 39 }, GRID_SIZE)).toEqual({ x: 20, y: 40 });
  });
});
