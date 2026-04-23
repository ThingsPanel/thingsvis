import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { useSyncExternalStore } from 'react';
import { CanvasView as UI_CanvasView, GridCanvas, useGridLayout } from '@thingsvis/ui';
import { action as kernelAction, type KernelState } from '@thingsvis/kernel';
import { validateCanvasTheme, type NodeSchemaType } from '@thingsvis/schema';
import type { DataSource, PlatformFieldConfig } from '@thingsvis/schema';
import { augmentPlatformDataSourcesForNodes } from '../lib/platformDatasourceBindings';
import { actionRuntime, dataSourceManager } from '../lib/store';
import TransformControls from './tools/TransformControls';
import CreateToolLayer from './tools/CreateToolLayer';
import LineConnectionTool from './tools/LineConnectionTool';
import PipeConnectionTool from './tools/PipeConnectionTool';
import { isCreationTool } from './tools/types';
import { orderNodeStatesByLayerOrder } from '../lib/layerOrder';
import { resolveInitialWidgetProps } from '../lib/registry/resolveInitialWidgetProps';
import {
  isPlatformFieldDataSource,
  normalizePlatformBufferSize,
} from '../embed/platformDeviceCompat';
import { PipeProxyHits, buildPipeProxySegmentsForNode } from './CanvasView.pipeProxy';

function generateId(prefix = 'node') {
  try {
    // @ts-ignore
    if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
      // @ts-ignore
      return (crypto as any).randomUUID();
    }
  } catch {}
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function cloneDropPayload<T>(payload: T): T {
  if (payload == null) return payload;
  return JSON.parse(JSON.stringify(payload)) as T;
}

function isNodeSnippetPayload(payload: unknown): payload is NodeSchemaType {
  return Boolean(
    payload &&
    typeof payload === 'object' &&
    !Array.isArray(payload) &&
    typeof (payload as { type?: unknown }).type === 'string',
  );
}

type PresetSchemaPayload = {
  kind: 'thingsvis-preset-schema';
  presetId?: string;
  name?: string;
  schema?: {
    canvas?: Record<string, unknown>;
    nodes?: NodeSchemaType[];
    dataSources?: DataSource[];
  };
};

function isPresetSchemaPayload(payload: unknown): payload is PresetSchemaPayload {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
  const value = payload as PresetSchemaPayload;
  return value.kind === 'thingsvis-preset-schema' && Array.isArray(value.schema?.nodes);
}

function getNodeProps(
  node: { schemaRef?: NodeSchemaType } | null | undefined,
): Record<string, unknown> {
  return node?.schemaRef?.props ?? {};
}

function isTextNode(node: { schemaRef?: NodeSchemaType } | null | undefined): boolean {
  return node?.schemaRef?.type === 'basic/text';
}

function isConnectorNodeType(type: string | undefined): boolean {
  return type === 'basic/line' || type === 'industrial/pipe';
}

function buildDroppedPresetNodes(
  sourceNodes: NodeSchemaType[],
  dropPoint: { x: number; y: number },
): NodeSchemaType[] {
  const clonedNodes = cloneDropPayload(sourceNodes);
  const xValues = clonedNodes
    .map((node) => node.position?.x)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  const yValues = clonedNodes
    .map((node) => node.position?.y)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

  const minX = xValues.length > 0 ? Math.min(...xValues) : 0;
  const minY = yValues.length > 0 ? Math.min(...yValues) : 0;

  const idMap = new Map<string, string>();
  clonedNodes.forEach((node) => {
    idMap.set(node.id, generateId('node'));
  });

  return clonedNodes.map((node) => {
    const nextNode = cloneDropPayload(node);
    const nextId = idMap.get(node.id) || generateId('node');
    nextNode.id = nextId;

    if (typeof node.position?.x === 'number' && typeof node.position?.y === 'number') {
      nextNode.position = {
        x: dropPoint.x + (node.position.x - minX),
        y: dropPoint.y + (node.position.y - minY),
      };
    } else {
      nextNode.position = { x: dropPoint.x, y: dropPoint.y };
    }

    if (node.parentId && idMap.has(node.parentId)) {
      nextNode.parentId = idMap.get(node.parentId);
    }

    return nextNode;
  });
}

