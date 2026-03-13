import { describe, expect, it } from 'vitest';
import type { BreakpointConfig, GridSettings } from '@thingsvis/schema';
import {
  calculateColWidth,
  getActiveBreakpoint,
  getEffectiveCols,
  gridToPixel,
  pixelToGrid,
  snapToGrid,
} from '../src/utils/grid-mapper';

const CONTAINER_WIDTH = 1200;
const GRID_SETTINGS: Pick<GridSettings, 'cols' | 'rowHeight' | 'gap'> = {
  cols: 12,
  rowHeight: 40,
  gap: 8,
};

describe('grid-mapper utilities', () => {
  it('calculates the column width from container width and gaps', () => {
    const colWidth = calculateColWidth(GRID_SETTINGS, CONTAINER_WIDTH);

    expect(colWidth).toBeCloseTo((CONTAINER_WIDTH - (GRID_SETTINGS.cols - 1) * GRID_SETTINGS.gap) / GRID_SETTINGS.cols);
  });

  it('round-trips a grid rectangle through pixel coordinates', () => {
    const gridRect = { x: 2, y: 3, w: 4, h: 2 };

    const pixelRect = gridToPixel(gridRect, GRID_SETTINGS, CONTAINER_WIDTH);
    const mappedBack = pixelToGrid(pixelRect, GRID_SETTINGS, CONTAINER_WIDTH);

    expect(mappedBack).toEqual(gridRect);
  });

  it('clamps negative positions and minimum dimensions when mapping pixels to grid cells', () => {
    const mapped = pixelToGrid(
      { x: -50, y: -1, width: 1, height: 1 },
      GRID_SETTINGS,
      CONTAINER_WIDTH,
    );

    expect(mapped).toEqual({ x: 0, y: 0, w: 1, h: 1 });
  });

  it('snaps pixel coordinates to the nearest grid cell boundary', () => {
    const snapped = snapToGrid({ x: 241, y: 95 }, GRID_SETTINGS, CONTAINER_WIDTH);

    expect(snapped.x).toBeCloseTo(201.33333333333334);
    expect(snapped.y).toBe(96);
  });

  it('selects the largest matching breakpoint after sorting custom breakpoints', () => {
    const breakpoints: BreakpointConfig[] = [
      { minWidth: 0, cols: 4, rowHeight: 24 },
      { minWidth: 900, cols: 12, rowHeight: 36 },
      { minWidth: 600, cols: 8, rowHeight: 30 },
    ];

    expect(getActiveBreakpoint(breakpoints, 950)).toEqual(breakpoints[1]);
    expect(getActiveBreakpoint(breakpoints, 650)).toEqual(breakpoints[2]);
    expect(getActiveBreakpoint(breakpoints, 320)).toEqual(breakpoints[0]);
  });

  it('falls back to base columns when responsive mode is disabled', () => {
    const cols = getEffectiveCols(
      {
        cols: 24,
        responsive: false,
        breakpoints: [{ minWidth: 0, cols: 6, rowHeight: 20 }],
      },
      320,
    );

    expect(cols).toBe(24);
  });

  it('uses breakpoint columns when responsive mode is enabled', () => {
    const cols = getEffectiveCols(
      {
        cols: 24,
        responsive: true,
        breakpoints: [
          { minWidth: 0, cols: 6, rowHeight: 20 },
          { minWidth: 960, cols: 12, rowHeight: 28 },
        ],
      },
      960,
    );

    expect(cols).toBe(12);
  });
});
