import React, { useEffect, useRef, useCallback } from "react";
import { useSyncExternalStore } from "react";
import Moveable, { getElementInfo } from "moveable";
import Selecto from "selecto";
import type { KernelStore, KernelState } from "@thingsvis/kernel";

type Props = {
  containerRef: React.RefObject<HTMLElement>;
  dragContainerRef?: React.RefObject<HTMLElement>; // Container for Selecto drag area (box selection)
  kernelStore: KernelStore;
  enabled?: boolean;
  onUserEdit?: () => void;
  getViewport?: () => { width: number; height: number; zoom: number; offsetX: number; offsetY: number };
  zoom?: number; // Current viewport zoom - triggers re-render when changed
};

export default function TransformControls({ containerRef, dragContainerRef, kernelStore, enabled = true, onUserEdit, getViewport, zoom = 1 }: Props) {
  const moveableRef = useRef<Moveable | null>(null);
  const selectoRef = useRef<Selecto | null>(null);

  const baseWorldPositionByIdRef = useRef<Record<string, { x: number; y: number }>>({});
  const baseWorldSizeByIdRef = useRef<Record<string, { width: number; height: number }>>({});
  const dragTranslateByIdRef = useRef<Record<string, { x: number; y: number }>>({});
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
        // Allow dragging directly on the target elements and within the moveable bounds.
        // This improves usability and makes multi-drag more predictable.
        dragArea: true,
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

      // Use dragContainerRef for box selection area, fallback to container
      const dragContainer = dragContainerRef?.current || container;

      selectoRef.current = new Selecto({
        container: dragContainer, // Selection box rendered in the outer unscaled container
        dragContainer,
        selectableTargets: [".node-proxy-target"],
        hitRate: 0,
        selectByClick: true,
        selectFromInside: false,
        toggleContinueSelect: ["shift", "ctrl", "meta"], // Support Ctrl/Shift/Meta for additive selection
        ratio: 0,
        // Use Moveable's getElementInfo to correctly calculate element positions with transforms
        getElementRect: getElementInfo,
      });

      // Selecto dragStart - stop if clicking on Moveable element or selected target
      selectoRef.current.on("dragStart", (e) => {
        const inputEvent = e.inputEvent;
        const target = inputEvent.target as HTMLElement;
        
        console.log('[Selecto] dragStart', {
          target: target.className,
          targetNodeId: target.getAttribute('data-node-id'),
        });
        
        // Check if clicking on a Moveable control element
        if (moveableRef.current?.isMoveableElement(target)) {
          console.log('[Selecto] dragStart stopped - Moveable element');
          e.stop();
          return;
        }
        
        // Check if clicking on an already selected target
        const selectedTargets = (kernelStore.getState() as KernelState).selection.nodeIds
          .map(id => container.querySelector(`[data-node-id="${id}"]`))
          .filter(Boolean) as HTMLElement[];
        
        if (selectedTargets.some(t => t === target || t.contains(target))) {
          console.log('[Selecto] dragStart stopped - already selected target');
          e.stop();
          return;
        }
      });

      // Real-time selection feedback during box selection drag
      selectoRef.current.on("select", (e) => {
        console.log('[Selecto] select', {
          added: e.added.map(el => el.getAttribute('data-node-id')),
          removed: e.removed.map(el => el.getAttribute('data-node-id')),
          selected: e.selected.map(el => el.getAttribute('data-node-id')),
        });
        // Update visual feedback for elements during box selection
        // Add "selecting" class for real-time visual feedback
        e.added.forEach(el => {
          el.classList.add("selecting");
        });
        e.removed.forEach(el => {
          el.classList.remove("selecting");
        });
      });

      // Selection handling - use selectEnd for final selection state
      selectoRef.current.on("selectEnd", (e) => {
        // Clean up "selecting" class
        e.selected.forEach(el => {
          el.classList.remove("selecting");
        });
        
        const getId = (el: Element | null | undefined) => el?.getAttribute?.("data-node-id") || null;
        const selectedIds = e.selected.map(getId).filter((id): id is string => id !== null);
        const inputEvent = e.inputEvent as MouseEvent | undefined;
        const isAdditive = inputEvent?.ctrlKey || inputEvent?.metaKey || inputEvent?.shiftKey;

        console.log('[Selecto] selectEnd', { 
          selectedCount: e.selected.length,
          selectedElements: e.selected.map(el => el.getAttribute('data-node-id')),
          selectedIds, 
          isAdditive, 
          isDragStart: e.isDragStart,
          isDragStartEnd: e.isDragStartEnd,
          isClick: e.isClick,
          rect: e.rect,
        });

        if (selectedIds.length > 0) {
          if (isAdditive) {
            // Ctrl/Shift + click: toggle selection for single node
            if (e.isClick && selectedIds.length === 1) {
              const nodeId = selectedIds[0]!;
              const currentIds = kernelStore.getState().selection.nodeIds;
              if (currentIds.includes(nodeId)) {
                // Remove from selection
                kernelStore.getState().selectNodes(currentIds.filter(id => id !== nodeId));
              } else {
                // Add to selection
                kernelStore.getState().selectNodes([...currentIds, nodeId]);
              }
            } else {
              // Box selection with modifier: add all to selection
              const currentIds = kernelStore.getState().selection.nodeIds;
              const mergedIds = [...new Set([...currentIds, ...selectedIds])];
              kernelStore.getState().selectNodes(mergedIds);
            }
          } else {
            // Normal click/drag: replace selection
            kernelStore.getState().selectNodes(selectedIds);
          }
        } else if (e.isClick) {
          // Click on empty area: clear selection
          kernelStore.getState().selectNode(null as any);
        }

        // If drag started on a selected element and ended immediately (click or preventDragFromInside),
        // trigger Moveable drag to allow dragging the selected elements
        if (e.isDragStartEnd && selectedIds.length > 0) {
          e.inputEvent?.preventDefault?.();

          setTimeout(() => {
            if (moveableRef.current && e.inputEvent) {
              moveableRef.current.dragStart(e.inputEvent);
            }
          });
        }
      });

      // Drag handling (use transform during drag for perf; commit left/top at end)
      moveableRef.current.on('dragStart', ({ target, inputEvent }) => {
        moveableRef.current?.updateRect();

        const nodeId = target.getAttribute('data-node-id');
        const selectedIds = (kernelStore.getState() as KernelState).selection.nodeIds;
        
        // If clicking on an unselected node without Ctrl/Meta, select it first
        // This enables single-node drag even when selectByClick is disabled
        if (nodeId && !selectedIds.includes(nodeId)) {
          const isModifierHeld = inputEvent?.ctrlKey || inputEvent?.metaKey;
          if (!isModifierHeld) {
            kernelStore.getState().selectNode(nodeId);
          }
        }
        
        // Re-read selection after potential update
        const currentSelectedIds = (kernelStore.getState() as KernelState).selection.nodeIds;
        const isMultiDrag = !!nodeId && currentSelectedIds.length > 1 && currentSelectedIds.includes(nodeId);

        const idsToInit = isMultiDrag ? currentSelectedIds : (nodeId ? [nodeId] : []);
        for (const id of idsToInit) {
          const node = (kernelStore.getState() as KernelState).nodesById[id];
          const schema = node?.schemaRef as any;
          if (schema?.position) {
            baseWorldPositionByIdRef.current[id] = { x: schema.position.x ?? 0, y: schema.position.y ?? 0 };
          }
          dragTranslateByIdRef.current[id] = { x: 0, y: 0 };

          // Reset transforms for all participating targets
          const el = container.querySelector(`[data-node-id="${id}"]`) as HTMLElement | null;
          if (el) {
            el.style.willChange = 'transform';
            el.style.transform = '';
          }
        }

        // Ensure current target is ready
        target.style.willChange = 'transform';
        target.style.transform = '';
      });

      moveableRef.current.on('drag', ({ target, beforeTranslate }) => {
        // Moveable is inside scaled wrapper, beforeTranslate is already in world coords
        const tx = beforeTranslate?.[0] ?? 0;
        const ty = beforeTranslate?.[1] ?? 0;

        const nodeId = target.getAttribute('data-node-id');
        const selectedIds = (kernelStore.getState() as KernelState).selection.nodeIds;
        const isMultiDrag = !!nodeId && selectedIds.length > 1 && selectedIds.includes(nodeId);

        if (isMultiDrag) {
          for (const id of selectedIds) {
            dragTranslateByIdRef.current[id] = { x: tx, y: ty };
            const el = container.querySelector(`[data-node-id="${id}"]`) as HTMLElement | null;
            if (el) el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
          }
          return;
        }

        if (nodeId) dragTranslateByIdRef.current[nodeId] = { x: tx, y: ty };
        target.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      });

      moveableRef.current.on('dragEnd', ({ target, isDrag, lastEvent }) => {
        const nodeId = target.getAttribute('data-node-id');
        const selectedIds = (kernelStore.getState() as KernelState).selection.nodeIds;
        const isMultiDrag = !!nodeId && selectedIds.length > 1 && selectedIds.includes(nodeId);

        if (!isDrag) {
          if (isMultiDrag) {
            for (const id of selectedIds) {
              const el = container.querySelector(`[data-node-id="${id}"]`) as HTMLElement | null;
              if (el) {
                el.style.willChange = '';
                el.style.transform = '';
              }
            }
          } else {
            target.style.willChange = '';
            target.style.transform = '';
          }
          return;
        }

        if (isMultiDrag) {
          // Commit all selected nodes using the same delta
          for (const id of selectedIds) {
            const el = container.querySelector(`[data-node-id="${id}"]`) as HTMLElement | null;
            if (el) el.style.willChange = '';

            const delta = dragTranslateByIdRef.current[id] ?? {
              x: (lastEvent as any)?.beforeTranslate?.[0] ?? 0,
              y: (lastEvent as any)?.beforeTranslate?.[1] ?? 0,
            };
            const baseWorld = baseWorldPositionByIdRef.current[id];
            const x = (baseWorld?.x ?? 0) + (delta.x ?? 0);
            const y = (baseWorld?.y ?? 0) + (delta.y ?? 0);

            if (el) {
              el.style.left = `${x}px`;
              el.style.top = `${y}px`;
              el.style.transform = '';
            }
            kernelStore.getState().updateNode(id, { position: { x, y } });
          }
          onUserEdit?.();
          return;
        }

        target.style.willChange = '';

        // Single target commit
        const dx = dragTranslateByIdRef.current[nodeId || '']?.x ?? (lastEvent as any)?.beforeTranslate?.[0] ?? 0;
        const dy = dragTranslateByIdRef.current[nodeId || '']?.y ?? (lastEvent as any)?.beforeTranslate?.[1] ?? 0;

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

      // Group drag handling for multi-selection
      moveableRef.current.on('dragGroupStart', ({ targets }) => {
        moveableRef.current?.updateRect();
        for (const t of targets) {
          const nodeId = t.getAttribute('data-node-id');
          if (!nodeId) continue;
          const node = (kernelStore.getState() as KernelState).nodesById[nodeId];
          const schema = node?.schemaRef as any;
          if (schema?.position) {
            baseWorldPositionByIdRef.current[nodeId] = { x: schema.position.x ?? 0, y: schema.position.y ?? 0 };
          }
          dragTranslateByIdRef.current[nodeId] = { x: 0, y: 0 };
          t.style.willChange = 'transform';
          t.style.transform = '';
        }
      });

      moveableRef.current.on('dragGroup', ({ events }) => {
        for (const ev of events as any[]) {
          const t = ev?.target as HTMLElement | undefined;
          if (!t) continue;
          const tx = ev?.beforeTranslate?.[0] ?? 0;
          const ty = ev?.beforeTranslate?.[1] ?? 0;
          const nodeId = t.getAttribute('data-node-id');
          if (nodeId) dragTranslateByIdRef.current[nodeId] = { x: tx, y: ty };
          t.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
        }
      });

      moveableRef.current.on('dragGroupEnd', ({ targets, isDrag }) => {
        for (const t of targets) {
          t.style.willChange = '';
          if (!isDrag) {
            t.style.transform = '';
            continue;
          }

          const nodeId = t.getAttribute('data-node-id');
          if (!nodeId) {
            t.style.transform = '';
            continue;
          }

          const delta = dragTranslateByIdRef.current[nodeId] ?? { x: 0, y: 0 };
          const baseWorld = baseWorldPositionByIdRef.current[nodeId];
          const x = (baseWorld?.x ?? 0) + (delta.x ?? 0);
          const y = (baseWorld?.y ?? 0) + (delta.y ?? 0);

          t.style.left = `${x}px`;
          t.style.top = `${y}px`;
          t.style.transform = '';

          kernelStore.getState().updateNode(nodeId, { position: { x, y } });
        }
        if (isDrag) onUserEdit?.();
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

      // Rotate handling
      moveableRef.current.on('rotate', ({ target, beforeRotate }) => {
        target.style.transform = `rotate(${beforeRotate}deg)`;
      });

      moveableRef.current.on('rotateEnd', ({ target, isDrag, lastEvent }) => {
        if (!isDrag) {
          target.style.transform = '';
          return;
        }

        const nodeId = target.getAttribute('data-node-id');
        const rotation = (lastEvent as any)?.beforeRotate ?? 0;

        // Keep the rotation in transform style
        target.style.transform = `rotate(${rotation}deg)`;

        if (nodeId) {
          // Store rotation in props._rotation since schema doesn't have rotation field in updateNode
          const node = (kernelStore.getState() as KernelState).nodesById[nodeId];
          const currentProps = (node?.schemaRef as any)?.props ?? {};
          kernelStore.getState().updateNode(nodeId, { 
            props: { ...currentProps, _rotation: rotation } 
          });
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
  }, [containerRef, dragContainerRef, kernelStore, enabled, getViewport]);

  // Update Moveable target when selection changes or nodes change (e.g. via undo/redo)
  useEffect(() => {
    if (!enabled) return;
    if (!moveableRef.current || !containerRef.current) return;
    
    const selectedIds = state.selection.nodeIds;
    console.log('[TransformControls] Selection changed', { selectedIds });
    
    // Only select nodes that actually exist in the current state and are not locked
    const validSelectedIds = selectedIds.filter(id => {
      const node = state.nodesById[id];
      return !!node && !node.locked;
    });
    
    const targets = validSelectedIds
      .map(id => containerRef.current?.querySelector(`[data-node-id="${id}"]`))
      .filter(Boolean) as HTMLElement[];

    console.log('[TransformControls] Targets found', {
      validSelectedIds,
      targetCount: targets.length,
      containerRef: !!containerRef.current,
    });

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


