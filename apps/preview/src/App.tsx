import React, { useCallback, useEffect, useSyncExternalStore, useMemo, useState } from 'react';
import type { NodeSchemaType, PageSchemaType } from '@thingsvis/schema';
import { createKernelStore } from '@thingsvis/kernel';
import { CanvasView, HeadlessErrorBoundary } from '@thingsvis/ui';
import { loadPlugin } from './plugins/pluginResolver';
import { extractDefaults } from './plugins/schemaUtils';

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

  /**
   * 从当前选中的插件 Schema 中创建一个标准节点
   * - 验证 Schema 是否存在
   * - 利用 Schema 默认值生成 props
   */
  const handleAddNodeFromSchema = useCallback(async () => {
    try {
      const { entry } = await loadPlugin(specComponentId);
      if (!entry.schema) {
        // 仅告警，不中断交互，方便调试不完整的插件
        // eslint-disable-next-line no-console
        console.warn('⚠️ 该组件缺少 schema 定义，不符合 Phase 3 默认值注入约定:', specComponentId);
      }
      const defaultProps = extractDefaults(entry.schema);
      const now = Date.now();
      const node: NodeSchemaType = {
        id: `node-${specComponentId}-${now}`,
        type: specComponentId,
        position: { x: 100, y: 100 },
        // Phase 3 这里只给一个兜底尺寸，具体含义由各插件 renderer 自行解释
        size: { width: 200, height: 80 },
        props: defaultProps
      };
      store.getState().addNodes([node]);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[preview] failed to add node from schema', e);
    }
  }, [specComponentId]);

  const handleLoadSpec = useCallback(async () => {
    setSpecError(null);
    setSpecComp(null);
    try {
      const plugin = await loadPlugin(specComponentId);
      if (!plugin.entry.schema) {
        // eslint-disable-next-line no-console
        console.warn('⚠️ 警告：该组件缺少 Schema 定义，不符合 Phase 3 交付标准', specComponentId);
      } else {
        // eslint-disable-next-line no-console
        console.log('✅ Schema Loaded:', plugin.entry.schema);
      }
      const Spec = plugin.entry.Spec as React.ComponentType | undefined;
      if (!Spec) {
        throw new Error('Plugin does not export Spec');
      }
      setSpecComp(() => Spec);
    } catch (e: any) {
      setSpecError(e?.message ?? String(e));
    }
  }, [specComponentId]);

  const resolvePlugin = useCallback(async (type: string) => {
    const { entry } = await loadPlugin(type);
    return entry;
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
          {/* ... existing content ... */}
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
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select value={specComponentId} onChange={e => setSpecComponentId(e.target.value)}>
              <option value="basic/rect">basic/rect</option>
              <option value="layout/text">layout/text</option>
              <option value="media/image">media/image</option>
              <option value="custom/cyber-clock">custom/cyber-clock</option>
              <option value="basic/switch">basic/switch</option>
              <option value="chart/echarts-bar">chart/echarts-bar</option>
            </select>
            <button onClick={handleLoadSpec}>Load Spec</button>
            <button onClick={handleAddNodeFromSchema}>Add Node from Schema</button>
          </div>
          {specError ? <div style={{ color: 'crimson' }}>{specError}</div> : null}
          {specComp ? (
            <div style={{ marginTop: 8 }}>
              {React.createElement(specComp)}
            </div>
          ) : null}
        </div>
        <CanvasView store={store} resolvePlugin={resolvePlugin} />
      </div>
    </HeadlessErrorBoundary>
  );
};

export default App;


