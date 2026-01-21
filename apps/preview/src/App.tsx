import React, { useCallback, useEffect, useSyncExternalStore, useMemo, useState } from 'react';
import type { NodeSchemaType, PageSchemaType } from '@thingsvis/schema';
import { createKernelStore } from '@thingsvis/kernel';
import { CanvasView, GridStackCanvas, HeadlessErrorBoundary } from '@thingsvis/ui';
import { loadPlugin } from './plugins/pluginResolver';
import { extractDefaults } from './plugins/schemaUtils';
import { usePreviewMode } from './hooks/usePreviewMode';
import { UserToolbar } from './components/UserToolbar';
import { KioskView } from './components/KioskView';
import { loadProject, type ProjectFile } from './lib/projectStorage';

const store = createKernelStore();



const randomColor = () => `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;
const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;

const App: React.FC = () => {
  // Preview mode detection from URL
  const previewState = usePreviewMode()
  
  const [specComponentId, setSpecComponentId] = useState<string>('basic/text');
  const [specComp, setSpecComp] = useState<React.ComponentType | null>(null);
  const [specError, setSpecError] = useState<string | null>(null);
  const [projectLoaded, setProjectLoaded] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string | undefined>(undefined);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])
  
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

  const kernelState = useSyncExternalStore(
    useCallback((subscribe) => store.subscribe(subscribe), []),
    () => store.getState() as any,
    () => store.getState() as any
  );

  const canvasMode = kernelState?.canvas?.mode ?? 'infinite';
  const canvasWidth = kernelState?.canvas?.width ?? 1920;
  const canvasHeight = kernelState?.canvas?.height ?? 1080;
  const hasGridNodes = useMemo(() => {
    const nodesById = kernelState?.nodesById as Record<string, any> | undefined;
    if (!nodesById) return false;
    return Object.values(nodesById).some((node: any) => Boolean(node?.schemaRef?.grid));
  }, [kernelState]);
  const isGridLayout = canvasMode === 'reflow' || canvasMode === 'grid' || hasGridNodes;
  const gridSettings = kernelState?.gridState?.settings ?? {
    cols: 24,
    rowHeight: 50,
    gap: 5,
    compactVertical: true,
    minW: 1,
    minH: 1,
    showGridLines: false,
    breakpoints: [],
    responsive: true,
  };

  const { canUndo, canRedo } = useMemo(() => {
    const past = temporalSnapshot.pastStates ?? [];
    const future = temporalSnapshot.futureStates ?? [];
    return {
      canUndo: past.length > 0,
      canRedo: future.length > 0
    };
  }, [temporalSnapshot]);

  // Load project via postMessage from opener window (studio)
  useEffect(() => {
    // Get projectId from URL params
    const params = new URLSearchParams(window.location.search)
    const projectId = params.get('projectId')
    const mode = params.get('mode')
    
    if (!projectId || mode === 'dev') {
      // Dev mode, no project to load
      return
    }
    
    console.log('[preview] Requesting project data via postMessage:', projectId)
    
    // Listen for project data from studio
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'THINGSVIS_PROJECT_DATA' && event.data?.projectId === projectId) {
        console.log('[preview] Received project data via postMessage')
        const project = event.data.data
        
        if (!project) {
          setProjectError('No project data received.')
          return
        }
        
        try {
          // Load project into kernel store
          const pageData: PageSchemaType = {
            id: project.meta?.id || projectId,
            type: 'page',
            version: project.meta?.version || '1.0.0',
            nodes: project.nodes || [],
          }
          
          // Update canvas config in store
          if (project.canvas) {
            store.getState().updateCanvas({
              mode: project.canvas.mode || 'infinite',
              width: project.canvas.width || 1920,
              height: project.canvas.height || 1080,
            })
            store.getState().setGridSettings?.({
              cols: project.canvas.gridCols ?? 24,
              rowHeight: project.canvas.gridRowHeight ?? 50,
              gap: project.canvas.gridGap ?? 5,
            })
          }
          
          // Load the page with nodes
          store.getState().loadPage(pageData)
          
          setProjectName(project?.meta?.name)
          setProjectLoaded(true)
          console.log('[preview] Project loaded successfully with', project.nodes?.length || 0, 'nodes')
        } catch (error) {
          console.error('[preview] Failed to process project data:', error)
          setProjectError('Failed to process project data.')
        }
      }
    }
    
    window.addEventListener('message', handleMessage)
    
    // Request project data from opener (studio window)
    if (window.opener) {
      // Small delay to ensure studio's message listener is ready
      setTimeout(() => {
        window.opener.postMessage({
          type: 'THINGSVIS_REQUEST_PROJECT_DATA',
          projectId,
        }, '*')
      }, 100)
    } else {
      setProjectError('Preview must be opened from the editor.')
    }
    
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  // Initialize empty page only in dev mode (no projectId in URL)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const projectId = params.get('projectId')
    const mode = params.get('mode')
    
    if (mode === 'dev' || !projectId) {
      const emptyPage: PageSchemaType = {
        id: 'perf-demo',
        type: 'page',
        version: '1.0.0',
        nodes: []
      };
      store.getState().loadPage(emptyPage);
    }
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
      const Spec = (plugin.entry as any).Spec as React.ComponentType | undefined;
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

  // Handle going back to studio
  const handleBackToStudio = useCallback(() => {
    // Navigate back to studio (or close window if opened as popup)
    if (window.opener) {
      window.close()
    } else {
      window.location.href = '/studio'
    }
  }, [])

  const handleRefresh = useCallback(() => {
    window.location.reload()
  }, [])

  const handleToggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(console.error)
      return
    }
    document.documentElement.requestFullscreen?.().catch(console.error)
  }, [])

  // Determine if we need to load a project
  const params = new URLSearchParams(window.location.search)
  const urlProjectId = params.get('projectId')
  const urlMode = params.get('mode') || 'dev'
  const needsProjectLoad = !!urlProjectId && urlMode !== 'dev'

  // Kiosk mode: fullscreen wrapper
  if (urlMode === 'kiosk') {
    // Show loading state
    if (needsProjectLoad && !projectLoaded && !projectError) {
      return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a', color: '#fff' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>Loading...</div>
            <div style={{ fontSize: '14px', opacity: 0.7 }}>Preparing your visualization</div>
          </div>
        </div>
      )
    }
    
    // Show error state
    if (projectError) {
      return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a', color: '#fff' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px', color: '#ef4444' }}>Error</div>
            <div style={{ fontSize: '14px', opacity: 0.7 }}>{projectError}</div>
          </div>
        </div>
      )
    }
    
    return (
      <HeadlessErrorBoundary fallback={<div>Component failed</div>}>
        <KioskView>
          {isGridLayout ? (
            <GridStackCanvas
              store={store}
              resolvePlugin={resolvePlugin}
              width={canvasWidth}
              height={canvasHeight}
              settings={gridSettings}
              interactive={false}
            />
          ) : (
            <CanvasView store={store} resolvePlugin={resolvePlugin} gridSize={0} />
          )}
        </KioskView>
      </HeadlessErrorBoundary>
    )
  }

  // User mode: minimal toolbar with back button
  if (urlMode === 'user') {
    // Show loading state
    if (needsProjectLoad && !projectLoaded && !projectError) {
      return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a', color: '#fff' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>Loading...</div>
            <div style={{ fontSize: '14px', opacity: 0.7 }}>Preparing your visualization</div>
          </div>
        </div>
      )
    }
    
    // Show error state
    if (projectError) {
      return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a', color: '#fff' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px', color: '#ef4444' }}>Error</div>
            <div style={{ fontSize: '14px', opacity: 0.7 }}>{projectError}</div>
            <button 
              onClick={handleBackToStudio}
              style={{ marginTop: '16px', padding: '8px 16px', background: '#6965db', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Back to Studio
            </button>
          </div>
        </div>
      )
    }
    
    return (
      <HeadlessErrorBoundary fallback={<div>Component failed</div>}>
        <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
          <UserToolbar
            onBack={handleBackToStudio}
            onRefresh={handleRefresh}
            projectName={projectName}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
          />
          {isGridLayout ? (
            <GridStackCanvas
              store={store}
              resolvePlugin={resolvePlugin}
              width={canvasWidth}
              height={canvasHeight}
              settings={gridSettings}
              interactive={false}
            />
          ) : (
            <CanvasView store={store} resolvePlugin={resolvePlugin} gridSize={0} />
          )}
        </div>
      </HeadlessErrorBoundary>
    )
  }

  // Dev mode: full development UI with controls
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
          {/* Development controls */}
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
              <option value="basic/text">basic/text</option>
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
        {isGridLayout ? (
            <GridStackCanvas
              store={store}
              resolvePlugin={resolvePlugin}
              width={canvasWidth}
              height={canvasHeight}
              settings={gridSettings}
              interactive={false}
            />
        ) : (
          <CanvasView store={store} resolvePlugin={resolvePlugin} />
        )}
      </div>
    </HeadlessErrorBoundary>
  );
};

export default App;


