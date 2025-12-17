import React, { useCallback, useEffect, useSyncExternalStore, useMemo, useState } from 'react';
import type { NodeSchemaType, PageSchemaType } from '@thingsvis/schema';
import { createKernelStore } from '@thingsvis/kernel';
import { CanvasView, HeadlessErrorBoundary } from '@thingsvis/ui';
import { loadPlugin } from './plugins/pluginResolver';

const store = createKernelStore();



const randomColor = () => `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;
const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;

const App: React.FC = () => {
  const [specComponentId, setSpecComponentId] = useState<string>('basic/rect');
  const [specComp, setSpecComp] = useState<React.ComponentType | null>(null);
  const [specError, setSpecError] = useState<string | null>(null);
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

  const addStandardNode = useCallback((type: string) => {
    const id = `node-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const node: NodeSchemaType = {
      id,
      type,
      position: { x: randomBetween(50, 600), y: randomBetween(50, 400) },
      size: { width: 200, height: 120 },
      props: type === 'layout/text' ? { text: 'Hello', fontSize: 28, fill: '#111' } : type === 'media/image' ? { url: 'https://picsum.photos/200/120' } : { fill: randomColor() }
    };
    store.getState().addNodes([node]);
  }, []);

  const handleLoadSpec = useCallback(async () => {
    setSpecError(null);
    setSpecComp(null);
    try {
      const plugin = await loadPlugin(specComponentId);
      const Spec = plugin.entry.Spec as React.ComponentType | undefined;
      if (!Spec) {
        throw new Error('Plugin does not export Spec');
      }
      setSpecComp(() => Spec);
    } catch (e: any) {
      setSpecError(e?.message ?? String(e));
    }
  }, [specComponentId]);

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
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => addStandardNode('basic/rect')}>Add Rect (plugin)</button>
            <button onClick={() => addStandardNode('layout/text')}>Add Text (plugin)</button>
            <button onClick={() => addStandardNode('media/image')}>Add Image (plugin)</button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => store.temporal.getState().undo()} disabled={!canUndo}>
              Undo
            </button>
            <button onClick={() => store.temporal.getState().redo()} disabled={!canRedo}>
              Redo
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select value={specComponentId} onChange={e => setSpecComponentId(e.target.value)}>
              <option value="basic/rect">basic/rect</option>
              <option value="layout/text">layout/text</option>
              <option value="media/image">media/image</option>
              <option value="custom/cyber-clock">custom/cyber-clock</option>
            </select>
            <button onClick={handleLoadSpec}>Load Spec</button>
          </div>
          {specError ? <div style={{ color: 'crimson' }}>{specError}</div> : null}
          {specComp ? (
            <div style={{ marginTop: 8 }}>
              {React.createElement(specComp)}
            </div>
          ) : null}
        </div>
        <CanvasView store={store} resolvePlugin={async (type: string) => (await loadPlugin(type)).entry} />
      </div>
    </HeadlessErrorBoundary>
  );
};

export default App;


