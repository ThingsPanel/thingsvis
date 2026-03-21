import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
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
});
