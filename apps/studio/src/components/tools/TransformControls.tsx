import React, { useEffect, useRef, useCallback } from 'react';
import { useSyncExternalStore } from 'react';
import Moveable from 'moveable';
import Selecto from 'selecto';
import type { KernelStore, KernelState } from '@thingsvis/kernel';
import { getResolvedWidget } from '@/lib/registry/componentLoader';
import { resolveCanvasDragCommit, shouldCommitCanvasDrag } from '@/lib/canvasInteraction';

function isLineNodeType(type: string | undefined): boolean {
  return type === 'basic/line';
}

function isPipeNodeType(type: string | undefined): boolean {
  return type === 'industrial/pipe';
}

function isConnectorNodeType(type: string | undefined): boolean {
  return isLineNodeType(type) || isPipeNodeType(type);
}

/** Grid layout handlers from useGridLayout hook */
type GridLayoutHandlers = {
  colWidth: number;
  effectiveCols: number;
  onDragStart: (nodeId: string, pixelPos: { x: number; y: number }) => void;
  onDragMove: (pixelPos: { x: number; y: number }) => void;
  onDragEnd: () => void;
  onResizeStart: (nodeId: string, handle: any) => void;
  onResizeMove: (pixelDelta: { dx: number; dy: number }) => void;
  onResizeEnd: () => void;
  getGridPosition: (nodeId: string) => { x: number; y: number; w: number; h: number } | null;
  getPixelRect: (gridPos: any) => { x: number; y: number; width: number; height: number } | null;
  snapPixelToGrid: (pixel: { x: number; y: number }) => { x: number; y: number };
};

type Props = {
  containerRef: React.RefObject<HTMLElement>;
  dragContainerRef?: React.RefObject<HTMLElement>; // Container for Selecto drag area (box selection)
  kernelStore: KernelStore;
  enabled?: boolean;
  onUserEdit?: () => void;
  getViewport?: () => {
    width: number;
    height: number;
    zoom: number;
    offsetX: number;
    offsetY: number;
  };
  zoom?: number; // Current viewport zoom - triggers re-render when changed
  isGridMode?: boolean; // Whether grid layout mode is active
  gridLayout?: GridLayoutHandlers; // Grid layout handlers from useGridLayout hook
};