function mergePresetDataSources(
  currentConfigs: DataSource[],
  presetDataSources: DataSource[],
): DataSource[] {
  const merged = new Map<string, DataSource>(currentConfigs.map((config) => [config.id, config]));

  presetDataSources.forEach((incomingConfig) => {
    if (!incomingConfig?.id) return;

    const existingConfig = merged.get(incomingConfig.id);
    if (!existingConfig) {
      merged.set(incomingConfig.id, incomingConfig);
      return;
    }

    const existingIsPlatform = isPlatformFieldDataSource(existingConfig);
    const incomingIsPlatform = isPlatformFieldDataSource(incomingConfig);

    if (existingIsPlatform || incomingIsPlatform) {
      const existingPlatformConfig = (existingConfig.config ?? {}) as PlatformFieldConfig;
      const incomingPlatformConfig = (incomingConfig.config ?? {}) as PlatformFieldConfig;
      merged.set(incomingConfig.id, {
        ...existingConfig,
        ...incomingConfig,
        type: 'PLATFORM_FIELD',
        config: {
          ...existingPlatformConfig,
          ...incomingPlatformConfig,
          bufferSize: Math.max(
            normalizePlatformBufferSize(existingPlatformConfig.bufferSize),
            normalizePlatformBufferSize(incomingPlatformConfig.bufferSize),
          ),
          requestedFields: Array.from(
            new Set([
              ...((existingPlatformConfig.requestedFields ?? []).filter(
                (fieldId): fieldId is string => typeof fieldId === 'string',
              ) || []),
              ...((incomingPlatformConfig.requestedFields ?? []).filter(
                (fieldId): fieldId is string => typeof fieldId === 'string',
              ) || []),
            ]),
          ),
        },
      });
      return;
    }

    merged.set(incomingConfig.id, {
      ...existingConfig,
      ...incomingConfig,
      config: {
        ...(existingConfig.config ?? {}),
        ...(incomingConfig.config ?? {}),
      },
    } as DataSource);
  });

  return Array.from(merged.values());
}

export type StudioCanvasHandle = {
  dispatchToKernel: (payload: unknown) => void;
  mount: () => void;
  unmount: () => void;
};

const CanvasView = forwardRef<
  StudioCanvasHandle,
  {
    pageId: string;
    store: any;
    locale?: string;
    resolveWidget?: (t: string) => Promise<any>;
    activeTool: string;
    lineToolProps?: Record<string, unknown>;
    lineContinuous?: boolean;
    zoom?: number;
    onZoomChange?: (zoom: number) => void;
    onUserEdit?: () => void;
    onResetTool?: () => void;
    pendingImageUrl?: string;
    onImagePickerRequest?: () => void;
    onImagePickerComplete?: () => void;
    theme?: string;
    centerPadding?: { left?: number; right?: number };
    formatBrushActive?: boolean;
    onApplyFormatBrush?: (targetNodeId: string) => boolean;
  }
