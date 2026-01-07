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
        throttleDrag: 1,
        throttleResize: 1,
        throttleRotate: 1,
        useResizeObserver: false,
        useMutationObserver: false,
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

      // Drag handling (use transform during drag for perf; commit left/top at end)
      moveableRef.current.on('dragStart', ({ target }) => {
        const baseLeft = parseFloat(target.style.left || '0') || 0;
        const baseTop = parseFloat(target.style.top || '0') || 0;
        target.dataset.baseLeft = String(baseLeft);
        target.dataset.baseTop = String(baseTop);
        target.style.willChange = 'transform';
        target.style.transform = '';
      });

      moveableRef.current.on('drag', ({ target, beforeTranslate }) => {
        const tx = beforeTranslate?.[0] ?? 0;
        const ty = beforeTranslate?.[1] ?? 0;
        target.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      });

      moveableRef.current.on('dragEnd', ({ target, isDrag, lastEvent }) => {
        target.style.willChange = '';
        if (!isDrag) {
          target.style.transform = '';
          return;
        }

        const nodeId = target.getAttribute('data-node-id');
        const baseLeft = parseFloat(target.dataset.baseLeft || '0') || 0;
        const baseTop = parseFloat(target.dataset.baseTop || '0') || 0;
        const tx = (lastEvent as any)?.beforeTranslate?.[0] ?? 0;
        const ty = (lastEvent as any)?.beforeTranslate?.[1] ?? 0;

        const x = baseLeft + tx;
        const y = baseTop + ty;
        target.style.left = `${x}px`;
        target.style.top = `${y}px`;
        target.style.transform = '';

        if (nodeId) {
          kernelStore.getState().updateNode(nodeId, { position: { x, y } });
        }
      });

      // Resize handling (use transform during resize drag)
      moveableRef.current.on('resizeStart', ({ target }) => {
        const baseLeft = parseFloat(target.style.left || '0') || 0;
        const baseTop = parseFloat(target.style.top || '0') || 0;
        target.dataset.baseLeft = String(baseLeft);
        target.dataset.baseTop = String(baseTop);
        target.style.willChange = 'transform,width,height';
        target.style.transform = '';
      });

      moveableRef.current.on('resize', ({ target, width, height, drag }) => {
        target.style.width = `${width}px`;
        target.style.height = `${height}px`;
        const tx = drag?.beforeTranslate?.[0] ?? 0;
        const ty = drag?.beforeTranslate?.[1] ?? 0;
        target.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      });

      moveableRef.current.on('resizeEnd', ({ target, isDrag, lastEvent }) => {
        target.style.willChange = '';
        if (!isDrag) {
          target.style.transform = '';
          return;
        }

        const nodeId = target.getAttribute('data-node-id');
        const baseLeft = parseFloat(target.dataset.baseLeft || '0') || 0;
        const baseTop = parseFloat(target.dataset.baseTop || '0') || 0;
        const tx = (lastEvent as any)?.drag?.beforeTranslate?.[0] ?? 0;
        const ty = (lastEvent as any)?.drag?.beforeTranslate?.[1] ?? 0;
        const x = baseLeft + tx;
        const y = baseTop + ty;

        target.style.left = `${x}px`;
        target.style.top = `${y}px`;
        target.style.transform = '';

        if (nodeId) {
          const w = parseFloat(target.style.width || '0') || 0;
          const h = parseFloat(target.style.height || '0') || 0;
          kernelStore.getState().updateNode(nodeId, { position: { x, y }, size: { width: w, height: h } });
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