export default function TransformControls({
  containerRef,
  dragContainerRef,
  kernelStore,
  enabled = true,
  onUserEdit,
  getViewport,
  zoom = 1,
  isGridMode = false,
  gridLayout: _gridLayout,
}: Props) {
  const moveableRef = useRef<Moveable | null>(null);
  const selectoRef = useRef<Selecto | null>(null);

  const baseWorldPositionByIdRef = useRef<Record<string, { x: number; y: number }>>({});
  const baseWorldSizeByIdRef = useRef<Record<string, { width: number; height: number }>>({});
  const dragTranslateByIdRef = useRef<Record<string, { x: number; y: number }>>({});
  const lastKnownZoomRef = useRef<number>(1);
  const viewportPollTimerRef = useRef<number | null>(null);
  /** Per-node widget size constraints (populated in resizeStart) */
  const nodeConstraintsRef = useRef<
    Record<
      string,
      {
        minWidth?: number;
        minHeight?: number;
        maxWidth?: number;
        maxHeight?: number;
        aspectRatio?: number;
      }
    >
  >({});

  // Ref to access latest isGridMode inside Moveable closures
  // (the useEffect that sets up Moveable does NOT re-run when isGridMode changes)
  const isGridModeRef = useRef(isGridMode);
  isGridModeRef.current = isGridMode;

  const state = useSyncExternalStore(
    useCallback((subscribe) => kernelStore.subscribe(subscribe), [kernelStore]),
    () => kernelStore.getState() as KernelState,
  );

  // Update Moveable when viewport zoom changes
  useEffect(() => {
    if (!moveableRef.current) return;
    const z = zoom && zoom > 0 ? zoom : 1;
    lastKnownZoomRef.current = z;
    // Just update rect - Moveable will re-read target positions via getBoundingClientRect
    moveableRef.current.updateRect();
  }, [zoom]);

  // Sync grid snap settings from kernel to Moveable
  useEffect(() => {
    if (!moveableRef.current) return;

    if (isGridMode) {
      const gridState = state.gridState;
      const settings = gridState.settings;
      if (settings && gridState.effectiveCols > 0) {
        moveableRef.current.snappable = true;
        const cols = gridState.effectiveCols;
        const containerWidth = gridState.containerWidth;
        const gap = settings.gap ?? 10;
        const colWidth = (containerWidth - (cols - 1) * gap) / cols;
        moveableRef.current.snapGridWidth = colWidth + gap;
        moveableRef.current.snapGridHeight = settings.rowHeight + gap;
      } else {
        moveableRef.current.snappable = false;
        moveableRef.current.snapGridWidth = 0;
        moveableRef.current.snapGridHeight = 0;
      }
    } else {
      // Fixed/infinite mode: enable smart element alignment guidelines
      const isGridEnabled = (state.canvas as any)?.gridEnabled ?? false;
      const gridSize = (state.canvas as any)?.gridSize ?? 20;

      moveableRef.current.snappable = true;
      moveableRef.current.elementGuidelines = ['.node-proxy-target'];
      moveableRef.current.snapDirections = {
        top: true,
        left: true,
        bottom: true,
        right: true,
        center: true,
        middle: true,
      };
      moveableRef.current.elementSnapDirections = {
        top: true,
        left: true,
        bottom: true,
        right: true,
        center: true,
        middle: true,
      };

      // Pixel-grid snapping (optional, only when grid is enabled in canvas settings)
      if (isGridEnabled) {
        moveableRef.current.snapGridWidth = gridSize;
        moveableRef.current.snapGridHeight = gridSize;
      } else {
        moveableRef.current.snapGridWidth = 0;
        moveableRef.current.snapGridHeight = 0;
      }
    }
  }, [isGridMode, state.gridState, state.canvas]);

  useEffect(() => {
    if (!enabled) {
      try {
        moveableRef.current?.destroy();
      } catch (e) {
        // eslint-disable-next-line no-console
      }
      try {
        selectoRef.current?.destroy();
      } catch (e) {
        // eslint-disable-next-line no-console
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

    try {
      // Use dragContainer (outer, unscaled) for Moveable to match Selecto's coordinate system
      const dragContainer = dragContainerRef?.current || container;

      moveableRef.current = new Moveable(dragContainer, {
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

        // Snapping: always enabled. In grid mode snap to grid cells; in fixed/infinite mode use element guidelines.
        snappable: true,
        snapGridWidth: 0,
        snapGridHeight: 0,
        snapThreshold: 5,
        elementGuidelines: isGridMode ? [] : ['.node-proxy-target'],
        snapDirections: {
          top: true,
          left: true,
          bottom: true,
          right: true,
          center: true,
          middle: true,
        },
        elementSnapDirections: isGridMode
          ? {}
          : {
              top: true,
              left: true,
              bottom: true,
              right: true,
              center: true,
              middle: true,
            },
        isDisplaySnapDigit: false,
        isDisplayInnerSnapDigit: false,
      });

      selectoRef.current = new Selecto({
        container: dragContainer,
        dragContainer,
        selectableTargets: ['.node-proxy-target'],
        hitRate: 0,
        selectByClick: true,
        selectFromInside: false,
        toggleContinueSelect: ['shift', 'ctrl', 'meta'], // Support Ctrl/Shift/Meta for additive selection
        ratio: 0,
        // Don't use getElementRect - let Selecto use default getBoundingClientRect
        // which works correctly with our transformed container
      });

      // Selecto dragStart - stop if clicking on Moveable element or selected target
      selectoRef.current.on('dragStart', (e) => {
        if ((window as any)._connectionToolActive) {
          e.stop();
          return;
        }

        const inputEvent = e.inputEvent;
        const target = inputEvent.target as HTMLElement;

        // Check if clicking on a Moveable control element
        if (moveableRef.current?.isMoveableElement(target)) {
          e.stop();
          return;
        }

        // Check if clicking on an already selected target
        const selectedTargets = (kernelStore.getState() as KernelState).selection.nodeIds
          .map((id) => dragContainer.querySelector(`[data-node-id="${id}"]`))
          .filter(Boolean) as HTMLElement[];

        if (selectedTargets.some((t) => t === target || t.contains(target))) {
          e.stop();

          // Trigger Moveable drag since we're clicking on a selected target
          // Use setTimeout to ensure the event is processed after Selecto stops
          setTimeout(() => {
            if (moveableRef.current && inputEvent) {
              moveableRef.current.dragStart(inputEvent);
            }
          }, 0);
          return;
        }
      });

      // Real-time selection feedback during box selection drag
      selectoRef.current.on('select', (e) => {
        // Update visual feedback for elements during box selection
        // Add "selecting" class for real-time visual feedback
        e.added.forEach((el) => {
          el.classList.add('selecting');
        });
        e.removed.forEach((el) => {
          el.classList.remove('selecting');
        });
      });

      // Selection handling - use selectEnd for final selection state
      selectoRef.current.on('selectEnd', (e) => {
        // Clean up "selecting" class
        e.selected.forEach((el) => {
          el.classList.remove('selecting');
        });

        const getId = (el: Element | null | undefined) =>
          el?.getAttribute?.('data-node-id') || null;
        const selectedIds = e.selected.map(getId).filter((id): id is string => id !== null);
        const inputEvent = e.inputEvent as MouseEvent | undefined;
        const isAdditive = inputEvent?.ctrlKey || inputEvent?.metaKey || inputEvent?.shiftKey;

        if (selectedIds.length > 0) {
          if (isAdditive) {
            // Ctrl/Shift + click: toggle selection for single node
            if (e.isClick && selectedIds.length === 1) {
              const nodeId = selectedIds[0]!;
              const currentIds = kernelStore.getState().selection.nodeIds;
              if (currentIds.includes(nodeId)) {
                // Remove from selection
                kernelStore.getState().selectNodes(currentIds.filter((id) => id !== nodeId));
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
        const isMultiDrag =
          !!nodeId && currentSelectedIds.length > 1 && currentSelectedIds.includes(nodeId);

        const idsToInit = isMultiDrag ? currentSelectedIds : nodeId ? [nodeId] : [];
        for (const id of idsToInit) {
          const node = (kernelStore.getState() as KernelState).nodesById[id];
          const schema = node?.schemaRef as any;
          if (schema?.position) {
            baseWorldPositionByIdRef.current[id] = {
              x: schema.position.x ?? 0,
              y: schema.position.y ?? 0,
            };
          }
          dragTranslateByIdRef.current[id] = { x: 0, y: 0 };

          // Reset transforms for all participating targets
          const el = dragContainer.querySelector(`[data-node-id="${id}"]`) as HTMLElement | null;
          if (el) {
            el.style.willChange = 'transform';
            el.style.transform = '';
          }

          // Save overlay's original zIndex and rotation, then elevate zIndex for drag visibility
          const overlayEl = findOverlayElement(id);
          if (overlayEl) {
            originalOverlayZIndexRef[id] = overlayEl.style.zIndex || '';
            const existingTransform = overlayEl.style.transform || '';
            const rotationMatch = existingTransform.match(/rotate\([^)]+\)/);
            overlayRotationRef[id] = rotationMatch ? rotationMatch[0] : '';
            // Elevate overlay above proxy-layer (zIndex: 20) during drag
            overlayEl.style.zIndex = '1000';
          }
        }

        // Ensure current target is ready
        target.style.willChange = 'transform';
        target.style.transform = '';
      });

      const emitNodeDragPreview = (
        nodeId: string | null | undefined,
        x: number,
        y: number,
        active: boolean,
      ) => {
        if (!nodeId) return;
        window.dispatchEvent(
          new CustomEvent('thingsvis:node-drag-preview', {
            detail: { nodeId, x, y, active },
          }),
        );
      };

      // Helper to find overlay element for a node ID
      // The overlay is rendered by VisualEngine inside #visual-engine-mount's overlay div
      const findOverlayElement = (nodeId: string): HTMLElement | null => {
        // Search upward from container to find the root, then search for overlay
        // The overlay container is inside #visual-engine-mount which is a sibling of our container hierarchy
        const rootContainer = container.closest('[style*="position: relative"]');
        if (!rootContainer) {
          // Fallback: search from document
          return document.querySelector(`[data-overlay-node-id="${nodeId}"]`) as HTMLElement | null;
        }
        return rootContainer.querySelector(
          `[data-overlay-node-id="${nodeId}"]`,
        ) as HTMLElement | null;
      };

      // Store original overlay zIndex values to restore after drag
      const originalOverlayZIndexRef: Record<string, string> = {};
      // Track overlay rotation to preserve during drag
      const overlayRotationRef: Record<string, string> = {};

      moveableRef.current.on('drag', ({ target, transform, beforeTranslate }) => {
        // Apply transform directly to the target for real-time visual feedback
        target.style.transform = transform;

        // Track translation for commit on dragEnd
        const tx = beforeTranslate?.[0] ?? 0;
        const ty = beforeTranslate?.[1] ?? 0;

        const nodeId = target.getAttribute('data-node-id');
        const selectedIds = (kernelStore.getState() as KernelState).selection.nodeIds;
        const isMultiDrag = !!nodeId && selectedIds.length > 1 && selectedIds.includes(nodeId);

        if (isMultiDrag) {
          for (const id of selectedIds) {
            dragTranslateByIdRef.current[id] = { x: tx, y: ty };
            emitNodeDragPreview(id, tx, ty, true);
            // Use dragContainer to find elements since that's where Moveable is mounted
            const el = dragContainer.querySelector(`[data-node-id="${id}"]`) as HTMLElement | null;
            if (el && el !== target) {
              el.style.transform = `translate(${tx}px, ${ty}px)`;
            }
            // Also update the visual overlay element for real-time visual feedback
            const overlayEl = findOverlayElement(id);
            if (overlayEl) {
              // Use saved rotation from dragStart
              const rotation = overlayRotationRef[id] || '';
              overlayEl.style.transform = `translate(${tx}px, ${ty}px)${rotation ? ' ' + rotation : ''}`;
            }
          }
          return;
        }

        if (nodeId) {
          dragTranslateByIdRef.current[nodeId] = { x: tx, y: ty };
          emitNodeDragPreview(nodeId, tx, ty, true);
          // Also update the visual overlay element for real-time visual feedback
          const overlayEl = findOverlayElement(nodeId);
          if (overlayEl) {
            // Use saved rotation from dragStart
            const rotation = overlayRotationRef[nodeId] || '';
            overlayEl.style.transform = `translate(${tx}px, ${ty}px)${rotation ? ' ' + rotation : ''}`;
          }
        }
      });

      moveableRef.current.on('dragEnd', ({ target, isDrag, lastEvent }) => {
        const nodeId = target.getAttribute('data-node-id');
        const selectedIds = (kernelStore.getState() as KernelState).selection.nodeIds;
        const isMultiDrag = !!nodeId && selectedIds.length > 1 && selectedIds.includes(nodeId);

        if (!isDrag) {
          if (isMultiDrag) {
            for (const id of selectedIds) {
              emitNodeDragPreview(id, 0, 0, false);
              const el = dragContainer.querySelector(
                `[data-node-id="${id}"]`,
              ) as HTMLElement | null;
              if (el) {
                el.style.willChange = '';
                el.style.transform = '';
              }
              // Clear overlay transform and restore zIndex
              const overlayEl = findOverlayElement(id);
              if (overlayEl) {
                const rotation = overlayRotationRef[id] || '';
                overlayEl.style.transform = rotation;
                overlayEl.style.zIndex = originalOverlayZIndexRef[id] || '';
                delete originalOverlayZIndexRef[id];
                delete overlayRotationRef[id];
              }
            }
          } else {
            emitNodeDragPreview(nodeId, 0, 0, false);
            target.style.willChange = '';
            target.style.transform = '';
            // Clear overlay transform and restore zIndex for single node
            if (nodeId) {
              const overlayEl = findOverlayElement(nodeId);
              if (overlayEl) {
                const rotation = overlayRotationRef[nodeId] || '';
                overlayEl.style.transform = rotation;
                overlayEl.style.zIndex = originalOverlayZIndexRef[nodeId] || '';
                delete originalOverlayZIndexRef[nodeId];
                delete overlayRotationRef[nodeId];
              }
            }
          }
          return;
        }

        if (isMultiDrag) {
          // Commit all selected nodes using the same delta
          let didCommit = false;
          for (const id of selectedIds) {
            const el = dragContainer.querySelector(`[data-node-id="${id}"]`) as HTMLElement | null;
            if (el) el.style.willChange = '';

            const delta = dragTranslateByIdRef.current[id] ?? {
              x: (lastEvent as any)?.beforeTranslate?.[0] ?? 0,
              y: (lastEvent as any)?.beforeTranslate?.[1] ?? 0,
            };
            if (!shouldCommitCanvasDrag(delta)) {
              emitNodeDragPreview(id, 0, 0, false);
              if (el) {
                el.style.transform = '';
              }
              const overlayEl = findOverlayElement(id);
              if (overlayEl) {
                const rotation = overlayRotationRef[id] || '';
                overlayEl.style.transform = rotation;
                overlayEl.style.zIndex = originalOverlayZIndexRef[id] || '';
                delete originalOverlayZIndexRef[id];
                delete overlayRotationRef[id];
              }
              continue;
            }
            const baseWorld = baseWorldPositionByIdRef.current[id] ?? { x: 0, y: 0 };
            const committedPosition = resolveCanvasDragCommit(baseWorld, delta);
            if (!committedPosition) {
              continue;
            }
            const { x, y } = committedPosition;

            if (el) {
              // Write the final committed position immediately so React reconciler
              // sees matching values on next render and skips the DOM write (no flash).
              if (isGridModeRef.current && baseWorld) {
                el.style.left = `${baseWorld.x}px`;
                el.style.top = `${baseWorld.y}px`;
              } else {
                el.style.left = `${x}px`;
                el.style.top = `${y}px`;
              }
              el.style.transform = '';
            }
            // Clear overlay transform and restore zIndex - store update will reposition it
            const overlayEl = findOverlayElement(id);
            if (overlayEl) {
              overlayEl.style.transform = '';
              overlayEl.style.zIndex = originalOverlayZIndexRef[id] || '';
              delete originalOverlayZIndexRef[id];
              delete overlayRotationRef[id];
            }
            kernelStore.getState().updateNode(id, { position: { x, y } });
            didCommit = true;
          }
          if (didCommit) onUserEdit?.();
          return;
        }

        target.style.willChange = '';

        // Single target commit
        const dx =
          dragTranslateByIdRef.current[nodeId || '']?.x ??
          (lastEvent as any)?.beforeTranslate?.[0] ??
          0;
        const dy =
          dragTranslateByIdRef.current[nodeId || '']?.y ??
          (lastEvent as any)?.beforeTranslate?.[1] ??
          0;
        if (!shouldCommitCanvasDrag({ x: dx, y: dy })) {
          emitNodeDragPreview(nodeId, 0, 0, false);
          target.style.transform = '';
          if (nodeId) {
            const overlayEl = findOverlayElement(nodeId);
            if (overlayEl) {
              const rotation = overlayRotationRef[nodeId] || '';
              overlayEl.style.transform = rotation;
              overlayEl.style.zIndex = originalOverlayZIndexRef[nodeId] || '';
              delete originalOverlayZIndexRef[nodeId];
              delete overlayRotationRef[nodeId];
            }
          }
          return;
        }

        const fallbackPosition = {
          x: parseFloat(target.style.left || '0') || 0,
          y: parseFloat(target.style.top || '0') || 0,
        };
        const baseWorld = nodeId ? baseWorldPositionByIdRef.current[nodeId] : null;
        const committedPosition = resolveCanvasDragCommit(baseWorld ?? fallbackPosition, {
          x: dx,
          y: dy,
        });
        if (!committedPosition) {
          return;
        }
        const { x, y } = committedPosition;

        // Write the committed position BEFORE clearing transform.
        // React reconciler will find left/top already at the correct value
        // and skip the DOM write, preventing any 1-frame flash.
        if (isGridModeRef.current && baseWorld) {
          target.style.left = `${baseWorld.x}px`;
          target.style.top = `${baseWorld.y}px`;
        } else {
          target.style.left = `${x}px`;
          target.style.top = `${y}px`;
        }
        target.style.transform = '';

        // Clear overlay transform and restore zIndex - store update will reposition it
        if (nodeId) {
          emitNodeDragPreview(nodeId, 0, 0, false);
          const overlayEl = findOverlayElement(nodeId);
          if (overlayEl) {
            overlayEl.style.transform = '';
            overlayEl.style.zIndex = originalOverlayZIndexRef[nodeId] || '';
            delete originalOverlayZIndexRef[nodeId];
            delete overlayRotationRef[nodeId];
          }

          // Grid mode: convert pixel coords to grid coords and use grid-aware action
          if (isGridModeRef.current) {
            const gridState = (kernelStore.getState() as KernelState).gridState;
            const settings = gridState.settings;
            if (settings) {
              const cols = gridState.effectiveCols;
              const containerWidth = gridState.containerWidth;
              const colWidth = (containerWidth - (cols - 1) * settings.gap) / cols;
              const cellWidth = colWidth + settings.gap;
              const cellHeight = settings.rowHeight + settings.gap;

              const gridX = Math.max(0, Math.min(cols - 1, Math.round(x / cellWidth)));
              const gridY = Math.max(0, Math.round(y / cellHeight));

              kernelStore.getState().moveGridItemWithPosition(nodeId, { x: gridX, y: gridY });
            }
          } else {
            kernelStore.getState().updateNode(nodeId, { position: { x, y } });
          }
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
            baseWorldPositionByIdRef.current[nodeId] = {
              x: schema.position.x ?? 0,
              y: schema.position.y ?? 0,
            };
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
          if (nodeId) {
            dragTranslateByIdRef.current[nodeId] = { x: tx, y: ty };
            emitNodeDragPreview(nodeId, tx, ty, true);
            // Also update the visual overlay element for real-time visual feedback
            const overlayEl = findOverlayElement(nodeId);
            if (overlayEl) {
              overlayEl.style.transform = `translate(${tx}px, ${ty}px)`;
            }
          }
          t.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
        }
      });

      moveableRef.current.on('dragGroupEnd', ({ targets, isDrag }) => {
        let didCommit = false;
        for (const t of targets) {
          t.style.willChange = '';
          const nodeId = t.getAttribute('data-node-id');

          if (!isDrag) {
            t.style.transform = '';
            // Clear overlay transform too
            if (nodeId) {
              emitNodeDragPreview(nodeId, 0, 0, false);
              const overlayEl = findOverlayElement(nodeId);
              if (overlayEl) {
                overlayEl.style.transform = '';
              }
            }
            continue;
          }

          if (!nodeId) {
            t.style.transform = '';
            continue;
          }

          const delta = dragTranslateByIdRef.current[nodeId] ?? { x: 0, y: 0 };
          if (!shouldCommitCanvasDrag(delta)) {
            t.style.transform = '';
            emitNodeDragPreview(nodeId, 0, 0, false);
            const overlayEl = findOverlayElement(nodeId);
            if (overlayEl) {
              overlayEl.style.transform = '';
            }
            continue;
          }
          const baseWorld = baseWorldPositionByIdRef.current[nodeId] ?? { x: 0, y: 0 };
          const committedPosition = resolveCanvasDragCommit(baseWorld, delta);
          if (!committedPosition) {
            continue;
          }
          const { x, y } = committedPosition;

          // Write the committed position BEFORE clearing transform to prevent flash.
          if (isGridModeRef.current && baseWorld) {
            t.style.left = `${baseWorld.x}px`;
            t.style.top = `${baseWorld.y}px`;
          } else {
            t.style.left = `${x}px`;
            t.style.top = `${y}px`;
          }
          t.style.transform = '';
          // Clear overlay transform - store update will reposition it
          emitNodeDragPreview(nodeId, 0, 0, false);
          const overlayEl = findOverlayElement(nodeId);
          if (overlayEl) {
            overlayEl.style.transform = '';
          }

          kernelStore.getState().updateNode(nodeId, { position: { x, y } });
          didCommit = true;
        }
        if (didCommit) onUserEdit?.();
      });

      // Resize handling (use transform during resize drag)
      moveableRef.current.on('resizeStart', ({ target }) => {
        moveableRef.current?.updateRect();

        const nodeId = target.getAttribute('data-node-id');
        if (nodeId) {
          const node = (kernelStore.getState() as KernelState).nodesById[nodeId];
          const schema = node?.schemaRef as any;
          if (schema?.position) {
            baseWorldPositionByIdRef.current[nodeId] = {
              x: schema.position.x ?? 0,
              y: schema.position.y ?? 0,
            };
          }
          if (schema?.size) {
            baseWorldSizeByIdRef.current[nodeId] = {
              width: schema.size.width ?? 0,
              height: schema.size.height ?? 0,
            };
          }
          // Read widget constraints from resolved cache
          const widgetType = schema?.type as string | undefined;
          if (widgetType) {
            const widget = getResolvedWidget(widgetType);
            nodeConstraintsRef.current[nodeId] = (widget as any)?.constraints ?? {};
          }
        }

        target.style.willChange = 'transform,width,height';
        target.style.transform = '';
      });

      moveableRef.current.on('resize', ({ target, width, height, drag }) => {
        // Moveable is inside scaled wrapper, width/height are already in world coords
        // Apply widget constraints
        const nodeId = target.getAttribute('data-node-id');
        const constraints = nodeId ? (nodeConstraintsRef.current[nodeId] ?? {}) : {};
        let w = width;
        let h = height;
        if (constraints.minWidth != null) w = Math.max(w, constraints.minWidth);
        if (constraints.minHeight != null) h = Math.max(h, constraints.minHeight);
        if (constraints.maxWidth != null) w = Math.min(w, constraints.maxWidth);
        if (constraints.maxHeight != null) h = Math.min(h, constraints.maxHeight);
        if (constraints.aspectRatio != null) {
          // Lock aspect ratio: adjust height based on clamped width
          h = Math.round(w / constraints.aspectRatio);
        }
        target.style.width = `${w}px`;
        target.style.height = `${h}px`;
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
        const baseWorld = nodeId ? baseWorldPositionByIdRef.current[nodeId] : null;
        const dx = (lastEvent as any)?.drag?.beforeTranslate?.[0] ?? 0;
        const dy = (lastEvent as any)?.drag?.beforeTranslate?.[1] ?? 0;

        const x = (baseWorld?.x ?? (parseFloat(target.style.left || '0') || 0)) + dx;
        const y = (baseWorld?.y ?? (parseFloat(target.style.top || '0') || 0)) + dy;

        // Write the committed position BEFORE clearing transform to prevent flash.
        if (isGridModeRef.current && baseWorld) {
          target.style.left = `${baseWorld.x}px`;
          target.style.top = `${baseWorld.y}px`;
        } else {
          target.style.left = `${x}px`;
          target.style.top = `${y}px`;
        }
        target.style.transform = '';

        if (nodeId) {
          let width = parseFloat(target.style.width || '0') || 0;
          let height = parseFloat(target.style.height || '0') || 0;

          const baseSize = baseWorldSizeByIdRef.current[nodeId];
          if (baseSize) {
            target.style.width = `${baseSize.width}px`;
            target.style.height = `${baseSize.height}px`;
          } else {
            target.style.width = '';
            target.style.height = '';
          }

          // Clamp to widget constraints one final time
          const constraints = nodeConstraintsRef.current[nodeId] ?? {};
          if (constraints.minWidth != null) width = Math.max(width, constraints.minWidth);
          if (constraints.minHeight != null) height = Math.max(height, constraints.minHeight);
          if (constraints.maxWidth != null) width = Math.min(width, constraints.maxWidth);
          if (constraints.maxHeight != null) height = Math.min(height, constraints.maxHeight);

          // Grid mode: convert pixel coords to grid coords and use grid-aware action
          if (isGridModeRef.current) {
            const gridState = (kernelStore.getState() as KernelState).gridState;
            const settings = gridState.settings;
            if (settings) {
              const cols = gridState.effectiveCols;
              const containerWidth = gridState.containerWidth;
              const colWidth = (containerWidth - (cols - 1) * settings.gap) / cols;
              const cellWidth = colWidth + settings.gap;
              const cellHeight = settings.rowHeight + settings.gap;

              const gridX = Math.max(0, Math.round(x / cellWidth));
              const gridY = Math.max(0, Math.round(y / cellHeight));

              // Convert size to grid units
              const gridW = Math.max(1, Math.round((width + settings.gap) / cellWidth));
              const gridH = Math.max(1, Math.round((height + settings.gap) / cellHeight));

              // Use the position+size aware grid action that syncs schema.position
              kernelStore.getState().resizeGridItemWithPosition(nodeId, { w: gridW, h: gridH });
              kernelStore.getState().moveGridItemWithPosition(nodeId, { x: gridX, y: gridY });
            }
          } else {
            kernelStore
              .getState()
              .updateNode(nodeId, { position: { x, y }, size: { width, height } });
          }
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
            props: { ...currentProps, _rotation: rotation },
          });
          onUserEdit?.();
        }
      });

      // After Moveable is fully initialized, set current selection targets immediately
      // This handles the case where selection was set before Moveable was ready
      const currentSelectedIds = (kernelStore.getState() as KernelState).selection.nodeIds;
      if (currentSelectedIds.length > 0) {
        const initialTargets = currentSelectedIds
          .map((id) => dragContainer.querySelector(`[data-node-id="${id}"]`))
          .filter(Boolean) as HTMLElement[];
        if (initialTargets.length > 0) {
          moveableRef.current.target = initialTargets;
          moveableRef.current.updateRect();
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
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
      }
      try {
        selectoRef.current?.destroy();
      } catch (e) {
        // eslint-disable-next-line no-console
      }
      moveableRef.current = null;
      selectoRef.current = null;
    };
  }, [containerRef, dragContainerRef, kernelStore, enabled, getViewport]);

  // Update Moveable target when selection changes or nodes change (e.g. via undo/redo)
  useEffect(() => {
    const clearConnectorMoveableClass = () => {
      (dragContainerRef?.current || containerRef.current)?.classList.remove(
        'connector-moveable-minimal',
      );
    };

    if (!enabled) {
      clearConnectorMoveableClass();
      return;
    }
    if (!moveableRef.current) return;

    // Use dragContainerRef since Moveable is mounted there, fallback to containerRef
    const queryContainer = dragContainerRef?.current || containerRef.current;
    if (!queryContainer) return;

    const selectedIds = state.selection.nodeIds;

    // Function to update Moveable targets
    const updateTargets = () => {
      if (!moveableRef.current) {
        return;
      }

      // Only select nodes that actually exist in the current state and are not locked
      const validSelectedIds = selectedIds.filter((id) => {
        const node = state.nodesById[id];
        return !!node && !node.locked;
      });

      // Connectors need Moveable as drag target (proxy hit area); resize/rotate stay off when any
      // connector is selected. Endpoint handles still win via stopImmediatePropagation on the overlay.
      const moveableTargetIds = validSelectedIds;

      const anyConnectorSelected = validSelectedIds.some((id) =>
        isConnectorNodeType(state.nodesById[id]?.schemaRef?.type),
      );
      const onlyConnectorsSelected =
        validSelectedIds.length > 0 &&
        validSelectedIds.every((id) => isConnectorNodeType(state.nodesById[id]?.schemaRef?.type));

      queryContainer.classList.toggle('connector-moveable-minimal', onlyConnectorsSelected);

      const targets = moveableTargetIds
        .map((id) => queryContainer.querySelector(`[data-node-id="${id}"]`))
        .filter(Boolean) as HTMLElement[];

      const anyNonResizableSelected = validSelectedIds.some((id) => {
        const node = state.nodesById[id];
        const widgetType = (node?.schemaRef as any)?.type;
        if (!widgetType) return false;

        const widget = getResolvedWidget(widgetType);
        return (widget as any)?.resizable === false;
      });

      // Disable transforms for locked nodes and non-resizable widgets
      const hasLockedSelection = selectedIds.some((id) => state.nodesById[id]?.locked);

      moveableRef.current.draggable = !hasLockedSelection && moveableTargetIds.length > 0;
      moveableRef.current.resizable =
        !hasLockedSelection &&
        !anyNonResizableSelected &&
        moveableTargetIds.length > 0 &&
        !anyConnectorSelected;
      moveableRef.current.rotatable =
        !hasLockedSelection &&
        !anyNonResizableSelected &&
        moveableTargetIds.length > 0 &&
        !anyConnectorSelected;
      moveableRef.current.pinchable =
        !hasLockedSelection &&
        !anyNonResizableSelected &&
        moveableTargetIds.length > 0 &&
        !anyConnectorSelected;

      moveableRef.current.target = targets;

      // Dynamically update guidelines to include all unselected components
      const allProxyTargets = Array.from(queryContainer.querySelectorAll('.node-proxy-target'));
      const guidelines = allProxyTargets.filter((el) => !targets.includes(el as HTMLElement));
      moveableRef.current.elementGuidelines = guidelines;

      // If we expected targets but found none, the DOM might not be ready yet
      // Schedule a retry after the next paint
      if (moveableTargetIds.length > 0 && targets.length === 0) {
        requestAnimationFrame(() => {
          if (!moveableRef.current) return;
          const retryTargets = moveableTargetIds
            .map((id) => queryContainer.querySelector(`[data-node-id="${id}"]`))
            .filter(Boolean) as HTMLElement[];
          if (retryTargets.length > 0) {
            moveableRef.current.target = retryTargets;
            moveableRef.current.updateRect();
          }
        });
      }

      return targets;
    };

    const targets = updateTargets();

    // Recalculate the position of the handles to match the DOM elements.
    // This is crucial when nodes are moved/restored via Undo/Redo.
    if (targets && targets.length > 0) {
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

    return () => {
      clearConnectorMoveableClass();
    };
  }, [
    state.selection.nodeIds,
    state.nodesById,
    containerRef,
    dragContainerRef,
    enabled,
    getViewport,
  ]);

  return null;
}