>(function CanvasView(
  {
    pageId,
    store,
    locale,
    activeTool,
    resolveWidget,
    lineToolProps,
    lineContinuous = true,
    zoom = 1,
    onZoomChange,
    onUserEdit,
    onResetTool,
    pendingImageUrl,
    onImagePickerRequest,
    onImagePickerComplete,
    theme,
    centerPadding,
    formatBrushActive = false,
    onApplyFormatBrush,
  },
  ref,
) {
  const mountedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inlineTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  // Use state for viewport so changes trigger re-render
  const [vp, setVp] = useState({ width: 0, height: 0, zoom: zoom, offsetX: 0, offsetY: 0 });
  const vpRef = useRef(vp);
  vpRef.current = vp; // Keep ref in sync for callbacks
  const [inlineTextEditor, setInlineTextEditor] = useState<{
    nodeId: string;
    draft: string;
  } | null>(null);
  const inlineTextEditorRef = useRef<{
    nodeId: string;
    draft: string;
  } | null>(null);

  // Sync state when zoom prop changes
  useEffect(() => {
    setVp((prev) => ({
      ...prev,
      zoom: zoom,
    }));
  }, [zoom]);
  useEffect(() => {
    inlineTextEditorRef.current = inlineTextEditor;
  }, [inlineTextEditor]);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const proxyWrapperRef = useRef<HTMLDivElement | null>(null);
  const proxyLayerRef = useRef<HTMLDivElement | null>(null);

  const getViewport = useCallback(() => vpRef.current, []);

  const state = useSyncExternalStore(
    useCallback((subscribe) => store.subscribe(subscribe), [store]),
    () => store.getState() as KernelState,
  );

  const closeInlineTextEditor = useCallback(
    (options?: { commit?: boolean }) => {
      const active = inlineTextEditorRef.current;
      if (!active) return;

      if (options?.commit !== false) {
        const currentNode = (store.getState() as KernelState).nodesById[active.nodeId];
        const currentProps = getNodeProps(currentNode);
        if ((currentProps.text ?? '') !== active.draft) {
          store.getState().updateNode?.(active.nodeId, {
            props: {
              ...currentProps,
              text: active.draft,
            },
          });
          onUserEdit?.();
        }
      }

      inlineTextEditorRef.current = null;
      setInlineTextEditor(null);
    },
    [onUserEdit, store],
  );

  const openInlineTextEditor = useCallback(
    (nodeId: string) => {
      const currentNode = (store.getState() as KernelState).nodesById[nodeId];
      if (!isTextNode(currentNode)) return;

      const currentProps = getNodeProps(currentNode);
      const nextDraft =
        typeof currentProps.text === 'string' ? currentProps.text : String(currentProps.text ?? '');

      if (inlineTextEditorRef.current?.nodeId === nodeId) return;

      closeInlineTextEditor({ commit: true });
      store.getState().selectNode?.(nodeId);
      setInlineTextEditor({ nodeId, draft: nextDraft });
    },
    [closeInlineTextEditor, store],
  );

  const handleProxyMouseDownCapture = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (formatBrushActive) return;
      if (event.button !== 0 || event.detail < 2) return;

      const target = event.target as HTMLElement | null;
      if (!target || target.closest('textarea')) return;

      const nodeTarget = target.closest('[data-node-id]') as HTMLElement | null;
      const nodeId = nodeTarget?.dataset.nodeId;
      if (!nodeId) return;

      const currentNode = state.nodesById[nodeId];
      if (!isTextNode(currentNode)) return;

      event.preventDefault();
      event.stopPropagation();
      openInlineTextEditor(nodeId);
    },
    [formatBrushActive, openInlineTextEditor, state.nodesById],
  );

  const handleFormatBrushMouseDownCapture = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!formatBrushActive) return;

      const target = event.target as HTMLElement | null;
      const nodeTarget = target?.closest('[data-node-id]') as HTMLElement | null;
      const nodeId = nodeTarget?.dataset.nodeId;
      if (!nodeId) return;

      const applied = onApplyFormatBrush?.(nodeId);
      if (!applied) return;

      event.preventDefault();
      event.stopPropagation();
    },
    [formatBrushActive, onApplyFormatBrush],
  );

  const hydratePlatformDataSourcesForNodes = useCallback(
    async (nodes: NodeSchemaType[], presetDataSources: DataSource[] = []) => {
      const currentConfigs = dataSourceManager.getAllConfigs();
      const mergedConfigs = mergePresetDataSources(currentConfigs, presetDataSources);
      const nextConfigs = augmentPlatformDataSourcesForNodes(
        mergedConfigs,
        nodes as Array<Record<string, unknown>>,
      );

      for (const nextConfig of nextConfigs) {
        const prevConfig = currentConfigs.find((config) => config.id === nextConfig.id);
        if (prevConfig && JSON.stringify(prevConfig) === JSON.stringify(nextConfig)) {
          continue;
        }

        await dataSourceManager.registerDataSource(nextConfig, false);
      }
    },
    [],
  );

  // Detect grid layout mode
  const isGridMode = state.canvas?.mode === 'grid';
  const showGridLines = state.gridState?.settings?.showGridLines ?? true;

  // Grid layout hook (provides grid-aware drag/resize handlers)
  const gridLayout = useGridLayout({
    store,
    containerWidth: containerRef.current?.clientWidth ?? 0,
    settings: state.gridState?.settings ?? null,
    isGridMode,
  });

  useImperativeHandle(ref, () => ({
    dispatchToKernel: (payload: unknown) => {
      // Bridge for the studio app to send commands/events to the kernel.
      // Implementation will call the kernel IPC or store action in future tasks.
      // eslint-disable-next-line no-console
    },
    mount: () => {
      mountedRef.current = true;
    },
    unmount: () => {
      mountedRef.current = false;
    },
  }));

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Click on empty canvas to clear selection
  function handleCanvasClick(e: React.MouseEvent) {
    // Ctrl/Meta click is used for multi-select toggling; don't clear selection.
    if (e.ctrlKey || e.metaKey) return;
    // Only clear selection if clicking directly on the canvas container, not on a node
    const target = e.target as HTMLElement;
    // Check if clicked on a node proxy target
    if (target.closest('.node-proxy-target')) {
      return;
    }
    // Don't clear selection if this is from Selecto (proxy-layer or its children)
    // Selecto handles selection itself via selectEnd event
    if (target.closest('.proxy-layer')) {
      return;
    }
    // Clear selection
    if (store.getState().selectNode) {
      store.getState().selectNode(null);
    }
  }

  // Drop handlers for studio: compute coords and dispatch node add via store
  function handleDragOver(e: React.DragEvent) {
    if (isPanTool) return;
    e.preventDefault();
  }

  async function handleDrop(e: React.DragEvent) {
    if (isPanTool) return;
    e.preventDefault();
    const snippetPayload = e.dataTransfer.getData('application/thingsvis-widget-snippet');
    const widgetPayload = e.dataTransfer.getData('application/thingsvis-widget');
    const payload = snippetPayload || widgetPayload || e.dataTransfer.getData('text/plain');
    const isSnippetDrop = Boolean(snippetPayload);
    const isLibraryWidgetDrop = Boolean(widgetPayload) && !isSnippetDrop;
    let entry: any = null;
    try {
      entry = payload ? JSON.parse(payload) : null;
    } catch {
      entry = null;
    }

    // In grid mode, widget-library drops are handled exclusively by GridCanvas.
    // Letting the outer canvas also consume the same payload creates a duplicate
    // node whose fallback grid position lands at the top-left corner.
    if (isGridMode && isLibraryWidgetDrop) {
      return;
    }

    const rect = (containerRef.current as HTMLDivElement).getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;

    // Correctly use current viewport state for coordinate conversion
    const vpState =
      vpRef.current && vpRef.current.width > 0
        ? vpRef.current
        : { width: rect.width, height: rect.height, zoom: 1, offsetX: 0, offsetY: 0 };

    let worldX = (localX - vpState.offsetX) / vpState.zoom;
    let worldY = (localY - vpState.offsetY) / vpState.zoom;

    const isGridEnabled = (state.canvas as any)?.gridEnabled ?? false;
    const gridSize = (state.canvas as any)?.gridSize ?? 20;

    if (isGridEnabled) {
      worldX = Math.round(worldX / gridSize) * gridSize;
      worldY = Math.round(worldY / gridSize) * gridSize;
    }

    if (
      isPresetSchemaPayload(entry) &&
      Array.isArray(entry.schema?.nodes) &&
      entry.schema.nodes.length > 0
    ) {
      const droppedNodes = buildDroppedPresetNodes(entry.schema.nodes, { x: worldX, y: worldY });
      try {
        if (store.getState().addNodes) {
          store.getState().addNodes(droppedNodes as any);
        } else {
          droppedNodes.forEach((node) => kernelAction.addNode(pageId, node as any));
        }

        await hydratePlatformDataSourcesForNodes(
          droppedNodes,
          Array.isArray(entry.schema?.dataSources) ? entry.schema.dataSources : [],
        );
        onUserEdit?.();
      } catch (error) {
        console.error('[CanvasView] Failed to drop preset schema', error);
      }
      return;
    }

    // Only create node if we have valid plugin data from component library
    // This prevents creating text nodes when user drags existing nodes or images
    if (!entry || !entry.type) {
      return;
    }

    // Fetch the remote/local widget bundle to get exact default properties.
    let widgetModule: any = null;
    if (resolveWidget && entry.type) {
      try {
        widgetModule = await resolveWidget(entry.type);
      } catch (err) {
        // Fallback down below if module could not be lazy-loaded
      }
    }

    const nodeId = generateId('node');
    const moduleDefs = widgetModule?.entry || widgetModule; // handle both {entry: Main} and direct Main returns
    const snippetEntry =
      isSnippetDrop && isNodeSnippetPayload(entry) ? cloneDropPayload(entry) : null;
    // 对于 resizable: false 的组件，不设置 size（由内容撑开）
    const isResizable = moduleDefs?.resizable !== false && (entry as any)?.resizable !== false;
    const pluginDefaultSize =
      snippetEntry?.size || moduleDefs?.defaultSize || (entry as any)?.defaultSize;
    const constraints = moduleDefs?.constraints || (entry as any)?.constraints;

    // Build initial size from widget metadata, clamped by constraints
    let initialSize: { width: number; height: number } | undefined;
    if (isResizable) {
      const FALLBACK_WIDTH = 200;
      const FALLBACK_HEIGHT = 100;
      const raw = pluginDefaultSize || { width: FALLBACK_WIDTH, height: FALLBACK_HEIGHT };

      if (!pluginDefaultSize) {
        console.warn(
          `[CanvasView] Widget "${entry.type}" has no defaultSize — using fallback ${FALLBACK_WIDTH}x${FALLBACK_HEIGHT}`,
        );
      }

      const size = { ...raw };
      if (constraints) {
        const cs = constraints as Record<string, number | undefined>;
        if (cs.minWidth != null) size.width = Math.max(size.width, cs.minWidth!);
        if (cs.maxWidth != null) size.width = Math.min(size.width, cs.maxWidth!);
        if (cs.minHeight != null) size.height = Math.max(size.height, cs.minHeight!);
        if (cs.maxHeight != null) size.height = Math.min(size.height, cs.maxHeight!);
        if (cs.aspectRatio != null) {
          // Enforce aspect ratio by adjusting height based on width
          size.height = Math.round(size.width / cs.aspectRatio!);
        }
      }
      initialSize = size;
    }

    const node: any = {
      id: nodeId,
      type: entry.type,
      position: { x: worldX, y: worldY },
      // 只有可调整尺寸的组件才设置 size
      ...(initialSize ? { size: initialSize } : {}),
      props: {
        ...resolveInitialWidgetProps({
          schema: moduleDefs?.schema,
          standaloneDefaults: moduleDefs?.standaloneDefaults,
          previewDefaults: moduleDefs?.previewDefaults,
          sampleData: moduleDefs?.sampleData,
          fallbackDefaults: entry?.defaultProps,
        }),
        ...(snippetEntry?.props && typeof snippetEntry.props === 'object'
          ? snippetEntry.props
          : {}),
      },
    };

    if (snippetEntry) {
      if (snippetEntry.name) node.name = snippetEntry.name;
      if (snippetEntry.style) node.style = snippetEntry.style;
      if (snippetEntry.baseStyle) node.baseStyle = snippetEntry.baseStyle;
      if (typeof snippetEntry.rotation === 'number') node.rotation = snippetEntry.rotation;
      if (Array.isArray(snippetEntry.data)) node.data = snippetEntry.data;
      if (Array.isArray(snippetEntry.events)) node.events = snippetEntry.events;
      if (snippetEntry.widgetVersion) node.widgetVersion = snippetEntry.widgetVersion;
    }

    // Add grid position for grid mode - calculate from widget defaultSize
    if (isGridMode) {
      const gridSettings = state.gridState?.settings;
      const cols = gridSettings?.cols ?? 24;
      const gap = gridSettings?.gap ?? 10;
      const rowHeight = gridSettings?.rowHeight ?? 40;

      // Calculate grid dimensions from initialSize and container width
      // Formula: cols = (width + gap) / (containerWidth + gap) * cols
      const containerWidth = containerRef.current?.clientWidth ?? 1200;
      if (initialSize && containerWidth > 0) {
        const cellWidth = (containerWidth - (cols - 1) * gap) / cols;
        const gridW = Math.max(2, Math.round((initialSize.width + gap) / (cellWidth + gap)));
        const gridH = Math.max(2, Math.round((initialSize.height + gap) / (rowHeight + gap)));

        node.grid = {
          x: 0,
          y: 0, // Will be calculated by grid compaction
          w: Math.min(gridW, cols),
          h: gridH,
          static: false,
          isDraggable: true,
          isResizable: true,
        };
      } else {
        // Fallback for non-resizable widgets
        node.grid = {
          x: 0,
          y: 0,
          w: 4,
          h: 2,
          static: false,
          isDraggable: true,
          isResizable: false,
        };
      }
    }

    try {
      if (store.getState().addNodes) {
        store.getState().addNodes([node as any]);
      } else {
        kernelAction.addNode(pageId, node as any);
      }

      await hydratePlatformDataSourcesForNodes([node]);
      // Ensure autosave is scheduled even if this mutation doesn't hit temporal.
      onUserEdit?.();
    } catch {
      // eslint-disable-next-line no-console
    }
  }

  const nodes = useMemo(
    () => orderNodeStatesByLayerOrder(state.nodesById, state.layerOrder),
    [state.nodesById, state.layerOrder],
  );
  const inlineEditorNode = inlineTextEditor ? state.nodesById[inlineTextEditor.nodeId] : undefined;
  // vp is now from useState, no need to read from ref
  const isPanTool = activeTool === 'pan';
  const canvasCursor = isPanTool ? (isPointerDown ? 'grabbing' : 'grab') : 'default';

  useEffect(() => {
    const active = inlineTextEditor;
    if (!active) return;

    const currentNode = state.nodesById[active.nodeId];
    if (!isTextNode(currentNode)) {
      closeInlineTextEditor({ commit: false });
    }
  }, [closeInlineTextEditor, inlineTextEditor, state.nodesById]);

  useEffect(() => {
    if (!inlineTextEditor?.nodeId) return;
    requestAnimationFrame(() => {
      inlineTextareaRef.current?.focus();
      inlineTextareaRef.current?.select();
    });
  }, [inlineTextEditor?.nodeId]);

  // Normalize theme via registry (fallback to state if undefined)
  const fallbackTheme = (state.page as any)?.config?.theme;
  const normalizedTheme = validateCanvasTheme(theme || fallbackTheme);

  // Grid drop handler: resolve widget metadata then create node at the target grid position.
  // This replaces the outer handleDrop path for grid mode — GridCanvas fires this callback
  // after mapping screen coords to grid coords.
  const handleGridDropComponent = useCallback(
    async (componentType: string, gridPos: { x: number; y: number; w: number; h: number }) => {
      let widgetModule: any = null;
      if (resolveWidget && componentType) {
        try {
          widgetModule = await resolveWidget(componentType);
        } catch {
          console.error('[CanvasView] Failed to resolve widget for grid drop', componentType);
        }
      }

      const nodeId = generateId('node');
      const moduleDefs = widgetModule?.entry || widgetModule;
      const isResizable = moduleDefs?.resizable !== false;
      const pluginDefaultSize = moduleDefs?.defaultSize;
      const constraints = moduleDefs?.constraints;

      let initialSize: { width: number; height: number } | undefined;
      if (isResizable) {
        const FALLBACK_WIDTH = 200;
        const FALLBACK_HEIGHT = 100;
        const raw = pluginDefaultSize || { width: FALLBACK_WIDTH, height: FALLBACK_HEIGHT };
        const size = { ...raw };
        if (constraints) {
          const cs = constraints as Record<string, number | undefined>;
          if (cs.minWidth != null) size.width = Math.max(size.width, cs.minWidth);
          if (cs.maxWidth != null) size.width = Math.min(size.width, cs.maxWidth);
          if (cs.minHeight != null) size.height = Math.max(size.height, cs.minHeight);
          if (cs.maxHeight != null) size.height = Math.min(size.height, cs.maxHeight);
        }
        initialSize = size;
      }

      // Calculate grid dimensions from widget defaultSize
      let gridW = gridPos.w;
      let gridH = gridPos.h;
      if (initialSize && containerRef.current) {
        const gridSettings = state.gridState?.settings;
        const cols = gridSettings?.cols ?? 24;
        const gap = gridSettings?.gap ?? 10;
        const rowHeight = gridSettings?.rowHeight ?? 40;
        const containerWidth = containerRef.current.clientWidth || 1200;

        const cellWidth = (containerWidth - (cols - 1) * gap) / cols;
        gridW = Math.max(2, Math.round((initialSize.width + gap) / (cellWidth + gap)));
        gridH = Math.max(2, Math.round((initialSize.height + gap) / (rowHeight + gap)));
        gridW = Math.min(gridW, cols);
      }

      const node: any = {
        id: nodeId,
        type: componentType,
        position: { x: 0, y: 0 },
        ...(initialSize ? { size: initialSize } : {}),
        props: resolveInitialWidgetProps({
          schema: moduleDefs?.schema,
          standaloneDefaults: moduleDefs?.standaloneDefaults,
          previewDefaults: moduleDefs?.previewDefaults,
          sampleData: moduleDefs?.sampleData,
          fallbackDefaults: moduleDefs?.defaultProps,
        }),
        grid: {
          x: gridPos.x,
          y: gridPos.y,
          w: gridW,
          h: gridH,
          static: false,
          isDraggable: true,
          isResizable: isResizable,
        },
      };

      try {
        if (store.getState().addNodes) {
          store.getState().addNodes([node as any]);
        }
        onUserEdit?.();
      } catch (e) {
        console.error('[CanvasView] Failed to add grid node', nodeId, e);
      }
    },
    [resolveWidget, state.gridState?.settings, store, onUserEdit],
  );

  // ── Grid mode: GridCanvas is the sole renderer (same engine for edit and preview) ──
  // This eliminates the VisualEngine dual-render conflict and the schema.position/schema.grid
  // coordinate mismatch that caused components to overlap or change size unexpectedly.
  if (isGridMode) {
    return (
      <div
        ref={containerRef as any}
        className={`theme-${normalizedTheme}`}
        data-testid="studio-canvas"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onMouseDownCapture={handleFormatBrushMouseDownCapture}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          cursor: formatBrushActive ? 'copy' : 'default',
        }}
      >
        <GridCanvas
          store={store}
          resolveWidget={resolveWidget}
          locale={locale}
          width={state.canvas.width}
          height={state.canvas.height}
          interactive={activeTool !== 'pan'}
          zoom={zoom}
          onZoomChange={onZoomChange}
          theme={theme}
          centerPadding={centerPadding}
          widgetMode="edit"
          actionRuntime={actionRuntime}
          showGridLines={showGridLines}
          onDropComponent={handleGridDropComponent}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef as any}
      className={`theme-${normalizedTheme}`}
      data-testid="studio-canvas"
      onClick={handleCanvasClick}
      onMouseDown={() => {
        if (isPanTool) setIsPointerDown(true);
      }}
      onMouseUp={() => {
        if (isPanTool) setIsPointerDown(false);
      }}
      onMouseLeave={() => {
        if (isPanTool) setIsPointerDown(false);
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseDownCapture={handleFormatBrushMouseDownCapture}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        cursor: formatBrushActive ? 'copy' : canvasCursor,
      }}
    >
      <UI_CanvasView
        store={store}
        resolveWidget={resolveWidget}
        locale={locale}
        mode={state.canvas.mode}
        width={state.canvas.width}
        height={state.canvas.height}
        gridSize={20}
        snapToGrid={true}
        showGridLines={showGridLines}
        centeredMask={true}
        actionRuntime={actionRuntime}
        panEnabled={activeTool === 'pan'}
        zoomEnabled={activeTool === 'pan'}
        interactive={activeTool !== 'pan'}
        zoom={zoom}
        centerPadding={centerPadding}
        onViewportChange={(newVp) => {
          // Only update state if values actually changed to avoid infinite loop
          const prev = vpRef.current;
          if (
            prev.zoom !== newVp.zoom ||
            prev.offsetX !== newVp.offsetX ||
            prev.offsetY !== newVp.offsetY ||
            prev.width !== newVp.width ||
            prev.height !== newVp.height
          ) {
            vpRef.current = newVp;
            setVp(newVp);
          }
          if (newVp.zoom !== zoom) {
            onZoomChange?.(newVp.zoom);
          }
        }}
      />

      {/* Proxy Layer for Moveable targets */}
      <div
        ref={proxyLayerRef}
        className="proxy-layer"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 20,
          pointerEvents: isPanTool ? 'none' : 'auto',
          overflow: 'hidden',
        }}
      >
        <div
          ref={proxyWrapperRef}
          className="proxy-wrapper"
          onMouseDownCapture={handleProxyMouseDownCapture}
          style={{
            position: 'absolute',
            left: vp.offsetX,
            top: vp.offsetY,
            transform: `scale(${vp.zoom})`,
            transformOrigin: '0 0',
            pointerEvents: 'auto', // Enable pointer events for Moveable handles
          }}
        >
          {nodes.map((node) => {
            const schema = node.schemaRef as any;
            if (!node.visible) return null;
            const position = schema.position ?? {};
            const size = schema.size ?? {};
            const posX = typeof position.x === 'number' ? position.x : 0;
            const posY = typeof position.y === 'number' ? position.y : 0;
            const width = typeof size.width === 'number' ? size.width : 0;
            const height = typeof size.height === 'number' ? size.height : 0;
            // Read rotation from props._rotation (fallback to schema.rotation for compatibility)
            const rotation = schema.props?._rotation ?? schema.rotation ?? 0;
            const isLine = isConnectorNodeType(schema.type);
            const isPipe = schema.type === 'industrial/pipe';
            const isSelected = state.selection.nodeIds.includes(node.id);
            const pipeProxySegments =
              isPipe && width > 0 && height > 0
                ? buildPipeProxySegmentsForNode(
                    schema,
                    state.nodesById,
                    getViewport,
                    containerRef.current,
                  )
                : [];
            // Line components use LineConnectionTool for selection UI, don't show border
            const showBorder = isSelected && !isLine && inlineTextEditor?.nodeId !== node.id;
            return (
              <div
                key={node.id}
                data-node-id={node.id}
                className="node-proxy-target"
                style={{
                  position: 'absolute',
                  left: posX,
                  top: posY,
                  width,
                  height,
                  transform: rotation !== 0 ? `rotate(${rotation}deg)` : undefined,
                  transformOrigin: 'center center',
                  pointerEvents: isPanTool ? 'none' : isPipe ? 'none' : 'auto',
                  cursor: formatBrushActive
                    ? 'copy'
                    : isPanTool
                      ? canvasCursor
                      : isPipe
                        ? 'default'
                        : 'pointer',
                  border: showBorder ? '1px solid #0066ff' : 'none',
                  overflow: 'visible',
                }}
              >
                {isPipe ? (
                  <PipeProxyHits
                    nodeId={node.id}
                    segments={pipeProxySegments}
                    isPanTool={isPanTool}
                    formatBrushActive={formatBrushActive}
                    canvasCursor={canvasCursor}
                  />
                ) : null}
              </div>
            );
          })}

          {inlineTextEditor && inlineEditorNode ? (
            <div
              style={{
                position: 'absolute',
                left: inlineEditorNode.schemaRef.position?.x ?? 0,
                top: inlineEditorNode.schemaRef.position?.y ?? 0,
                width: inlineEditorNode.schemaRef.size?.width ?? 0,
                height: inlineEditorNode.schemaRef.size?.height ?? 0,
                transform:
                  ((inlineEditorNode.schemaRef as any)?.props?._rotation ??
                    (inlineEditorNode.schemaRef as any)?.rotation ??
                    0) !== 0
                    ? `rotate(${(inlineEditorNode.schemaRef as any)?.props?._rotation ?? (inlineEditorNode.schemaRef as any)?.rotation ?? 0}deg)`
                    : undefined,
                transformOrigin: 'center center',
                zIndex: 30,
                pointerEvents: 'auto',
              }}
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
            >
              <textarea
                ref={inlineTextareaRef}
                value={inlineTextEditor.draft}
                onChange={(event) =>
                  setInlineTextEditor((current) =>
                    current ? { ...current, draft: event.target.value } : current,
                  )
                }
                onBlur={() => closeInlineTextEditor({ commit: true })}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    closeInlineTextEditor({ commit: false });
                    return;
                  }
                  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                    event.preventDefault();
                    closeInlineTextEditor({ commit: true });
                  }
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  margin: 0,
                  padding: '6px 8px',
                  overflow: 'hidden',
                  resize: 'none',
                  border: '1px solid #6965db',
                  borderRadius: 6,
                  outline: 'none',
                  background: 'rgba(255,255,255,0.96)',
                  boxSizing: 'border-box',
                  color: String((inlineEditorNode.schemaRef as any)?.props?.fill ?? '#333333'),
                  fontSize: `${Number((inlineEditorNode.schemaRef as any)?.props?.fontSize ?? 16)}px`,
                  fontFamily: String(
                    (inlineEditorNode.schemaRef as any)?.props?.fontFamily ??
                      'Inter, Noto Sans SC, Noto Sans, sans-serif',
                  ),
                  fontWeight: String(
                    (inlineEditorNode.schemaRef as any)?.props?.fontWeight ?? 'normal',
                  ),
                  fontStyle: String(
                    (inlineEditorNode.schemaRef as any)?.props?.fontStyle ?? 'normal',
                  ),
                  textAlign: String(
                    (inlineEditorNode.schemaRef as any)?.props?.textAlign ?? 'left',
                  ) as any,
                  lineHeight: String((inlineEditorNode.schemaRef as any)?.props?.lineHeight ?? 1.4),
                  letterSpacing: `${Number((inlineEditorNode.schemaRef as any)?.props?.letterSpacing ?? 0)}px`,
                }}
              />
            </div>
          ) : null}

          {/* TransformControls inside scaled wrapper */}
          <TransformControls
            containerRef={proxyWrapperRef}
            dragContainerRef={proxyLayerRef}
            kernelStore={store}
            enabled={
              activeTool !== 'pan' &&
              !formatBrushActive &&
              !isCreationTool(activeTool) &&
              !inlineTextEditor
            }
            onUserEdit={onUserEdit}
            getViewport={getViewport}
            zoom={vp.zoom}
            isGridMode={isGridMode}
            gridLayout={isGridMode ? gridLayout : undefined}
          />
        </div>
      </div>

      {/* Line Connection Tool - shows handles when a line is selected */}
      {activeTool !== 'pan' && !formatBrushActive && !isCreationTool(activeTool) && (
        <>
          <LineConnectionTool
            kernelStore={store}
            getViewport={getViewport}
            onUserEdit={onUserEdit}
            containerRef={containerRef}
          />
          <PipeConnectionTool
            kernelStore={store}
            getViewport={getViewport}
            onUserEdit={onUserEdit}
            containerRef={containerRef}
          />
        </>
      )}

      {/* Creation Tool Layer for rectangle, circle, text, image tools */}
      {isCreationTool(activeTool) && (
        <CreateToolLayer
          activeTool={activeTool}
          getViewport={getViewport}
          applyNodeInsertAndSelect={(nodes, selectIds) => {
            const currentState = store.getState();

            // Build the new nodesById with added nodes
            const newNodesById = { ...currentState.nodesById };
            const newLayerOrder = [...currentState.layerOrder];

            nodes.forEach(
              (node: {
                id: string;
                type: string;
                position: { x: number; y: number };
                size?: { width: number; height: number };
                props: Record<string, unknown>;
              }) => {
                newNodesById[node.id] = {
                  id: node.id,
                  schemaRef: node,
                  visible: true,
                  locked: false,
                };
                // Add to layer order if not already present
                if (!newLayerOrder.includes(node.id)) {
                  newLayerOrder.push(node.id);
                }
              },
            );

            // Apply the combined state change
            store.setState({
              nodesById: newNodesById,
              layerOrder: newLayerOrder,
              selection: { nodeIds: selectIds },
            });
          }}
          pendingImageUrl={pendingImageUrl}
          onImagePickerRequest={onImagePickerRequest}
          toolExtraProps={activeTool === 'line' ? (lineToolProps ?? {}) : undefined}
          onCreationComplete={
            activeTool === 'image'
              ? () => {
                  onImagePickerComplete?.();
                }
              : activeTool === 'line' && !lineContinuous
                ? () => {
                    onResetTool?.();
                  }
                : undefined
          }
          onUserEdit={onUserEdit}
          onExternalDrop={handleDrop}
        />
      )}
    </div>
  );
});

export default CanvasView;
