import React, { useCallback, useEffect, useSyncExternalStore, useMemo } from 'react';
import type { NodeSchemaType, PageSchemaType } from '@thingsvis/schema';
import { createKernelStore } from '@thingsvis/kernel';
import { CanvasView, HeadlessErrorBoundary } from '@thingsvis/ui';

const store = createKernelStore();

const randomColor = () => `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;
const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;

const App: React.FC = () => {
  const temporalSnapshot = useSyncExternalStore(
    useCallback(
      subscribe => {
        // Subscribe to temporal history changes
        const unsub = store.temporal.subscribe(subscribe);
        return unsub;
      },
      []
    ),
    () => store.temporal.getState(),
    () => store.temporal.getState()
  );

  const { canUndo, canRedo } = useMemo(() => {
    const past = temporalSnapshot.pastStates ?? [];
    const future = temporalSnapshot.futureStates ?? [];
    return {
      canUndo: past.length > 0,
      canRedo: future.length > 0
    };
  }, [temporalSnapshot]);

  useEffect(() => {
    const emptyPage: PageSchemaType = {
      id: 'perf-demo',
      type: 'page',
      version: '1.0.0',
      nodes: []
    };
    store.getState().loadPage(emptyPage);
  }, []);

  const handleGenerate = useCallback(() => {
    const now = Date.now();
    const nodes: NodeSchemaType[] = Array.from({ length: 1000 }, (_, idx) => {
      const x = randomBetween(0, 2000);
      const y = randomBetween(0, 2000);
      return {
        id: `node-${now}-${idx}`,
        type: 'rect',
        position: { x, y },
        size: { width: 20, height: 20 },
        props: { fill: randomColor() }
      };
    });
    store.getState().addNodes(nodes);
  }, []);

  const handleClear = useCallback(() => {
    const emptyPage: PageSchemaType = {
      id: 'perf-demo',
      type: 'page',
      version: '1.0.0',
      nodes: []
    };
    store.getState().loadPage(emptyPage);
  }, []);

  return (
    <HeadlessErrorBoundary fallback={<div>Component failed</div>}>
      <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 8
          }}
        >
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleGenerate}>Generate 1000 Nodes</button>
            <button onClick={handleClear}>Clear</button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => store.temporal.getState().undo()} disabled={!canUndo}>
              Undo
            </button>
            <button onClick={() => store.temporal.getState().redo()} disabled={!canRedo}>
              Redo
            </button>
          </div>
        </div>
        <CanvasView store={store} />
      </div>
    </HeadlessErrorBoundary>
  );
};

export default App;


