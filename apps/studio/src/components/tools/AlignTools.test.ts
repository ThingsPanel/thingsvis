import { describe, expect, it } from 'vitest';
import {
  isAlignButtonAvailable,
  resolveAlignedPosition,
  shouldShowAlignTools,
  type AlignType,
} from './AlignTools';

const bbox = {
  left: 100,
  top: 200,
  right: 500,
  bottom: 500,
  width: 400,
  height: 300,
  centerX: 300,
  centerY: 350,
};

function resolve(type: AlignType, selectedCount: number) {
  return resolveAlignedPosition({
    type,
    selectedCount,
    currentX: 120,
    currentY: 240,
    width: 180,
    height: 60,
    bbox,
    canvasWidth: 1920,
    canvasHeight: 1080,
  });
}

describe('AlignTools helpers', () => {
  it('shows alignment tools for a single selected node', () => {
    expect(shouldShowAlignTools(1, false)).toBe(true);
    expect(shouldShowAlignTools(0, false)).toBe(false);
    expect(shouldShowAlignTools(1, true)).toBe(false);
  });

  it('maps single-node align actions to canvas edges and centers', () => {
    expect(resolve('left', 1)).toEqual({ x: 0, y: 240 });
    expect(resolve('right', 1)).toEqual({ x: 1740, y: 240 });
    expect(resolve('top', 1)).toEqual({ x: 120, y: 0 });
    expect(resolve('bottom', 1)).toEqual({ x: 120, y: 1020 });
    expect(resolve('center-h', 1)).toEqual({ x: 870, y: 240 });
    expect(resolve('center-v', 1)).toEqual({ x: 120, y: 510 });
    expect(resolve('canvas-center', 1)).toEqual({ x: 870, y: 510 });
  });

  it('keeps multi-node align actions relative to the selection bounds', () => {
    expect(resolve('left', 2)).toEqual({ x: 100, y: 240 });
    expect(resolve('right', 2)).toEqual({ x: 320, y: 240 });
    expect(resolve('top', 2)).toEqual({ x: 120, y: 200 });
    expect(resolve('bottom', 2)).toEqual({ x: 120, y: 440 });
    expect(resolve('center-h', 2)).toEqual({ x: 210, y: 240 });
    expect(resolve('center-v', 2)).toEqual({ x: 120, y: 320 });
  });

  it('only enables distribute actions when at least three nodes are selected', () => {
    expect(isAlignButtonAvailable('distribute-h', 1)).toBe(false);
    expect(isAlignButtonAvailable('distribute-v', 2)).toBe(false);
    expect(isAlignButtonAvailable('distribute-h', 3)).toBe(true);
    expect(isAlignButtonAvailable('left', 1)).toBe(true);
  });
});
