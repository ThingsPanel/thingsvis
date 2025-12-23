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

const CanvasView = forwardRef<StudioCanvasHandle, { pageId: string; store: any; resolvePlugin?: (t:string)=>Promise<any>; activeTool: string }>(function CanvasView(
  { pageId, store, activeTool, resolvePlugin },
  ref
) {
  const mountedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const vpRef = useRef({ width: 0, height: 0, zoom: 1, offsetX: 0, offsetY: 0 });

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
    // Only clear selection if clicking directly on the canvas container, not on a node
    const target = e.target as HTMLElement;
    // Check if clicked on a node proxy target
    if (target.closest('.node-proxy-target')) {
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
    const node = {
      id: nodeId,
      type: entry?.type ?? entry?.remoteName ?? "layout/text",
      position: { x: worldX, y: worldY },
      size: { width: 200, height: 100 }, // Default size for new nodes
      props: entry?.defaultProps ?? {}
    };

    // Prefer kernel actionStack if available (records undo/redo globally)
    try {
      if (store.getState().addNodes) {
        store.getState().addNodes([node]);
      } else {
        kernelAction.addNode(pageId, node);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[CanvasView] drop failed", e);
    }
  }

  const nodes = Object.values(state.nodesById);
  const vp = vpRef.current;

  return (
    <div 
      ref={containerRef as any} 
      onClick={handleCanvasClick}
      onDragOver={handleDragOver} 
      onDrop={handleDrop} 
      style={{ width: "100%", height: "100%", position: "relative" }}
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
        onViewportChange={(vp) => {
          vpRef.current = vp;
        }}
      />

      {/* Proxy Layer for Moveable targets */}
      <div 
        className="proxy-layer"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            position: "absolute",
            left: vp.offsetX,
            top: vp.offsetY,
            transform: `scale(${vp.zoom})`,
            transformOrigin: "0 0"
          }}
        >
          {nodes.map(node => {
            const schema = node.schemaRef as any;
            if (!node.visible) return null;
            return (
              <div
                key={node.id}
                data-node-id={node.id}
                className="node-proxy-target"
                onClick={(e) => {
                  e.stopPropagation();
                  if (store.getState().selectNode) {
                    store.getState().selectNode(node.id);
                  }
                }}
                style={{
                  position: "absolute",
                  left: schema.position.x,
                  top: schema.position.y,
                  width: schema.size?.width ?? 0,
                  height: schema.size?.height ?? 0,
                  pointerEvents: "auto",
                  cursor: "pointer",
                  border: state.selection.nodeIds.includes(node.id) ? "1px solid #0066ff" : "none"
                }}
              />
            );
          })}
        </div>
      </div>

      <TransformControls 
        containerRef={containerRef} 
        kernelStore={store} 
      />

      <ConnectionTool 
        kernelStore={store} 
        activeTool={activeTool} 
      />
    </div>
  );
});

export default CanvasView;


