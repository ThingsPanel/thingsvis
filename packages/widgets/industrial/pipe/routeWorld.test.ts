import { describe, expect, it } from 'vitest';
import {
  computeIndustrialPipeLocalRoute,
  fitWorldRouteToNodeBox,
  localRouteToWaypoints,
  movePipeSegment,
  worldRouteToLocalPoints,
  worldRouteToLocalWaypoints,
} from './src/routeWorld';
import { getDefaultProps } from './src/schema';

function mockRect(
  element: Element | null,
  rect: { left: number; top: number; width: number; height: number },
) {
  if (!element) throw new Error('Expected element to exist');
  Object.defineProperty(element, 'getBoundingClientRect', {
    configurable: true,
    value: () =>
      ({
        x: rect.left,
        y: rect.top,
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        right: rect.left + rect.width,
        bottom: rect.top + rect.height,
        toJSON: () => ({}),
      }) as DOMRect,
  });
}

describe('industrial pipe routeWorld helpers', () => {
  it('keeps widget endpoints when rebuilding a disconnected route from waypoints', () => {
    const route = computeIndustrialPipeLocalRoute(
      {
        ...getDefaultProps(),
        waypoints: [
          { x: 0, y: 84 },
          { x: 240, y: 84 },
        ],
      },
      { width: 240, height: 80 },
      { x: 0, y: 0 },
      undefined,
      { viewport: { zoom: 1, offsetX: 0, offsetY: 0 }, containerEl: null },
    );

    expect(route[0]).toEqual({ x: 0, y: 40 });
    expect(route[route.length - 1]).toEqual({ x: 240, y: 40 });
    expect(route.some((point) => point.y === 84)).toBe(true);
  });

  it('converts a world route back to local interior waypoints', () => {
    const waypoints = worldRouteToLocalWaypoints(
      [
        { x: 320, y: 180 },
        { x: 320, y: 240 },
        { x: 460, y: 240 },
        { x: 460, y: 320 },
      ],
      { x: 320, y: 180 },
    );

    expect(waypoints).toEqual([
      { x: 0, y: 60 },
      { x: 140, y: 60 },
    ]);
  });

  it('creates a bend when dragging the midpoint of a straight segment', () => {
    const route = movePipeSegment(
      [
        { x: 0, y: 40 },
        { x: 240, y: 40 },
      ],
      0,
      { x: 120, y: 96 },
    );

    expect(route).toEqual([
      { x: 0, y: 40 },
      { x: 0, y: 96 },
      { x: 240, y: 96 },
      { x: 240, y: 40 },
    ]);
  });

  it('rebuilds a moved segment into a minimal orthogonal corridor instead of preserving loops', () => {
    const route = movePipeSegment(
      [
        { x: 0, y: 120 },
        { x: 0, y: 20 },
        { x: 220, y: 20 },
        { x: 220, y: 220 },
        { x: 60, y: 220 },
        { x: 60, y: 140 },
        { x: 320, y: 140 },
      ],
      2,
      { x: 170, y: 160 },
      { sourceAnchor: 'right', targetAnchor: 'left' },
    );

    expect(route).toEqual([
      { x: 0, y: 120 },
      { x: 170, y: 120 },
      { x: 170, y: 140 },
      { x: 320, y: 140 },
    ]);
  });

  it('honors anchor direction when rebuilding a moved middle segment', () => {
    const route = movePipeSegment(
      [
        { x: 0, y: 40 },
        { x: 120, y: 40 },
        { x: 120, y: 120 },
        { x: 240, y: 120 },
      ],
      1,
      { x: 180, y: 80 },
      { sourceAnchor: 'right', targetAnchor: 'left' },
    );

    expect(route).toEqual([
      { x: 0, y: 40 },
      { x: 180, y: 40 },
      { x: 180, y: 120 },
      { x: 240, y: 120 },
    ]);
  });

  it('prefers the shortest bound route when stale waypoints create a large detour', () => {
    const route = computeIndustrialPipeLocalRoute(
      {
        ...getDefaultProps(),
        sourceNodeId: 'bottom',
        sourceAnchor: 'left',
        targetNodeId: 'top',
        targetAnchor: 'bottom',
        waypoints: [
          { x: 415.125, y: 134 },
          { x: 415.125, y: 295.2499771118164 },
          { x: 161, y: 295.2499771118164 },
          { x: 161, y: 40 },
          { x: 100, y: 40 },
        ],
      },
      { width: 513.5, height: 88 },
      { x: 338.5, y: 317.5 },
      {
        top: {
          id: 'top',
          position: { x: 457, y: 281.5 },
          size: { width: 120, height: 80 },
        },
        bottom: {
          id: 'bottom',
          position: { x: 382.5, y: 811.25 },
          size: { width: 120, height: 80 },
        },
      },
      { viewport: { zoom: 1, offsetX: 0, offsetY: 0 }, containerEl: null },
    );

    expect(route).toEqual([
      { x: 44, y: 533.75 },
      { x: -136, y: 533.75 },
      { x: -136, y: 288.875 },
      { x: 178.5, y: 288.875 },
      { x: 178.5, y: 44 },
    ]);
  });

  it('resolves anchors from linkedNodes objects without schemaRef wrappers', () => {
    const route = computeIndustrialPipeLocalRoute(
      {
        ...getDefaultProps(),
        sourceNodeId: 'left',
        sourceAnchor: 'right',
        targetNodeId: 'right',
        targetAnchor: 'left',
      },
      { width: 260, height: 120 },
      { x: 220, y: 190 },
      {
        left: {
          id: 'left',
          position: { x: 120, y: 180 },
          size: { width: 120, height: 80 },
        },
        right: {
          id: 'right',
          position: { x: 520, y: 220 },
          size: { width: 120, height: 80 },
        },
      },
      { viewport: { zoom: 1, offsetX: 0, offsetY: 0 }, containerEl: null },
    );

    expect(route[0]).toEqual({ x: 20, y: 30 });
    expect(route[route.length - 1]).toEqual({ x: 300, y: 70 });
  });

  it('treats explicit local points as the canonical route when no nodes are bound', () => {
    const route = computeIndustrialPipeLocalRoute(
      {
        ...getDefaultProps(),
        points: [
          { x: 10, y: 30 },
          { x: 140, y: 30 },
          { x: 140, y: 70 },
          { x: 280, y: 70 },
        ],
      },
      { width: 260, height: 120 },
      { x: 220, y: 190 },
      undefined,
      { viewport: { zoom: 1, offsetX: 0, offsetY: 0 }, containerEl: null },
    );

    expect(route).toEqual([
      { x: 10, y: 30 },
      { x: 140, y: 30 },
      { x: 140, y: 70 },
      { x: 280, y: 70 },
    ]);
  });

  it('uses bound anchors but preserves interior bends when explicit points exist', () => {
    const route = computeIndustrialPipeLocalRoute(
      {
        ...getDefaultProps(),
        sourceNodeId: 'left',
        sourceAnchor: 'right',
        targetNodeId: 'right',
        targetAnchor: 'left',
        points: [
          { x: 20, y: 30 },
          { x: 160, y: 30 },
          { x: 160, y: 70 },
          { x: 300, y: 70 },
        ],
      },
      { width: 260, height: 120 },
      { x: 220, y: 190 },
      {
        left: {
          id: 'left',
          position: { x: 120, y: 180 },
          size: { width: 120, height: 80 },
        },
        right: {
          id: 'right',
          position: { x: 620, y: 280 },
          size: { width: 120, height: 80 },
        },
      },
      { viewport: { zoom: 1, offsetX: 0, offsetY: 0 }, containerEl: null },
    );

    expect(route).toEqual([
      { x: 20, y: 30 },
      { x: 210, y: 30 },
      { x: 210, y: 130 },
      { x: 400, y: 130 },
    ]);
  });

  it('keeps free endpoint positions from explicit points when only one side is bound', () => {
    const route = computeIndustrialPipeLocalRoute(
      {
        ...getDefaultProps(),
        targetNodeId: 'right',
        targetAnchor: 'left',
        points: [
          { x: 260, y: 40 },
          { x: 180, y: 40 },
          { x: 180, y: 100 },
          { x: 40, y: 100 },
        ],
      },
      { width: 300, height: 160 },
      { x: 200, y: 140 },
      {
        right: {
          id: 'right',
          position: { x: 520, y: 220 },
          size: { width: 120, height: 80 },
        },
      },
      { viewport: { zoom: 1, offsetX: 0, offsetY: 0 }, containerEl: null },
    );

    expect(route).toEqual([
      { x: 260, y: 40 },
      { x: 260, y: 120 },
      { x: 320, y: 120 },
    ]);
  });

  it('round-trips a world route into canonical local points and waypoints', () => {
    const route = [
      { x: 320, y: 180 },
      { x: 440, y: 180 },
      { x: 440, y: 260 },
      { x: 620, y: 260 },
    ];

    expect(worldRouteToLocalPoints(route, { x: 320, y: 180 })).toEqual([
      { x: 0, y: 0 },
      { x: 120, y: 0 },
      { x: 120, y: 80 },
      { x: 300, y: 80 },
    ]);
    expect(localRouteToWaypoints(worldRouteToLocalPoints(route, { x: 320, y: 180 }))).toEqual([
      { x: 120, y: 0 },
      { x: 120, y: 80 },
    ]);
  });

  it('fits a world route back into a stable node box for manual edits', () => {
    const fitted = fitWorldRouteToNodeBox(
      [
        { x: 320, y: 180 },
        { x: 320, y: 240 },
        { x: 460, y: 240 },
        { x: 460, y: 320 },
      ],
      12,
    );

    expect(fitted.position).toEqual({ x: 284, y: 144 });
    expect(fitted.size).toEqual({ width: 212, height: 212 });
    expect(fitted.points).toEqual([
      { x: 36, y: 36 },
      { x: 36, y: 96 },
      { x: 176, y: 96 },
      { x: 176, y: 176 },
    ]);
    expect(fitted.waypoints).toEqual([
      { x: 36, y: 96 },
      { x: 176, y: 96 },
    ]);
  });

  it('falls back to overlay or proxy DOM bounds when linkedNodes are unavailable', () => {
    document.body.innerHTML = `
      <div id="mount" style="position:relative; width:1200px; height:800px;">
        <div class="thingsvis-widget-layer">
          <div data-overlay-node-id="left" style="position:absolute; left:120px; top:180px; width:120px; height:80px;"></div>
          <div data-overlay-node-id="right" style="position:absolute; left:520px; top:220px; width:120px; height:80px;"></div>
        </div>
      </div>
    `;
    mockRect(document.getElementById('mount'), { left: 0, top: 0, width: 1200, height: 800 });
    mockRect(document.querySelector('[data-overlay-node-id="left"]'), { left: 120, top: 180, width: 120, height: 80 });
    mockRect(document.querySelector('[data-overlay-node-id="right"]'), { left: 520, top: 220, width: 120, height: 80 });

    const route = computeIndustrialPipeLocalRoute(
      {
        ...getDefaultProps(),
        sourceNodeId: 'left',
        sourceAnchor: 'right',
        targetNodeId: 'right',
        targetAnchor: 'left',
      },
      { width: 260, height: 120 },
      { x: 220, y: 190 },
      undefined,
      { viewport: { zoom: 1, offsetX: 0, offsetY: 0 }, containerEl: document.getElementById('mount') as HTMLElement },
    );

    expect(route[0]).toEqual({ x: 20, y: 30 });
    expect(route[route.length - 1]).toEqual({ x: 300, y: 70 });
  });
});
