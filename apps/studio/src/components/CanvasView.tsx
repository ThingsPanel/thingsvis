import React, { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { CanvasView as UI_CanvasView, screenToCanvas } from "@thingsvis/ui";
import StudioCmdStack from "../lib/StudioCmdStack";
import { action as kernelAction, actionStack, createNodeDropCommand } from "@thingsvis/kernel";
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

const CanvasView = forwardRef<StudioCanvasHandle, { pageId: string; store?: any; resolvePlugin?: (t:string)=>Promise<any> }>(function CanvasView(
  { pageId, store },
  ref
) {
  const mountedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cmdStackRef = useRef<StudioCmdStack | null>(null);
  const vpRef = useRef({ width: 0, height: 0, zoom: 1, offsetX: 0, offsetY: 0 });

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

  useEffect(() => {
    // prefer kernel-level actionStack when available
    if (!cmdStackRef.current) cmdStackRef.current = new StudioCmdStack(50);
  }, []);

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
    const vpState = vpRef.current && vpRef.current.width > 0 ? vpRef.current : { width: rect.width, height: rect.height, zoom: 1, offsetX: 0, offsetY: 0 };
    const canvasConfig = { id: pageId, mode: "infinite", width: 1920, height: 1080, gridSize: 20, zoom: vpState.zoom, offsetX: vpState.offsetX, offsetY: vpState.offsetY };
    const world = screenToCanvas({ x: localX, y: localY }, canvasConfig as any, vpState);

    const nodeId = generateId("node");
    const node = {
      id: nodeId,
      type: entry?.remoteName ?? "layout/text",
      position: { x: world.x, y: world.y },
      props: entry?.defaultProps ?? {}
    };

    // Prefer kernel actionStack if available (records undo/redo globally)
    try {
      const actionCmd = createNodeDropCommand
        ? createNodeDropCommand({
            componentType: node.type,
            position: node.position,
            initialProps: node.props
          })
        : null;

      if ((window as any).__thingsvis_actionStack__ || actionStack) {
        // if kernel actionStack exists, push an action-style wrapper that calls kernel.action API
        const act = {
          id: node.id,
          type: "node.drop.action",
          execute: () => {
            // use kernel action API to persist
            kernelAction.addNode(pageId, node);
            return node.id;
          },
          undo: () => {
            kernelAction.removeNode(pageId, node.id);
            return node.id;
          }
        };
        try {
          // prefer actionStack when imported
          (actionStack as any)?.push(act);
        } catch {
          // fallback to local cmd stack
          cmdStackRef.current?.push({ id: node.id, do: act.execute, undo: act.undo } as any);
        }
      } else if (actionCmd && cmdStackRef.current) {
        // fallback: push local do/undo via StudioCmdStack
        cmdStackRef.current.push({
          id: node.id,
          do: () => kernelAction.addNode(pageId, node),
          undo: () => kernelAction.removeNode(pageId, node.id)
        } as any);
      } else {
        kernelAction.addNode(pageId, node);
      }
    } catch (e) {
      if (store && store.getState && store.getState().addNodes) {
        store.getState().addNodes([node]);
      } else {
        // eslint-disable-next-line no-console
        console.warn("[CanvasView] store not provided; drop will not persist", node);
      }
    }
  }

  // Use the shared CanvasView from thingsvis-ui for now; studio-specific
  // behaviors (drop handlers, ghost layers) are attached to wrapper.
  return (
    <div ref={containerRef as any} onDragOver={handleDragOver} onDrop={handleDrop} style={{ width: "100%", height: "100%" }}>
      <UI_CanvasView
        store={store}
        mode="infinite"
        width={1920}
        height={1080}
        gridSize={20}
        snapToGrid={true}
        centeredMask={false}
        onViewportChange={(vp) => {
          vpRef.current = vp;
        }}
      />
    </div>
  );
});

export default CanvasView;


