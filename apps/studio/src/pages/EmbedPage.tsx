/**
 * Embed Page
 * 
 * Lightweight preview page designed for iframe embedding.
 * Supports multiple data passing methods:
 * 1. URL query param: ?id=dashboardId (requires API)
 * 2. URL query param: ?token=jwt (for authenticated access)
 * 3. postMessage: { type: 'LOAD_DASHBOARD', payload: schema }
 * 4. postMessage: { type: 'UPDATE_VARIABLES', payload: { key: value } }
 */

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useSyncExternalStore } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CanvasView, GridStackCanvas } from '@thingsvis/ui';
import { dataSourceManager } from '@thingsvis/kernel';
import type { PageSchemaType } from '@thingsvis/schema';
import { getDashboard } from '@/lib/api/dashboards';
import { store } from '@/lib/store';
import { loadPlugin } from '@/plugins/pluginResolver';
import { platformFieldStore } from '@/lib/stores/platformFieldStore';

interface EmbedState {
  isLoading: boolean;
  error: string | null;
  schema: any | null;
  variables: Record<string, any>;
}

// Message types for postMessage communication
type EmbedMessage =
  | { type: 'LOAD_DASHBOARD'; payload: any }
  | { type: 'UPDATE_VARIABLES'; payload: Record<string, any> }
  | { type: 'SET_TOKEN'; payload: string }
  | { type: 'READY' }
  | { type: 'ERROR'; payload: string }
  | { type: 'LOADED'; payload: { id?: string; name?: string } }
  | { type: 'thingsvis:editor-init'; payload: any }
  | { type: 'thingsvis:editor-event'; payload: any; event?: string };

