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

  it('keeps circle base style and clipping circular regardless of numeric radius', () => {
    const store = createStore('circle-node');
    const schema = store.getState().nodesById['circle-node'].schemaRef;
    schema.type = 'basic/circle';
    schema.baseStyle = { border: { width: 8, radius: 0, color: '#944' } };
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    act(() => {
      root?.render(
        <GridNodeItem
          nodeId="circle-node"
          layerIndex={0}
          pixelRect={{ x: 0, y: 0, width: 100, height: 100 }}
          store={store}
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
    });

    const nodeEl = container.querySelector('[data-node-id="circle-node"]') as HTMLDivElement;
    const clipEl = nodeEl.firstElementChild as HTMLDivElement;
    expect(nodeEl.style.borderRadius).toBe('50%');
    expect(clipEl.style.borderRadius).toBe('50%');
  });

  it.each(['ready', 'error'])('reports %s only after the asynchronous widget load settles', async (outcome) => {
    const store = createStore('pending-node');
    store.getState().nodesById['pending-node'].schemaRef.type = `test/pending-${outcome}`;
    let resolve!: (value: any) => void;
    let reject!: (reason: Error) => void;
    const pending = new Promise<any>((yes, no) => { resolve = yes; reject = no; });
    const report = vi.fn();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => {
      root?.render(<GridNodeItem nodeId="pending-node" layerIndex={0}
        pixelRect={{ x: 0, y: 0, width: 200, height: 150 }} store={store}
        resolveWidget={() => pending} onRenderState={report} interactive={false} isSelected={false}
        onDragStart={() => {}} onDragMove={() => {}} onDragEnd={() => {}}
        onResizeStart={() => {}} onResizeMove={() => {}} onResizeEnd={() => {}} onSelect={() => {}} />);
    });
    expect(report.mock.calls).toEqual([['pending-node', 'loading']]);
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await act(async () => {
        if (outcome === 'error') reject(new Error('Network unavailable'));
        else resolve({ createOverlay: () => {
          const element = document.createElement('div');
          element.textContent = 'Rendered content';
          return { element };
        } });
      });
      expect(report.mock.calls).toEqual([['pending-node', 'loading'], ['pending-node', outcome]]);
      expect(container.textContent).toContain(outcome === 'ready' ? 'Rendered content' : 'Network unavailable');
    } finally { log.mockRestore(); }
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
