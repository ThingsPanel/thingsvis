import React, { useEffect, useRef, forwardRef, useImperativeHandle, useState, useCallback } from "react";
import { useSyncExternalStore } from "react";
import { CanvasView as UI_CanvasView, screenToCanvas } from "@thingsvis/ui";
import { action as kernelAction, actionStack, createNodeDropCommand, type KernelState } from "@thingsvis/kernel";
import TransformControls from "./tools/TransformControls";
import ConnectionTool from "./tools/ConnectionTool";

function generateId(prefix = "node") {
  try {
    // @ts-ignore
    if (typeof crypto !== "undefined" && typeof (crypto as any).randomUUID === "function") {
      // @ts-ignore
      return (crypto as any).randomUUID();
    }
  } catch {}
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
  resolvePlugin?: (t:string)=>Promise<any>; 
  activeTool: string;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  onUserEdit?: () => void;
}>(function CanvasView(
  { pageId, store, activeTool, resolvePlugin, zoom = 1, onZoomChange, onUserEdit },
  ref
) {
  const mountedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Use state for viewport so changes trigger re-render
  const [vp, setVp] = useState({ width: 0, height: 0, zoom: 1, offsetX: 0, offsetY: 0 });
  const vpRef = useRef(vp);
  vpRef.current = vp; // Keep ref in sync for callbacks
  const [isPointerDown, setIsPointerDown] = useState(false);
  const proxyWrapperRef = useRef<HTMLDivElement | null>(null);
  const proxyLayerRef = useRef<HTMLDivElement | null>(null);

  const getViewport = useCallback(() => vpRef.current, []);

  const state = useSyncExternalStore(
    useCallback(subscribe => store.subscribe(subscribe), [store]),
    () => store.getState() as KernelState
  );

  useImperativeHandle(ref, () => ({
    dispatchToKernel: (payload: unknown) => {
      // Bridge for the studio app to send commands/events to the kernel.
      // Implementation will call the kernel IPC or store action in future tasks.
      // eslint-disable-next-line no-console
      console.log("[StudioCanvasView] dispatchToKernel:", payload);
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
    e.preventDefault();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    // Attempt to read plugin info from dataTransfer
    const payload = e.dataTransfer.getData("application/thingsvis-plugin") || e.dataTransfer.getData("text/plain");
    let entry: any = null;
    try {
      entry = payload ? JSON.parse(payload) : null;
    } catch {
      entry = null;
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

    const nodeId = generateId("node");
    // 对于 resizable: false 的组件，不设置 size（由内容撑开）
    const isResizable = (entry as any)?.resizable !== false;
    const pluginDefaultSize = (entry as any)?.defaultSize;
    
    const node = {
      id: nodeId,
      type: entry?.type ?? entry?.remoteName ?? "layout/text",
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
      console.error("[CanvasView] drop failed", e);
    }
  }

  const nodes = Object.values(state.nodesById);
  // vp is now from useState, no need to read from ref
  const isPanTool = activeTool === 'pan';
  const canvasCursor = isPanTool ? (isPointerDown ? 'grabbing' : 'grab') : 'default';

  return (
    <div 
      ref={containerRef as any} 
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
        resolvePlugin={resolvePlugin}
        mode={state.canvas.mode}
        width={state.canvas.width}
        height={state.canvas.height}
        gridSize={20}
        snapToGrid={true}
        centeredMask={true}
        panEnabled={activeTool === 'pan'}
        zoomEnabled={activeTool === 'pan'}
        zoom={zoom}
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
            // Read rotation from props._rotation (fallback to schema.rotation for compatibility)
            const rotation = schema.props?._rotation ?? schema.rotation ?? 0;
            return (
              <div
                key={node.id}
                data-node-id={node.id}
                className="node-proxy-target"
                style={{
                  position: "absolute",
                  left: schema.position.x,
                  top: schema.position.y,
                  width: schema.size?.width ?? 0,
                  height: schema.size?.height ?? 0,
                  transform: rotation !== 0 ? `rotate(${rotation}deg)` : undefined,
                  transformOrigin: 'center center',
                  pointerEvents: isPanTool ? "none" : "auto",
                  cursor: isPanTool ? canvasCursor : "pointer",
                  border: state.selection.nodeIds.includes(node.id) ? "1px solid #0066ff" : "none"
                }}
              />
            );
          })}

          {/* TransformControls inside scaled wrapper */}
          <TransformControls 
            containerRef={proxyWrapperRef}
            dragContainerRef={proxyLayerRef}
            kernelStore={store} 
            enabled={activeTool !== 'pan'}
            onUserEdit={onUserEdit}
            getViewport={getViewport}
            zoom={vp.zoom}
          />
        </div>
      </div>

      <ConnectionTool 
        kernelStore={store} 
        activeTool={activeTool} 
      />
    </div>
  );
});

export default CanvasView;