export default function EmbedPage() {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<EmbedState>({
    isLoading: true,
    error: null,
    schema: null,
    variables: {},
  });
  const parentOrigin = useRef<string>('*');

  // Add declaration for debug globals
  if (typeof window !== 'undefined') {
    (window as any)._lastDsUpdate = 0;
    (window as any)._loggedNodes = false;
  }

  // Observe kernel state
  const kernelState = useSyncExternalStore(store.subscribe, store.getState) as any;

  // Debug: Log platform data source state changes
  // Debug: Log platform data source state changes and schema bindings
  useEffect(() => {
    // Access safely
    const dsState = kernelState.dataSources?.['__platform__'];
    // Log platform data updates (throttled/debounced ideally, but sufficient for now)
    if (dsState?.lastUpdated !== (window as any)._lastDsUpdate) {
      (window as any)._lastDsUpdate = dsState?.lastUpdated;
      // console.log('[EmbedPage] 🔍 Store State (__platform__):', dsState);
    }

    // Log bindings in nodes
    // const nodes = kernelState.nodesById || {};
    // const firstNodeId = Object.keys(nodes)[0];
    // if (firstNodeId && !(window as any)._loggedNodes) {
    //   (window as any)._loggedNodes = true;
    //   console.log('[EmbedPage] 🔍 Node Schema (First Node):', nodes[firstNodeId]);
    //   console.log('[EmbedPage] 🔍 All Nodes:', nodes);
    // }
  }, [kernelState.dataSources]);

  const canvasMode = kernelState?.canvas?.mode ?? 'infinite';
  const canvasWidth = kernelState?.canvas?.width ?? 1920;
  const canvasHeight = kernelState?.canvas?.height ?? 1080;

  const hasGridNodes = useMemo(() => {
    const nodesById = kernelState?.nodesById as Record<string, any> | undefined;
    if (!nodesById) return false;
    return Object.values(nodesById).some((node: any) => Boolean(node?.schemaRef?.grid));
  }, [kernelState]);

  // 只根据 canvasMode 判断是否使用网格布局
  // 不再检查 hasGridNodes，避免模式切换后渲染器不匹配
  const isGridLayout = canvasMode === 'grid';

  // 屏幕自适应模式：从 schema 读取配置
  const fullWidthPreview = state.schema?.canvas?.fullWidthPreview ?? false;

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

  // Auto-calculation of zoom for non-grid layouts (Fixed/Infinite)
  const [fitZoom, setFitZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (kernelState?.canvas?.mode === 'grid') return;

    const updateZoom = () => {
      if (!containerRef.current) return;
      const { clientWidth } = containerRef.current;

      const currentCanvasWidth = kernelState?.canvas?.width ?? 1920;
      const isFullWidth = state.schema?.canvas?.fullWidthPreview ?? false;

      if (isFullWidth) {
        // Fit width
        const scale = clientWidth / currentCanvasWidth;
        setFitZoom(scale);
      } else {
        // Default behavior (no scaling or specific logic)
        setFitZoom(1);
      }
    };

    updateZoom();
    window.addEventListener('resize', updateZoom);
    return () => window.removeEventListener('resize', updateZoom);
  }, [kernelState?.canvas?.mode, state.schema?.canvas?.fullWidthPreview, kernelState?.canvas?.width]);




  // Send message to parent window
  const postToParent = useCallback((message: EmbedMessage) => {
    if (window.parent !== window) {
      window.parent.postMessage(message, parentOrigin.current);
    }
  }, []);

  // Resolve plugin for canvas
  const resolvePlugin = useCallback(async (type: string) => {
    const { entry } = await loadPlugin(type);
    return entry;
  }, []);

  // Load dashboard from API by ID
  const loadFromApi = useCallback(async (id: string, token?: string) => {
    setState(s => ({ ...s, isLoading: true, error: null }));

    try {
      // Set token if provided
      if (token) {
        localStorage.setItem('thingsvis_token', token);
      }

      const response = await getDashboard(id);

      if (response.error || !response.data) {
        throw new Error(response.error || 'Dashboard not found');
      }

      const dashboard = response.data;

      // Update canvas settings
      if (dashboard.canvasConfig) {
        store.getState().updateCanvas({
          mode: (dashboard.canvasConfig.mode as any) || 'infinite',
          width: dashboard.canvasConfig.width || 1920,
          height: dashboard.canvasConfig.height || 1080,
        });
      }

      // Load page into kernel
      const page: PageSchemaType = {
        id: dashboard.id,
        type: 'page',
        version: '1.0.0',
        nodes: (dashboard.nodes as any[]) || [],
      };

      store.getState().loadPage(page);

      setState({
        isLoading: false,
        error: null,
        schema: dashboard,
        variables: {},
      });

      postToParent({ type: 'LOADED', payload: { id: dashboard.id, name: dashboard.name } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard';
      setState(s => ({ ...s, isLoading: false, error: errorMessage }));
      postToParent({ type: 'ERROR', payload: errorMessage });
    }
  }, [postToParent]);

  // Load dashboard from schema data
  const loadFromSchema = useCallback((schema: any) => {
    setState(s => ({ ...s, isLoading: true, error: null }));



    if (!schema || !schema.canvas) {
      console.error('❌ [EmbedPage] Invalid schema:', schema);
      setState(s => ({ ...s, isLoading: false, error: 'Invalid schema provided' }));
      postToParent({ type: 'ERROR', payload: 'Invalid schema provided' });
      return;
    }

    try {
      // Load page into kernel FIRST (this resets canvas to defaults)
      const pageNodes = schema.nodes || [];

      // If in grid mode, ensure all nodes have grid properties
      // This fixes the issue where nodes without grid props stack on top of each other
      if (schema.canvas.mode === 'grid') {
        const GRID_COLS = schema.canvas.gridCols ?? 24;
        let runningY = 0;
        let runningX = 0;
        let maxHeightInRow = 0;

        pageNodes.forEach((node: any, index: number) => {
          if (!node.grid) {
            console.warn(`⚠️ [EmbedPage] Node ${node.id} missing grid props! Generating fallback...`);
            // Calculate a default grid position if missing
            // Default width: 6 columns (1/4 of simplified 24-col grid)
            const w = 6;
            // Default height: 4 rows (~200px)
            const h = 4;

            // Check if we need to wrap to next row
            if (runningX + w > GRID_COLS) {
              runningX = 0;
              runningY += maxHeightInRow || h;
              maxHeightInRow = 0;
            }

            node.grid = {
              x: runningX,
              y: runningY,
              w: w,
              h: h
            };

            // Update placement for next node
            runningX += w;
            maxHeightInRow = Math.max(maxHeightInRow, h);
          } else {

          }
        });
      }



      const page: PageSchemaType = {
        id: schema.id || 'embed-page',
        type: 'page',
        version: '1.0.0',
        nodes: pageNodes,
      };

      store.getState().loadPage(page);

      // Update canvas settings AFTER loadPage (loadPage resets canvas to defaults)
      store.getState().updateCanvas({
        mode: schema.canvas.mode || 'infinite',
        width: schema.canvas.width || 1920,
        height: schema.canvas.height || 1080,
      });

      // Verify the final canvas state
      const finalCanvas = store.getState().canvas;


      // Update grid settings in store if needed
      if (schema.canvas.mode === 'grid' || schema.canvas.gridCols) {
        const gridSettings = {
          cols: schema.canvas.gridCols ?? 24,
          rowHeight: schema.canvas.gridRowHeight ?? 50,
          gap: schema.canvas.gridGap ?? 5,
        };

        store.getState().setGridSettings?.(gridSettings);
      }

      setState({
        isLoading: false,
        error: null,
        schema,
        variables: {},
      });

      postToParent({ type: 'LOADED', payload: { name: schema.name } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load schema';
      setState(s => ({ ...s, isLoading: false, error: errorMessage }));
      postToParent({ type: 'ERROR', payload: errorMessage });
    }
  }, [postToParent]);

  // Update variables
  const updateVariables = useCallback((variables: Record<string, any>) => {
    setState(s => ({
      ...s,
      variables: { ...s.variables, ...variables },
    }));

    // TODO: Dispatch variable update to kernel when variable system is implemented
  }, []);

  // Handle messages from parent window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Debug: Log all incoming messages for troubleshooting
      if (typeof event.data === 'object' && event.data?.type) {
        // console.log('[EmbedPage] 📩 Received message:', event.data.type, event.data);
      }

      // Store the origin of the parent for responses
      if (event.source === window.parent) {
        parentOrigin.current = event.origin;
      }

      const message = event.data as EmbedMessage;

      switch (message.type) {
        case 'LOAD_DASHBOARD':
          // console.log('[EmbedPage] 🚀 Handling LOAD_DASHBOARD', message.payload);
          loadFromSchema(message.payload);
          break;
        case 'UPDATE_VARIABLES':
          updateVariables(message.payload);
          break;
        case 'SET_TOKEN':
          localStorage.setItem('thingsvis_token', message.payload);
          break;

        // 🟢 兼容 Standard Embed Protocol (thingsvis:*)
        case 'thingsvis:editor-init':
          // payload 结构: { data: { ...canvas, ...nodes }, config: { ... } }
          // EmbedPage expect pure schema in message.payload.data
          if (message.payload && message.payload.data) {
            // console.log('[EmbedPage] 收到 thingsvis:editor-init', message.payload.data);
            // 构造符合 loadFromSchema 期望的 schema 对象
            const initData = message.payload.data;

            const schema = {
              id: initData.meta?.id,
              name: initData.meta?.name,
              canvas: initData.canvas,
              nodes: initData.nodes,
              dataSources: initData.dataSources || []
            };

            // 自动注入平台数据源 (如果不存在)
            if (!schema.dataSources?.some((ds: any) => ds.id === '__platform__')) {
              console.log('[EmbedPage] 🔌 自动注入 __platform__ 数据源');
              if (!schema.dataSources) schema.dataSources = [];
              schema.dataSources.push({
                id: '__platform__',
                name: 'System Platform',
                type: 'PLATFORM_FIELD',
                config: {
                  fieldMappings: {}
                }
              });
            }

            // Populate platformFieldStore if fields are provided in init payload
            if (initData.platformFields && Array.isArray(initData.platformFields)) {
              console.log('[EmbedPage] 🔌 Initializing Platform Fields:', initData.platformFields.length);
              platformFieldStore.setFields(initData.platformFields);
            }

            // Register all data sources with manager
            if (schema.dataSources && Array.isArray(schema.dataSources)) {
              schema.dataSources.forEach((ds: any) => {
                console.log('[EmbedPage] 🔌 Registering DataSource:', ds.id, ds.type);
                dataSourceManager.registerDataSource(ds).catch(err => {
                  console.error('[EmbedPage] Failed to register data source:', ds.id, err);
                });
              });
            }

            loadFromSchema(schema);
          }
          break;

        case 'thingsvis:editor-event':
          // payload 结构: { event: 'updateData', payload: { ... } }
          const eventData = message.payload;
          if (eventData && (eventData.event === 'updateData' || message.event === 'updateData')) {
            const data = eventData.payload || eventData.data;
            // console.log('[EmbedPage] 收到 updateData', data);

            // 1. Update variables (legacy)
            updateVariables(data);

            // 2. Bridge to PlatformFieldAdapter (for ds.__platform__)
            if (data && typeof data === 'object') {
              Object.entries(data).forEach(([fieldId, value]) => {
                // console.log('[EmbedPage] 📤 Dispatching platformData:', fieldId, value);
                window.postMessage({
                  type: 'thingsvis:platformData',
                  payload: { fieldId, value, timestamp: Date.now() }
                }, '*');
              });
            }
          } else if (eventData && eventData.event === 'updateSchema') {
            // Handle schema/fields update
            const fields = eventData.payload;
            console.log('[EmbedPage]  received updateSchema:', fields);
            if (Array.isArray(fields)) {
              platformFieldStore.setFields(fields);
            }
          }
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [loadFromSchema, updateVariables]);

  // Initial load from URL params
  useEffect(() => {
    const dashboardId = searchParams.get('id');
    const token = searchParams.get('token');

    if (dashboardId) {
      loadFromApi(dashboardId, token || undefined);
    } else {
      // No ID provided - waiting for postMessage
      setState(s => ({ ...s, isLoading: false }));
      postToParent({ type: 'READY' });
    }
  }, [searchParams, loadFromApi, postToParent]);

  // Render
  if (state.isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background" style={{ minHeight: '100%' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">加载仪表板中...</p>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background" style={{ minHeight: '100%' }}>
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">加载失败</h2>
          <p className="text-muted-foreground text-sm">{state.error}</p>
        </div>
      </div>
    );
  }

  if (!state.schema) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background" style={{ minHeight: '100%' }}>
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">已就绪</h2>
          <p className="text-muted-foreground text-sm">
            使用 postMessage 发送仪表板数据，或在 URL 中提供 ?id= 参数。
          </p>
        </div>
      </div>
    );
  }




  // Auto-calculation of zoom for non-grid layouts (Fixed/Infinite)
  return (
    <div className="relative bg-background overflow-auto" style={{ width: '100vw', height: '100vh' }}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          overflow: isGridLayout ? 'auto' : 'hidden' // Hide scrollbars for fixed layout doing auto-fit
        }}
      >
        {isGridLayout ? (
          <GridStackCanvas
            store={store as any}
            resolvePlugin={resolvePlugin as any}
            width={fullWidthPreview ? undefined : canvasWidth}
            height={canvasHeight}
            settings={gridSettings}
            interactive={false}
            fullWidth={fullWidthPreview}
          />
        ) : (
          <CanvasView
            store={store as any}
            resolvePlugin={resolvePlugin as any}
            gridSize={0}
            snapToGrid={false}
            centeredMask={true} // Center the content
            interactive={false} // Disable panning/zooming user interaction
            zoom={fitZoom}
          />
        )}
      </div>
    </div>
  );
}
