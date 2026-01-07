import React, { useEffect, useRef, useCallback } from "react";
import { useSyncExternalStore } from "react";
import Moveable from "moveable";
import Selecto from "selecto";
import type { KernelStore, KernelState } from "@thingsvis/kernel";

type Props = {
  containerRef: React.RefObject<HTMLElement>;
  kernelStore: KernelStore;
  enabled?: boolean;
};

export default function TransformControls({ containerRef, kernelStore, enabled = true }: Props) {
  const moveableRef = useRef<Moveable | null>(null);
  const selectoRef = useRef<Selecto | null>(null);

  const state = useSyncExternalStore(
    useCallback(subscribe => kernelStore.subscribe(subscribe), [kernelStore]),
    () => kernelStore.getState() as KernelState
  );

  useEffect(() => {
    if (!enabled) {
      try {
        moveableRef.current?.destroy();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[TransformControls] Moveable destroy failed', e);
      }
      try {
        selectoRef.current?.destroy();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[TransformControls] Selecto destroy failed', e);
      }
      moveableRef.current = null;
      selectoRef.current = null;
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    try {
      moveableRef.current = new Moveable(container, {
        target: [],
        draggable: true,
        resizable: true,
        rotatable: true,
        pinchable: true,
        origin: true,
        keepRatio: false,
        throttleDrag: 0,
        throttleResize: 0,
        throttleRotate: 0,
      });

      selectoRef.current = new Selecto({
        container,
        dragContainer: container,
        selectableTargets: [".node-proxy-target"],
        hitRate: 0,
        selectByClick: true,
        selectFromInside: false,
        toggleContinueSelect: ["shift"],
        ratio: 0,
      });

      // Selection handling
      selectoRef.current.on("select", (e) => {
        const selectedIds = e.selected.map(el => el.getAttribute("data-node-id")).filter(Boolean) as string[];
        if (selectedIds.length > 0) {
          kernelStore.getState().selectNode(selectedIds[0] ?? null); // MVP: single select
        } else if ((e as any).isDragStartEnd) {
          kernelStore.getState().selectNode(null as any);
        }
      });

      // Drag handling
      moveableRef.current.on("drag", ({ target, left, top }) => {
        target.style.left = `${left}px`;
        target.style.top = `${top}px`;
      });

      moveableRef.current.on("dragEnd", ({ target, isDrag }) => {
        if (!isDrag) return;
        const nodeId = target.getAttribute("data-node-id");
        if (nodeId) {
          const x = parseFloat(target.style.left);
          const y = parseFloat(target.style.top);
          kernelStore.getState().updateNode(nodeId, { position: { x, y } });
        }
      });

      // Resize handling
      moveableRef.current.on("resize", ({ target, width, height, drag }) => {
        target.style.width = `${width}px`;
        target.style.height = `${height}px`;
        target.style.left = `${drag.left}px`;
        target.style.top = `${drag.top}px`;
      });

      moveableRef.current.on("resizeEnd", ({ target, isDrag }) => {
        if (!isDrag) return;
        const nodeId = target.getAttribute("data-node-id");
        if (nodeId) {
          const width = parseFloat(target.style.width);
          const height = parseFloat(target.style.height);
          const x = parseFloat(target.style.left);
          const y = parseFloat(target.style.top);
          kernelStore.getState().updateNode(nodeId, { 
            position: { x, y },
            size: { width, height } 
          });
        }
      });

    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[TransformControls] initialization failed", e);
    }

    return () => {
      try {
        moveableRef.current?.destroy();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[TransformControls] Moveable destroy failed', e);
      }
      try {
        selectoRef.current?.destroy();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[TransformControls] Selecto destroy failed', e);
      }
      moveableRef.current = null;
      selectoRef.current = null;
    };
  }, [containerRef, kernelStore, enabled]);

  // Update Moveable target when selection changes or nodes change (e.g. via undo/redo)
  useEffect(() => {
    if (!enabled) return;
    if (!moveableRef.current || !containerRef.current) return;
    
    const selectedIds = state.selection.nodeIds;
    // Only select nodes that actually exist in the current state and are not locked
    const validSelectedIds = selectedIds.filter(id => {
      const node = state.nodesById[id];
      return !!node && !node.locked;
    });
    
    const targets = validSelectedIds
      .map(id => containerRef.current?.querySelector(`[data-node-id="${id}"]`))
      .filter(Boolean) as HTMLElement[];
    
    // Disable draggable/resizable for locked nodes
    const hasLockedSelection = selectedIds.some(id => state.nodesById[id]?.locked);
    moveableRef.current.draggable = !hasLockedSelection;
    moveableRef.current.resizable = !hasLockedSelection;
    moveableRef.current.rotatable = !hasLockedSelection;
    
    moveableRef.current.target = targets;
    
    // Recalculate the position of the handles to match the DOM elements.
    // This is crucial when nodes are moved/restored via Undo/Redo.
    if (targets.length > 0) {
      // Use requestAnimationFrame to ensure DOM has updated before recalculating
      requestAnimationFrame(() => {
        moveableRef.current?.updateRect();
      });
    }
  }, [state.selection.nodeIds, state.nodesById, containerRef, enabled]);

  return null;
}


