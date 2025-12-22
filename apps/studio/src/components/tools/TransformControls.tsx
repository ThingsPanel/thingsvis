import React, { useEffect, useRef, useCallback } from "react";
import { useSyncExternalStore } from "react";
import Moveable from "moveable";
import Selecto from "selecto";
import type { KernelStore, KernelState } from "@thingsvis/kernel";

type Props = {
  containerRef: React.RefObject<HTMLElement>;
  kernelStore: KernelStore;
};

export default function TransformControls({ containerRef, kernelStore }: Props) {
  const moveableRef = useRef<Moveable | null>(null);
  const selectoRef = useRef<Selecto | null>(null);

  const state = useSyncExternalStore(
    useCallback(subscribe => kernelStore.subscribe(subscribe), [kernelStore]),
    () => kernelStore.getState() as KernelState
  );

  useEffect(() => {
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
          kernelStore.getState().selectNode(selectedIds[0]); // MVP: single select
        } else if (e.isDragStart) {
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
      moveableRef.current?.destroy();
      selectoRef.current?.destroy();
    };
  }, [containerRef, kernelStore]);

  // Update Moveable target when selection changes
  useEffect(() => {
    if (!moveableRef.current || !containerRef.current) return;
    
    const selectedIds = state.selection.nodeIds;
    const targets = selectedIds
      .map(id => containerRef.current?.querySelector(`[data-node-id="${id}"]`))
      .filter(Boolean) as HTMLElement[];
    
    moveableRef.current.target = targets;
  }, [state.selection.nodeIds, containerRef]);

  return null;
}


