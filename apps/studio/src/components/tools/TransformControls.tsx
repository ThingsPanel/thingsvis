import React, { useEffect, useRef, useCallback } from "react";
import { useSyncExternalStore } from "react";
import Moveable from "moveable";
import Selecto from "selecto";
import type { KernelStore, KernelState } from "@thingsvis/kernel";

type Props = {
  containerRef: React.RefObject<HTMLElement>;
  kernelStore: KernelStore;
  enabled?: boolean;
  onUserEdit?: () => void;
  getViewport?: () => { width: number; height: number; zoom: number; offsetX: number; offsetY: number };
  zoom?: number; // Current viewport zoom - triggers re-render when changed
};

export default function TransformControls({ containerRef, kernelStore, enabled = true, onUserEdit, getViewport, zoom = 1 }: Props) {
  const moveableRef = useRef<Moveable | null>(null);
  const selectoRef = useRef<Selecto | null>(null);

  const baseWorldPositionByIdRef = useRef<Record<string, { x: number; y: number }>>({});
  const baseWorldSizeByIdRef = useRef<Record<string, { width: number; height: number }>>({});
  const lastKnownZoomRef = useRef<number>(1);
  const viewportPollTimerRef = useRef<number | null>(null);

  const state = useSyncExternalStore(
    useCallback(subscribe => kernelStore.subscribe(subscribe), [kernelStore]),
    () => kernelStore.getState() as KernelState
  );

  // Update Moveable when viewport zoom changes
  useEffect(() => {
    if (!moveableRef.current) return;
    const z = zoom && zoom > 0 ? zoom : 1;
    console.log('[TransformControls] Zoom changed', { zoom: z });
    lastKnownZoomRef.current = z;
    // Just update rect - Moveable will re-read target positions via getBoundingClientRect
    moveableRef.current.updateRect();
  }, [zoom]);

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

    const readViewport = () => {
      try {
        return getViewport?.() ?? { width: 0, height: 0, zoom: 1, offsetX: 0, offsetY: 0 };
      } catch {
        return { width: 0, height: 0, zoom: 1, offsetX: 0, offsetY: 0 };
      }
    };

    // Moveable is inside scaled wrapper, targets are also inside
    // - All positions and deltas are in world coords, no conversion needed

    // Read initial zoom
    const initialVp = readViewport();
    const initialZoom = initialVp.zoom && initialVp.zoom > 0 ? initialVp.zoom : 1;
    lastKnownZoomRef.current = initialZoom;

    // DEBUG: Log container and viewport info
    console.log('[TransformControls] Init', {
      container: container.className,
      containerRect: container.getBoundingClientRect(),
      initialVp,
      initialZoom,
    });

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
        // No zoom - Moveable is inside scaled container, everything is in world coords
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
        moveableRef.current?.updateRect();

        const nodeId = target.getAttribute('data-node-id');
        if (nodeId) {
          const node = (kernelStore.getState() as KernelState).nodesById[nodeId];
          const schema = node?.schemaRef as any;
          if (schema?.position) {
            baseWorldPositionByIdRef.current[nodeId] = { x: schema.position.x ?? 0, y: schema.position.y ?? 0 };
          }
        }

        target.style.willChange = 'transform';
        target.style.transform = '';
      });

      moveableRef.current.on('drag', ({ target, beforeTranslate }) => {
        // Moveable is inside scaled wrapper, beforeTranslate is already in world coords
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
        // Moveable is inside scaled wrapper, beforeTranslate is already in world coords
        const dx = (lastEvent as any)?.beforeTranslate?.[0] ?? 0;
        const dy = (lastEvent as any)?.beforeTranslate?.[1] ?? 0;

        const baseWorld = nodeId ? baseWorldPositionByIdRef.current[nodeId] : null;

        const x = (baseWorld?.x ?? (parseFloat(target.style.left || '0') || 0)) + dx;
        const y = (baseWorld?.y ?? (parseFloat(target.style.top || '0') || 0)) + dy;
        target.style.left = `${x}px`;
        target.style.top = `${y}px`;
        target.style.transform = '';

        if (nodeId) {
          kernelStore.getState().updateNode(nodeId, { position: { x, y } });
          onUserEdit?.();
        }
      });

      // Resize handling (use transform during resize drag)
      moveableRef.current.on('resizeStart', ({ target }) => {
        moveableRef.current?.updateRect();

        const nodeId = target.getAttribute('data-node-id');
        if (nodeId) {
          const node = (kernelStore.getState() as KernelState).nodesById[nodeId];
          const schema = node?.schemaRef as any;
          if (schema?.position) {
            baseWorldPositionByIdRef.current[nodeId] = { x: schema.position.x ?? 0, y: schema.position.y ?? 0 };
          }
          if (schema?.size) {
            baseWorldSizeByIdRef.current[nodeId] = { width: schema.size.width ?? 0, height: schema.size.height ?? 0 };
          }
        }

        target.style.willChange = 'transform,width,height';
        target.style.transform = '';
      });

      moveableRef.current.on('resize', ({ target, width, height, drag }) => {
        // Moveable is inside scaled wrapper, width/height are already in world coords
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
        // Moveable is inside scaled wrapper, translate is already in world coords
        const dx = (lastEvent as any)?.drag?.beforeTranslate?.[0] ?? 0;
        const dy = (lastEvent as any)?.drag?.beforeTranslate?.[1] ?? 0;

        const baseWorld = nodeId ? baseWorldPositionByIdRef.current[nodeId] : null;

        const x = (baseWorld?.x ?? (parseFloat(target.style.left || '0') || 0)) + dx;
        const y = (baseWorld?.y ?? (parseFloat(target.style.top || '0') || 0)) + dy;

        target.style.left = `${x}px`;
        target.style.top = `${y}px`;
        target.style.transform = '';

        if (nodeId) {
          // width/height from target.style are already in world (we set them above)
          const width = parseFloat(target.style.width || '0') || 0;
          const height = parseFloat(target.style.height || '0') || 0;
          kernelStore.getState().updateNode(nodeId, { position: { x, y }, size: { width, height } });
          onUserEdit?.();
        }
      });

    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[TransformControls] initialization failed", e);
    }

    return () => {
      if (viewportPollTimerRef.current !== null) {
        window.clearInterval(viewportPollTimerRef.current);
        viewportPollTimerRef.current = null;
      }
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
  }, [containerRef, kernelStore, enabled, getViewport]);

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

    // DEBUG: Log target selection info
    if (targets.length > 0) {
      const vp = getViewport?.() ?? { zoom: 1 };
      console.log('[TransformControls] Target selected', {
        selectedIds: validSelectedIds,
        targetCount: targets.length,
        targetRect: targets[0]?.getBoundingClientRect(),
        targetStyle: {
          left: targets[0]?.style.left,
          top: targets[0]?.style.top,
          width: targets[0]?.style.width,
          height: targets[0]?.style.height,
        },
        viewport: vp,
        moveableZoom: (moveableRef.current as any)?.zoom,
      });
    }
    
    // Disable draggable/resizable for locked nodes
    const hasLockedSelection = selectedIds.some(id => state.nodesById[id]?.locked);
    moveableRef.current.draggable = !hasLockedSelection;
    moveableRef.current.resizable = !hasLockedSelection;
    moveableRef.current.rotatable = !hasLockedSelection;
    
    moveableRef.current.target = targets;
    
    // Recalculate the position of the handles to match the DOM elements.
    // This is crucial when nodes are moved/restored via Undo/Redo.
    if (targets.length > 0) {
      // Start a lightweight poll so Moveable handle alignment stays correct when the viewport zoom changes.
      if (viewportPollTimerRef.current === null) {
        viewportPollTimerRef.current = window.setInterval(() => {
          const z = (() => {
            try {
              return getViewport?.().zoom ?? 1;
            } catch {
              return 1;
            }
          })();
          if (Math.abs(z - lastKnownZoomRef.current) > 1e-6) {
            lastKnownZoomRef.current = z;
            // Update Moveable's zoom property (1/zoom to keep handles at constant screen size)
            if (moveableRef.current) {
              (moveableRef.current as any).zoom = 1 / z;
              moveableRef.current.updateRect();
            }
          }
        }, 100);
      }

      // Use requestAnimationFrame to ensure DOM has updated before recalculating
      requestAnimationFrame(() => {
        moveableRef.current?.updateRect();
      });
    } else if (viewportPollTimerRef.current !== null) {
      window.clearInterval(viewportPollTimerRef.current);
      viewportPollTimerRef.current = null;
    }
  }, [state.selection.nodeIds, state.nodesById, containerRef, enabled, getViewport]);

  return null;
}


