import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import type { KernelState, KernelStore } from '@thingsvis/kernel';
import LineConnectionTool from './LineConnectionTool';

const reactActEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

function createKernelStore(state: Partial<KernelState>): KernelStore {
  const snapshot = {
    selection: { nodeIds: [] },
    nodesById: {},
    ...state,
  } as KernelState;

  return {
    subscribe: () => () => undefined,
    getState: () => snapshot,
  } as KernelStore;
}

describe('LineConnectionTool', () => {
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

  it('does not render connector handles when no line is selected', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    act(() => {
      root?.render(
        <LineConnectionTool
          kernelStore={createKernelStore({})}
          getViewport={() => ({ zoom: 1, offsetX: 0, offsetY: 0 })}
        />,
      );
    });

    expect(container.innerHTML).toBe('');
  });

  it('renders endpoint handles when a single line is selected', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    act(() => {
      root?.render(
        <LineConnectionTool
          kernelStore={createKernelStore({
            selection: { nodeIds: ['line-1'] },
            nodesById: {
              'line-1': {
                id: 'line-1',
                schemaRef: {
                  type: 'basic/line',
                  position: { x: 40, y: 60 },
                  size: { width: 200, height: 80 },
                  props: {
                    points: [
                      { x: 0, y: 0.5 },
                      { x: 1, y: 0.5 },
                    ],
                  },
                },
              },
            },
          })}
          getViewport={() => ({ zoom: 1, offsetX: 0, offsetY: 0 })}
        />,
      );
    });

    expect(container.querySelectorAll('[title*="endpoint"]')).toHaveLength(2);
  });
});
