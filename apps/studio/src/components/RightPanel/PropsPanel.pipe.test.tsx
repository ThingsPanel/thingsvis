import { beforeAll, describe, expect, it, vi } from 'vitest';

let buildFreePipePropsPanelSizeProps: typeof import('./PropsPanel').buildFreePipePropsPanelSizeProps;

vi.mock('@thingsvis/ui', () => ({
  useDataSourceRegistry: () => ({ states: {} }),
  gridToPixel: vi.fn(),
  pixelToGrid: vi.fn(),
}));

beforeAll(async () => {
  const globalWithDragEvent = globalThis as any;
  if (!globalWithDragEvent.DragEvent) {
    globalWithDragEvent.DragEvent = class DragEvent extends Event {};
  }

  ({ buildFreePipePropsPanelSizeProps } = await import('./PropsPanel'));
});

describe('PropsPanel free pipe size edits', () => {
  it('keeps a vertical free pipe vertical when width/height are edited', () => {
    const props = buildFreePipePropsPanelSizeProps(
      {
        points: [
          { x: 8, y: 0 },
          { x: 8, y: 320 },
        ],
        waypoints: [],
      },
      { width: 16, height: 320 },
      { width: 24, height: 480 },
    );

    expect(props.points).toEqual([
      { x: 12, y: 0 },
      { x: 12, y: 480 },
    ]);
    expect(props.waypoints).toEqual([]);
  });

  it('keeps an authored elbow when the size panel resizes a free pipe', () => {
    const props = buildFreePipePropsPanelSizeProps(
      {
        points: [
          { x: 24, y: 20 },
          { x: 120, y: 20 },
          { x: 120, y: 84 },
          { x: 220, y: 84 },
        ],
      },
      { width: 220, height: 100 },
      { width: 330, height: 160 },
    );

    const points = props.points as Array<{ x: number; y: number }>;
    expect(points).toHaveLength(4);
    expect(points[0]).toEqual({ x: 36, y: 32 });
    expect(points[1]).toEqual({ x: 180, y: 32 });
    expect(points[2]!.x).toBe(180);
    expect(points[2]!.y).toBeCloseTo(134.4, 6);
    expect(points[3]!.x).toBe(330);
    expect(points[3]!.y).toBeCloseTo(134.4, 6);
    expect(props.waypoints).toHaveLength(2);
    expect((props.waypoints as Array<{ x: number; y: number }>)[0]).toEqual({ x: 180, y: 32 });
    expect((props.waypoints as Array<{ x: number; y: number }>)[1]!.x).toBe(180);
    expect((props.waypoints as Array<{ x: number; y: number }>)[1]!.y).toBeCloseTo(134.4, 6);
  });

  it('uses a deterministic fallback for invalid free-pipe geometry', () => {
    const props = buildFreePipePropsPanelSizeProps(
      { points: [{ x: 10, y: 10 }] },
      { width: 100, height: 100 },
      { width: 40, height: 120 },
    );

    expect(props.points).toEqual([
      { x: 20, y: 0 },
      { x: 20, y: 120 },
    ]);
    expect(props.waypoints).toEqual([]);
  });
});
