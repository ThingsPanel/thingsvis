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
import type { PageSchemaType } from '@thingsvis/schema';
import { getDashboard } from '@/lib/api/dashboards';
import { store } from '@/lib/store';
import { loadPlugin } from '@/plugins/pluginResolver';

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
  | { type: 'LOADED'; payload: { id?: string; name?: string } };

export default function EmbedPage() {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<EmbedState>({
    isLoading: true,
    error: null,
    schema: null,
    variables: {},
  });
  const parentOrigin = useRef<string>('*');

  // Observe kernel state
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
    
    try {
      // Update canvas settings
      if (schema.canvas) {
        store.getState().updateCanvas({
          mode: schema.canvas.mode || 'infinite',
          width: schema.canvas.width || 1920,
          height: schema.canvas.height || 1080,
        });
        
        if (schema.canvas.gridCols) {
          store.getState().setGridSettings?.({
            cols: schema.canvas.gridCols,
            rowHeight: schema.canvas.gridRowHeight ?? 50,
            gap: schema.canvas.gridGap ?? 5,
          });
        }
      }
      
      // Load page into kernel
      const page: PageSchemaType = {
        id: schema.id || 'embed-page',
        type: 'page',
        version: '1.0.0',
        nodes: schema.nodes || [],
      };
      
      store.getState().loadPage(page);
      
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
      // Store the origin of the parent for responses
      if (event.source === window.parent) {
        parentOrigin.current = event.origin;
      }

      const message = event.data as EmbedMessage;
      
      switch (message.type) {
        case 'LOAD_DASHBOARD':
          loadFromSchema(message.payload);
          break;
        case 'UPDATE_VARIABLES':
          updateVariables(message.payload);
          break;
        case 'SET_TOKEN':
          localStorage.setItem('thingsvis_token', message.payload);
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
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">加载仪表板中...</p>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
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
      <div className="w-full h-screen flex items-center justify-center bg-background">
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

  // Render the canvas
  return (
    <div className="w-full h-screen overflow-hidden bg-background">
      {isGridLayout ? (
        <GridStackCanvas 
          store={store as any}
          resolvePlugin={resolvePlugin as any}
          width={canvasWidth}
          height={canvasHeight}
          settings={gridSettings}
          interactive={false}
        />
      ) : (
        <CanvasView 
          store={store as any}
          resolvePlugin={resolvePlugin as any}
          gridSize={0}
          snapToGrid={false}
          centeredMask={false}
        />
      )}
    </div>
  );
}
