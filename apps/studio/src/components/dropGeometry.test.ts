import { describe, expect, it } from 'vitest';
import { clampDropPointToCanvas, clampNodePositionToCanvas } from './dropGeometry';

describe('drop geometry', () => {
  it('keeps a node inside the artboard even when the pointer is outside it', () => {
    expect(
      clampNodePositionToCanvas(
        { x: 980, y: 760 },
        { width: 200, height: 100 },
        {
          width: 1000,
          height: 800,
        },
      ),
    ).toEqual({ x: 800, y: 700 });
  });

  it('keeps a multi-node preset inside the artboard', () => {
    expect(
      clampDropPointToCanvas(
        { x: 980, y: 780 },
        [
          { position: { x: 10, y: 20 }, size: { width: 200, height: 100 } },
          { position: { x: 250, y: 40 }, size: { width: 300, height: 200 } },
        ],
        { width: 1000, height: 800 },
      ),
    ).toEqual({ x: 460, y: 580 });
  });
});
