import { beforeEach, describe, expect, it } from 'vitest';
import { createKernelStore } from '../src/store/KernelStore';

const NODE_A = {
  id: 'node-a',
  type: 'basic/rect',
  position: { x: 0, y: 0 },
  size: { width: 120, height: 80 },
};

const NODE_B = {
  id: 'node-b',
  type: 'basic/text',
  position: { x: 200, y: 120 },
  size: { width: 160, height: 48 },
};

describe('selection and temporal history', () => {
  let store: ReturnType<typeof createKernelStore>;

  beforeEach(() => {
    store = createKernelStore();
    store.getState().addNodes([NODE_A, NODE_B]);
    store.temporal.getState().clear();
  });

  it('tracks multi-selection changes through the temporal store', () => {
    store.getState().selectNode('node-a');
    store.getState().toggleNodeSelection('node-b');

    expect(store.getState().selection.nodeIds).toEqual(['node-a', 'node-b']);
    expect(store.temporal.getState().pastStates.length).toBeGreaterThan(0);

    store.temporal.getState().undo();
    expect(store.getState().selection.nodeIds).toEqual(['node-a']);

    store.temporal.getState().redo();
    expect(store.getState().selection.nodeIds).toEqual(['node-a', 'node-b']);
  });

  it('undoes node mutations while keeping the current multi-selection snapshot', () => {
    store.getState().selectNodes(['node-a', 'node-b']);
    store.getState().updateNode('node-a', {
      position: { x: 320, y: 240 },
      size: { width: 200, height: 96 },
    });

    store.temporal.getState().undo();

    const stateAfterUndo = store.getState();
    const node = stateAfterUndo.nodesById['node-a'];

    expect(node?.schemaRef.position).toEqual({ x: 0, y: 0 });
    expect(node?.schemaRef.size).toEqual({ width: 120, height: 80 });
    expect(stateAfterUndo.selection.nodeIds).toEqual(['node-a', 'node-b']);
  });

  it('clears redo history after a divergent mutation', () => {
    store.getState().updateNode('node-a', { position: { x: 60, y: 30 } });
    store.temporal.getState().undo();

    expect(store.temporal.getState().futureStates).toHaveLength(1);

    store.getState().updateNode('node-b', { position: { x: 240, y: 140 } });

    expect(store.temporal.getState().futureStates).toHaveLength(0);
    expect(store.temporal.getState().pastStates).toHaveLength(1);
  });
});
