import React, { useEffect, useRef, forwardRef, useImperativeHandle, useState, useCallback } from "react";
import { useSyncExternalStore } from "react";
import { CanvasView as UI_CanvasView, screenToCanvas, useGridLayout } from "@thingsvis/ui";
import { action as kernelAction, actionStack, createNodeDropCommand, type KernelState } from "@thingsvis/kernel";
import { validateCanvasTheme } from "@thingsvis/schema";
import TransformControls from "./tools/TransformControls";
import CreateToolLayer from "./tools/CreateToolLayer";
import LineConnectionTool from "./tools/LineConnectionTool";
import { isCreationTool } from "./tools/types";

function generateId(prefix = "node") {
  try {
    // @ts-ignore
    if (typeof crypto !== "undefined" && typeof (crypto as any).randomUUID === "function") {
      // @ts-ignore
      return (crypto as any).randomUUID();
    }
  } catch { }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export type StudioCanvasHandle = {
  dispatchToKernel: (payload: unknown) => void;
  mount: () => void;
  unmount: () => void;
};

const CanvasView = forwardRef<StudioCanvasHandle, {
  pageId: string;
  store: any;
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
}>(function CanvasView(
  { pageId, store, activeTool, resolveWidget, lineToolProps, lineContinuous = true, zoom = 1, onZoomChange, onUserEdit, onResetTool, pendingImageUrl, onImagePickerRequest, onImagePickerComplete, theme = 'dawn', centerPadding },
  ref
) {
  const mountedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Use state for viewport so changes trigger re-render
  const [vp, setVp] = useState({ width: 0, height: 0, zoom: zoom, offsetX: 0, offsetY: 0 });
  const vpRef = useRef(vp);
  vpRef.current = vp; // Keep ref in sync for callbacks

  // Sync state when zoom prop changes
  useEffect(() => {
    setVp(prev => ({
      ...prev,
      zoom: zoom
    }))
  }, [zoom])
  const [isPointerDown, setIsPointerDown] = useState(false);
  const proxyWrapperRef = useRef<HTMLDivElement | null>(null);
  const proxyLayerRef = useRef<HTMLDivElement | null>(null);

  const getViewport = useCallback(() => vpRef.current, []);

  const state = useSyncExternalStore(
    useCallback(subscribe => store.subscribe(subscribe), [store]),
    () => store.getState() as KernelState
  );

  // Detect grid layout mode
  const isGridMode = state.canvas?.mode === 'grid';

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
    }
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
    // Attempt to read plugin info from dataTransfer
    const payload = e.dataTransfer.getData("application/thingsvis-widget") || e.dataTransfer.getData("text/plain");
    let entry: any = null;
    try {
      entry = payload ? JSON.parse(payload) : null;
    } catch {
      entry = null;
    }

    // Only create node if we have valid plugin data from component library
    // This prevents creating text nodes when user drags existing nodes or images
    if (!entry || !entry.type) {
      return;
    }

    const rect = (containerRef.current as HTMLDivElement).getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;

    // Correctly use current viewport state for coordinate conversion
    const vpState = vpRef.current && vpRef.current.width > 0
      ? vpRef.current
      : { width: rect.width, height: rect.height, zoom: 1, offsetX: 0, offsetY: 0 };

    // Convert screen coords to world coords taking zoom and offset into account
    const worldX = (localX - vpState.offsetX) / vpState.zoom;
    const worldY = (localY - vpState.offsetY) / vpState.zoom;

    // Fetch the remote/local widget bundle to get exact default properties.
    let widgetModule: any = null;
    if (resolveWidget && entry.type) {
      try {
        widgetModule = await resolveWidget(entry.type);
      } catch (err) {
        // Fallback down below if module could not be lazy-loaded 
      }
    }

    const nodeId = generateId("node");
    const moduleDefs = widgetModule?.entry || widgetModule; // handle both {entry: Main} and direct Main returns
    // 对于 resizable: false 的组件，不设置 size（由内容撑开）
    const isResizable = moduleDefs?.resizable !== false && (entry as any)?.resizable !== false;
    const pluginDefaultSize = moduleDefs?.defaultSize || (entry as any)?.defaultSize;

    const node = {
      id: nodeId,
      type: entry.type,
      position: { x: worldX, y: worldY },
      // 只有可调整尺寸的组件才设置 size
      ...(isResizable ? { size: pluginDefaultSize || { width: 200, height: 100 } } : {}),
      props: entry?.defaultProps ?? {}
    };

    // Prefer kernel actionStack if available (records undo/redo globally)
    try {
      if (store.getState().addNodes) {
        store.getState().addNodes([node as any]);
      } else {
        kernelAction.addNode(pageId, node as any);
      }

      // Ensure autosave is scheduled even if this mutation doesn't hit temporal.
      onUserEdit?.();
    } catch (e) {
      // eslint-disable-next-line no-console

    }
  }

  const nodes = Object.values(state.nodesById);
  // vp is now from useState, no need to read from ref
  const isPanTool = activeTool === 'pan';
  const canvasCursor = isPanTool ? (isPointerDown ? 'grabbing' : 'grab') : 'default';

  // Normalize theme via registry
  const normalizedTheme = validateCanvasTheme(theme);

  return (
    <div
      ref={containerRef as any}
      className={`theme-${normalizedTheme}`}
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
      style={{ width: "100%", height: "100%", position: "relative", cursor: canvasCursor }}
    >
      <UI_CanvasView
        store={store}
        resolveWidget={resolveWidget}
        mode={state.canvas.mode}
        width={state.canvas.width}
        height={state.canvas.height}
        gridSize={20}
        snapToGrid={true}
        centeredMask={true}
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
          position: "absolute",
          inset: 0,
          zIndex: 20,
          pointerEvents: isPanTool ? "none" : "auto",
          overflow: "hidden"
        }}
      >
        <div
          ref={proxyWrapperRef}
          className="proxy-wrapper"
          style={{
            position: "absolute",
            left: vp.offsetX,
            top: vp.offsetY,
            transform: `scale(${vp.zoom})`,
            transformOrigin: "0 0",
            pointerEvents: "auto" // Enable pointer events for Moveable handles
          }}
        >
          {nodes.map(node => {
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
            const isLine = schema.type === 'basic/line';
            const isSelected = state.selection.nodeIds.includes(node.id);
            // Line components use LineConnectionTool for selection UI, don't show border
            const showBorder = isSelected && !isLine;
            return (
              <div
                key={node.id}
                data-node-id={node.id}
                className="node-proxy-target"
                style={{
                  position: "absolute",
                  left: posX,
                  top: posY,
                  width,
                  height,
                  transform: rotation !== 0 ? `rotate(${rotation}deg)` : undefined,
                  transformOrigin: 'center center',
                  pointerEvents: isPanTool ? "none" : "auto",
                  cursor: isPanTool ? canvasCursor : "pointer",
                  border: showBorder ? "1px solid #0066ff" : "none"
                }}
              />
            );
          })}

          {/* TransformControls inside scaled wrapper */}
          <TransformControls
            containerRef={proxyWrapperRef}
            dragContainerRef={proxyLayerRef}
            kernelStore={store}
            enabled={activeTool !== 'pan' && !isCreationTool(activeTool)}
            onUserEdit={onUserEdit}
            getViewport={getViewport}
            zoom={vp.zoom}
            isGridMode={isGridMode}
            gridLayout={isGridMode ? gridLayout : undefined}
          />
        </div>
      </div>

      {/* Line Connection Tool - shows handles when a line is selected */}
      {
        activeTool !== 'pan' && !isCreationTool(activeTool) && (
          <LineConnectionTool
            kernelStore={store}
            containerRef={proxyLayerRef}
            getViewport={getViewport}
            onUserEdit={onUserEdit}
          />
        )
      }

      {/* Creation Tool Layer for rectangle, circle, text, image tools */}
      {
        isCreationTool(activeTool) && (
          <CreateToolLayer
            activeTool={activeTool}
            getViewport={getViewport}
            applyNodeInsertAndSelect={(nodes, selectIds) => {
              const currentState = store.getState();

              // Build the new nodesById with added nodes
              const newNodesById = { ...currentState.nodesById };
              const newLayerOrder = [...currentState.layerOrder];

              nodes.forEach((node: { id: string; type: string; position: { x: number; y: number }; size?: { width: number; height: number }; props: Record<string, unknown> }) => {
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
              });

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
        )
      }
    </div >
  );
});

export default CanvasView;


