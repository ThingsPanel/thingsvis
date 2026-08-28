import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GridNodeItem } from './GridNodeItem';

const reactActEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

function createStore(nodeId: string) {
  const state = {
    nodesById: {
      [nodeId]: {
        id: nodeId,
        visible: true,
        locked: false,
        schemaRef: {
          id: nodeId,
          type: 'basic/text',
          props: { text: 'Label' },
          baseStyle: {},
        },
      },
    },
    dataSources: {},
  };

  return {
    getState: () => state,
    subscribe: () => () => undefined,
  } as any;
}

describe('GridNodeItem', () => {
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

  it('keeps stacking tied to layer order even when the node is selected', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    act(() => {
      root?.render(
        <GridNodeItem
          nodeId="node-1"
          layerIndex={0}
          pixelRect={{ x: 0, y: 0, width: 120, height: 40 }}
          store={createStore('node-1')}
          interactive={true}
          isSelected={true}
          onDragStart={() => undefined}
          onDragMove={() => undefined}
          onDragEnd={() => undefined}
          onResizeStart={() => undefined}
          onResizeMove={() => undefined}
          onResizeEnd={() => undefined}
          onSelect={() => undefined}
        />,
      );
    });

    const nodeEl = container.querySelector('[data-node-id="node-1"]') as HTMLDivElement | null;
    expect(nodeEl?.style.zIndex).toBe('1');
  });

  it('updates only when a referenced data source changes', async () => {
    const listeners = new Set<() => void>();
    const state: any = {
      nodesById: {
        'node-runtime': {
          id: 'node-runtime',
          visible: true,
          locked: false,
          schemaRef: {
            id: 'node-runtime',
            type: 'test/runtime-dependencies',
            props: { value: '{{ ds.primary.data.value }}' },
            baseStyle: {},
          },
        },
      },
      dataSources: {
        primary: { data: { value: 1 }, status: 'connected' },
        other: { data: { value: 1 }, status: 'connected' },
      },
      variableValues: {},
    };
    const store: any = {
      getState: () => state,
      subscribe: (listener: () => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    };
    const update = vi.fn();
    const resolveWidget = vi.fn(async () => ({
      createOverlay: () => ({ element: document.createElement('div'), update }),
    }));
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(
        <GridNodeItem
          nodeId="node-runtime"
          layerIndex={0}
          pixelRect={{ x: 0, y: 0, width: 120, height: 40 }}
          store={store}
          resolveWidget={resolveWidget as any}
          interactive={false}
          isSelected={false}
          onDragStart={() => undefined}
          onDragMove={() => undefined}
          onDragEnd={() => undefined}
          onResizeStart={() => undefined}
          onResizeMove={() => undefined}
          onResizeEnd={() => undefined}
          onSelect={() => undefined}
        />,
      );
      await Promise.resolve();
    });
    const initialUpdates = update.mock.calls.length;

    await act(async () => {
      state.dataSources = {
        ...state.dataSources,
        other: { data: { value: 2 }, status: 'connected' },
      };
      listeners.forEach((listener) => listener());
    });
    expect(update).toHaveBeenCalledTimes(initialUpdates);

    await act(async () => {
      state.dataSources = {
        ...state.dataSources,
        primary: { data: { value: 2 }, status: 'connected' },
      };
      listeners.forEach((listener) => listener());
    });
    expect(update.mock.calls.length).toBeGreaterThan(initialUpdates);
  });
});
