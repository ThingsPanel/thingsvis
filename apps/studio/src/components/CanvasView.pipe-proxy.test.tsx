import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import {
  buildPipeProxySegments,
  getPipeProxyHitThickness,
  PipeProxyHits,
} from './CanvasView.pipeProxy';

const reactActEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

describe('CanvasView pipe proxy helpers', () => {
  reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true;

  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
      root = null;
    }
    container?.remove();
    container = null;
  });

  it('uses a minimum hit thickness and clamps oversized strokes', () => {
    expect(getPipeProxyHitThickness(undefined)).toBe(22);
    expect(getPipeProxyHitThickness(4)).toBe(18);
    expect(getPipeProxyHitThickness(120)).toBe(90);
  });

  it('builds one padded hit segment for a horizontal pipe run', () => {
    const segments = buildPipeProxySegments(
      [
        { x: 100, y: 60 },
        { x: 340, y: 60 },
      ],
      { x: 100, y: 40 },
      14,
    );

    expect(segments).toEqual([
      {
        key: 'h-1',
        left: -12,
        top: 8,
        width: 264,
        height: 24,
      },
    ]);
  });

  it('keeps dirty near-horizontal legacy routes draggable', () => {
    const segments = buildPipeProxySegments(
      [
        { x: 347.56, y: 40.91 },
        { x: 40, y: 40 },
      ],
      { x: 40, y: 40 },
      14,
    );

    expect(segments).toHaveLength(1);
    expect(segments[0]?.key).toBe('h-1');
    expect(segments[0]?.width).toBeGreaterThan(300);
    expect(segments[0]?.height).toBe(getPipeProxyHitThickness(14));
  });

  it('renders proxy hit divs with node identity and move cursor', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    const segments = buildPipeProxySegments(
      [
        { x: 120, y: 200 },
        { x: 120, y: 320 },
        { x: 280, y: 320 },
      ],
      { x: 100, y: 180 },
      12,
    );

    act(() => {
      root?.render(
        <PipeProxyHits
          nodeId="pipe-1"
          segments={segments}
          isPanTool={false}
          formatBrushActive={false}
          canvasCursor="default"
        />,
      );
    });

    const hits = Array.from(container.querySelectorAll('.pipe-proxy-hit')) as HTMLDivElement[];

    expect(hits).toHaveLength(2);
    expect(hits.every((hit) => hit.dataset.nodeId === 'pipe-1')).toBe(true);
    expect(hits.every((hit) => hit.style.cursor === 'move')).toBe(true);
  });
});
