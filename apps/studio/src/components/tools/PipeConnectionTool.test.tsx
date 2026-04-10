import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { KernelState, KernelStore } from '@thingsvis/kernel';
import PipeConnectionTool, { buildPipeSegmentHitRegions } from './PipeConnectionTool';

const reactActEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

function createKernelStore(state: Partial<KernelState>, updateNode = vi.fn()): KernelStore {
  const snapshot = {
    selection: { nodeIds: [] },
    nodesById: {},
    updateNode,
    ...state,
  } as KernelState & { updateNode: typeof updateNode };

  return {
    subscribe: () => () => undefined,
    getState: () => snapshot,
  } as unknown as KernelStore;
}

describe('PipeConnectionTool', () => {
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

  it('builds transparent midpoint hit regions from pipe points', () => {
    const hits = buildPipeSegmentHitRegions(
      [
        { x: 40, y: 80 },
        { x: 220, y: 80 },
        { x: 220, y: 180 },
      ],
      (x, y) => ({ x, y }),
    );

    expect(hits).toEqual([
      {
        key: 'seg-0',
        left: 121,
        top: 71,
        width: 18,
        height: 18,
        segmentIndex: 0,
      },
      {
        key: 'seg-1',
        left: 211,
        top: 121,
        width: 18,
        height: 18,
        segmentIndex: 1,
      },
    ]);
  });

  it('renders endpoint handles and transparent segment hits for a selected free pipe', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    act(() => {
      root?.render(
        <PipeConnectionTool
          kernelStore={createKernelStore({
            selection: { nodeIds: ['pipe-1'] },
            nodesById: {
              'pipe-1': {
                id: 'pipe-1',
                visible: true,
                locked: false,
                schemaRef: {
                  id: 'pipe-1',
                  type: 'industrial/pipe',
                  position: { x: 40, y: 60 },
                  size: { width: 180, height: 40 },
                  props: {
                    points: [
                      { x: 0, y: 20 },
                      { x: 180, y: 20 },
                    ],
                    pipeColor: '#28d4ff',
                    strokeWidth: 12,
                  },
                },
              },
            },
          })}
          getViewport={() => ({ zoom: 1, offsetX: 0, offsetY: 0 })}
        />,
      );
    });

    expect(container.querySelectorAll('[title^="Drag to connect"]')).toHaveLength(2);
    const segmentHits = Array.from(
      container.querySelectorAll('[data-pipe-segment-hit="true"]'),
    ) as HTMLDivElement[];
    expect(segmentHits).toHaveLength(1);
    expect(segmentHits[0]?.style.background).toBe('transparent');
    expect(segmentHits[0]?.style.cursor).toBe('move');
    expect(container.querySelector('[title="Drag segment midpoint to adjust routing"]')).toBeNull();
  });

  it('commits an orthogonal elbow when dragging a straight free pipe segment', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    const updateNode = vi.fn();

    act(() => {
      root?.render(
        <PipeConnectionTool
          kernelStore={createKernelStore(
            {
              selection: { nodeIds: ['pipe-1'] },
              nodesById: {
                'pipe-1': {
                  id: 'pipe-1',
                  visible: true,
                  locked: false,
                  schemaRef: {
                    id: 'pipe-1',
                    type: 'industrial/pipe',
                    position: { x: 40, y: 60 },
                    size: { width: 180, height: 40 },
                    props: {
                      points: [
                        { x: 0, y: 20 },
                        { x: 180, y: 20 },
                      ],
                      pipeColor: '#28d4ff',
                      strokeWidth: 12,
                    },
                  },
                },
              },
            },
            updateNode,
          )}
          getViewport={() => ({ zoom: 1, offsetX: 0, offsetY: 0 })}
        />,
      );
    });

    const segmentHit = container.querySelector(
      '[data-pipe-segment-hit="true"]',
    ) as HTMLDivElement | null;
    expect(segmentHit).not.toBeNull();

    act(() => {
      segmentHit?.dispatchEvent(
        new MouseEvent('mousedown', {
          bubbles: true,
          clientX: 130,
          clientY: 80,
        }),
      );
    });

    act(() => {
      window.dispatchEvent(
        new MouseEvent('mousemove', {
          bubbles: true,
          clientX: 130,
          clientY: 140,
        }),
      );
    });

    act(() => {
      window.dispatchEvent(
        new MouseEvent('mouseup', {
          bubbles: true,
          clientX: 130,
          clientY: 140,
        }),
      );
    });

    expect(updateNode).toHaveBeenCalledTimes(1);
    const [, patch] = updateNode.mock.calls[0]!;
    const committedPoints = patch.props.points as Array<{ x: number; y: number }>;
    const committedWaypoints = patch.props.waypoints as Array<{ x: number; y: number }>;

    expect(committedPoints).toHaveLength(4);
    expect(committedWaypoints).toHaveLength(2);
    expect(
      committedPoints.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y)),
    ).toBe(true);
    expect(committedPoints[0]!.x).toBe(committedPoints[1]!.x);
    expect(committedPoints[1]!.y).toBe(committedPoints[2]!.y);
    expect(committedPoints[2]!.x).toBe(committedPoints[3]!.x);
  });

  it('does not commit route changes on a plain segment click without drag movement', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    const updateNode = vi.fn();

    act(() => {
      root?.render(
        <PipeConnectionTool
          kernelStore={createKernelStore(
            {
              selection: { nodeIds: ['pipe-1'] },
              nodesById: {
                'pipe-1': {
                  id: 'pipe-1',
                  visible: true,
                  locked: false,
                  schemaRef: {
                    id: 'pipe-1',
                    type: 'industrial/pipe',
                    position: { x: 40, y: 60 },
                    size: { width: 180, height: 40 },
                    props: {
                      points: [
                        { x: 0, y: 20 },
                        { x: 180, y: 20 },
                      ],
                      pipeColor: '#28d4ff',
                      strokeWidth: 12,
                      _rotation: 90,
                    },
                  },
                },
              },
            },
            updateNode,
          )}
          getViewport={() => ({ zoom: 1, offsetX: 0, offsetY: 0 })}
        />,
      );
    });

    const segmentHit = container.querySelector(
      '[data-pipe-segment-hit="true"]',
    ) as HTMLDivElement | null;
    expect(segmentHit).not.toBeNull();

    act(() => {
      segmentHit?.dispatchEvent(
        new MouseEvent('mousedown', {
          bubbles: true,
          clientX: 130,
          clientY: 80,
        }),
      );
    });

    act(() => {
      window.dispatchEvent(
        new MouseEvent('mouseup', {
          bubbles: true,
          clientX: 130,
          clientY: 80,
        }),
      );
    });

    expect(updateNode).not.toHaveBeenCalled();
  });
});
