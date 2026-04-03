/**
 * LineConnectionTool
 *
 * Pure overlay for connector editing. Renders endpoint handles and drag previews
 * above the proxy layer (absolute inset-0 within the canvas container, same coords as worldToScreen).
 *
 * Key design decisions:
 *   1. Never fights Moveable — endpoint handles intercept pointerdown with
 *      stopImmediatePropagation so Moveable never sees the event.
 *   2. All drag state lives in useRef (not useState) for per-frame performance.
 *   3. Document-level mousemove/mouseup during drag so cursor tracking works
 *      even when the mouse leaves the handle element.
 *   4. Anchor detection uses the same geometry module as the widget renderer,
 *      guaranteeing handle positions and line endpoints stay in sync.
 *   5. No selection box — feedback is purely through handle appearance and
 *      the drag-line preview.
 *
 * IMPORTANT: All hooks must be called unconditionally. Conditional returns come
 * after the hooks section.
 */

import React, { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import type { KernelStore, KernelState } from '@thingsvis/kernel';
import { detectNodeAndAnchor, PortOverlay, type HoverAnchor, type Viewport } from './PortOverlay';
import {
  getAnchorWorld,
  nodeToLayout,
  buildOrthogonalRoute,
  type AnchorId,
  type Pt,
} from '../../lib/canvas/nodeLayoutTransform';

type Props = {
  kernelStore: KernelStore;
  getViewport: () => Viewport;
  onUserEdit?: () => void;
  /** Ref to the canvas container (containerRef from CanvasView).
   *  Required for accurate clientX/Y → world coordinate conversion
   *  when the canvas is not at viewport origin (e.g. sidebar/header present). */
  containerRef?: React.RefObject<HTMLElement | null>;
};

type Endpoint = 'start' | 'end';

type DragState = {
  lineId: string;
  endpoint: Endpoint;
  startWorld: Pt;
  currentWorld: Pt;
  targetHover: HoverAnchor | null;
};

export default function LineConnectionTool({
  kernelStore,
  getViewport,
  onUserEdit,
  containerRef,
}: Props) {
  // ── All hooks MUST come before any conditional returns ────────────────────

  const state = useSyncExternalStore(
    useCallback((cb) => kernelStore.subscribe(cb), [kernelStore]),
    () => kernelStore.getState() as KernelState,
  );

  const dragRef = useRef<DragState | null>(null);
  const hoveredAnchorRef = useRef<HoverAnchor | null>(null);
  const isDraggingRef = useRef(false);
  const [, forceRender] = React.useState(0);
  const rerender = useCallback(() => forceRender((n) => n + 1), []);

  // ── Derived values (after hooks) ───────────────────────────────────────────
  const selectedLineIds = state.selection.nodeIds.filter(
    (id) => (state.nodesById[id]?.schemaRef as any)?.type === 'basic/line',
  );
  const selectedLineId = selectedLineIds.length === 1 ? selectedLineIds[0] : null;
  const selectedLine = selectedLineId ? state.nodesById[selectedLineId] : null;
  const viewport = getViewport();

  // ── Coordinate helpers ────────────────────────────────────────────────────
  const worldToScreen = useCallback(
    (wx: number, wy: number) => {
      const vp = viewport;
      return { x: wx * vp.zoom + vp.offsetX, y: wy * vp.zoom + vp.offsetY };
    },
    [viewport],
  );

  const screenToWorld = useCallback(
    (sx: number, sy: number) => {
      const vp = viewport;
      // When a containerRef is provided, subtract its viewport offset
      // so that clientX/Y (viewport-relative) are converted to container-local first.
      const containerRect = containerRef?.current?.getBoundingClientRect();
      const left = containerRect?.left ?? 0;
      const top = containerRect?.top ?? 0;
      return { x: (sx - left - vp.offsetX) / vp.zoom, y: (sy - top - vp.offsetY) / vp.zoom };
    },
    [viewport, containerRef],
  );

  // ── Compute endpoints (outside component to avoid hook ordering issues) ──
  const endpoints = React.useMemo(() => {
    if (!selectedLine)
      return {
        startWorld: { x: 0, y: 0 },
        endWorld: { x: 0, y: 0 },
        props: {},
        routerType: 'straight',
      };
    const schema = selectedLine.schemaRef as any;
    const props: Record<string, unknown> = schema.props ?? {};
    const lineLayout = nodeToLayout(selectedLine as any);

    const resolveEndpoint = (endpoint: Endpoint): Pt => {
      const isStart = endpoint === 'start';
      const nodeId = isStart ? (props.sourceNodeId as string) : (props.targetNodeId as string);
      const portId = isStart ? (props.sourcePortId as string) : (props.targetPortId as string);
      const anchor =
        (isStart ? (props.sourceAnchor as AnchorId) : (props.targetAnchor as AnchorId)) || 'center';

      if (nodeId && state.nodesById[nodeId]) {
        const targetNode = state.nodesById[nodeId]!;
        const targetLayout = nodeToLayout(targetNode as any);
        if (portId) {
          const el = document.querySelector<HTMLElement>(
            `.thingsvis-widget-layer [data-node-id="${nodeId}"][data-port-id="${portId}"]`,
          );
          if (el) {
            const rect = el.getBoundingClientRect();
            const containerRect = containerRef?.current?.getBoundingClientRect() ?? new DOMRect();
            const vp = getViewport();
            // Use the single canvas container rect as the reference.
            // The formula matches screenRectToWorld in PortOverlay so both
            // the hover indicator and the endpoint handle land on the same pixel.
            const worldX = (rect.left + rect.width / 2 - containerRect.left - vp.offsetX) / vp.zoom;
            const worldY = (rect.top + rect.height / 2 - containerRect.top - vp.offsetY) / vp.zoom;
            return { x: worldX, y: worldY };
          }
        }
        return getAnchorWorld(targetLayout, anchor);
      }

      const rawPoints: Pt[] = Array.isArray(props.points) ? (props.points as Pt[]) : [];
      const size = schema.size ?? { width: 100, height: 100 };
      const isNorm = rawPoints.every((p) => p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1);
      const pt = isStart
        ? (rawPoints[0] ?? { x: 0, y: 0.5 })
        : (rawPoints[rawPoints.length - 1] ?? { x: 1, y: 0.5 });
      return {
        x: lineLayout.position.x + (isNorm ? pt.x * size.width : pt.x),
        y: lineLayout.position.y + (isNorm ? pt.y * size.height : pt.y),
      };
    };

    return {
      startWorld: resolveEndpoint('start'),
      endWorld: resolveEndpoint('end'),
      props,
      routerType: (props.routerType as string) ?? 'straight',
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedLine?.id,
    (selectedLine?.schemaRef as any)?.props,
    state.nodesById,
    getViewport,
    containerRef,
  ]);

  const { startWorld, endWorld, props, routerType } = endpoints;

  // ── All hooks run unconditionally — early return comes AFTER hooks ─────────
  // Mouse drag effect
  useEffect(() => {
    const vp = getViewport();

    const onMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const world = screenToWorld(e.clientX, e.clientY);
      dragRef.current = { ...dragRef.current!, currentWorld: world };

      const detected = detectNodeAndAnchor(
        world,
        { x: e.clientX, y: e.clientY },
        state,
        [dragRef.current.lineId],
        vp,
        containerRef?.current ?? null,
      );
      hoveredAnchorRef.current = detected;
      rerender();
    };

    const onMouseUp = () => {
      if (!dragRef.current) return;
      const ds = dragRef.current;
      dragRef.current = null;
      hoveredAnchorRef.current = null;
      isDraggingRef.current = false;
      rerender();

      const currentState = kernelStore.getState() as any;
      const updateNode = currentState.updateNode;
      if (!updateNode) return;

      const lineNode = state.nodesById[ds.lineId];
      if (!lineNode) return;
      const currentProps: Record<string, unknown> = {
        ...((lineNode.schemaRef as any)?.props ?? {}),
      };

      const propKey = ds.endpoint === 'start' ? 'sourceNodeId' : 'targetNodeId';
      const anchorKey = ds.endpoint === 'start' ? 'sourceAnchor' : 'targetAnchor';
      const portKey = ds.endpoint === 'start' ? 'sourcePortId' : 'targetPortId';

      if (ds.targetHover) {
        currentProps[propKey] = ds.targetHover.nodeId;
        currentProps[anchorKey] = ds.targetHover.anchor;
        if (ds.targetHover.portId) currentProps[portKey] = ds.targetHover.portId;
        else delete currentProps[portKey];
      } else {
        delete currentProps[propKey];
        delete currentProps[anchorKey];
        delete currentProps[portKey];
        const rawPoints: Pt[] = Array.isArray(currentProps.points)
          ? (currentProps.points as Pt[])
          : [];
        const isNorm = rawPoints.every((p) => p.x >= 0 && p.x <= 1 && p.y <= 1);
        const size = (lineNode.schemaRef as any)?.size ?? { width: 100, height: 40 };
        const lp = (lineNode.schemaRef as any)?.position ?? { x: 0, y: 0 };
        const toLocal = (w: Pt): Pt =>
          isNorm
            ? { x: (w.x - lp.x) / size.width, y: (w.y - lp.y) / size.height }
            : { x: w.x - lp.x, y: w.y - lp.y };

        if (ds.endpoint === 'start') {
          currentProps.points = [toLocal(ds.currentWorld), ...rawPoints.slice(1)];
        } else {
          currentProps.points = [...rawPoints.slice(0, -1), toLocal(ds.currentWorld)];
        }
      }

      updateNode(ds.lineId, { props: currentProps });
      onUserEdit?.();
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [kernelStore, getViewport, screenToWorld, state, onUserEdit, rerender]);

  // Keyboard shortcut effect — null guard inside since selectedLineId is derived
  useEffect(() => {
    if (!selectedLineId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const currentState = kernelStore.getState() as any;
      const updateNode = currentState.updateNode;
      if (!updateNode) return;

      const lineNode = state.nodesById[selectedLineId!];
      if (!lineNode) return;
      const nextProps: Record<string, unknown> = { ...((lineNode.schemaRef as any)?.props ?? {}) };
      let changed = false;

      for (const [propKey, anchorKey, portKey] of [
        ['sourceNodeId', 'sourceAnchor', 'sourcePortId'],
        ['targetNodeId', 'targetAnchor', 'targetPortId'],
      ] as const) {
        if (nextProps[propKey]) {
          const rawPoints: Pt[] = Array.isArray(nextProps.points) ? (nextProps.points as Pt[]) : [];
          const size = (lineNode.schemaRef as any)?.size ?? { width: 100, height: 40 };
          const lp = (lineNode.schemaRef as any)?.position ?? { x: 0, y: 0 };
          const isNorm = rawPoints.every((p) => p.x >= 0 && p.x <= 1 && p.y <= 1);
          const toLocal = (w: Pt): Pt =>
            isNorm
              ? { x: (w.x - lp.x) / size.width, y: (w.y - lp.y) / size.height }
              : { x: w.x - lp.x, y: w.y - lp.y };
          const ep = propKey === 'sourceNodeId' ? startWorld : endWorld;
          const pts =
            propKey === 'sourceNodeId'
              ? [toLocal(ep), ...rawPoints.slice(1)]
              : [...rawPoints.slice(0, -1), toLocal(ep)];
          nextProps.points = pts;
          delete nextProps[propKey];
          delete nextProps[anchorKey];
          delete nextProps[portKey];
          changed = true;
        }
      }

      if (changed) {
        updateNode(selectedLineId!, { props: nextProps });
        onUserEdit?.();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [kernelStore, selectedLineId, state.nodesById, startWorld, endWorld, onUserEdit]);

  useEffect(() => {
    const activeDrag = dragRef.current;
    const shouldReset =
      (!selectedLineId && (!!activeDrag || !!hoveredAnchorRef.current)) ||
      (!!activeDrag && activeDrag.lineId !== selectedLineId);
    if (!shouldReset) return;

    dragRef.current = null;
    hoveredAnchorRef.current = null;
    isDraggingRef.current = false;
    rerender();
  }, [selectedLineId, rerender]);

  // ── Conditional return AFTER all hooks ────────────────────────────────────
  if (!selectedLineId || !selectedLine) return null;

  // ── Render helpers ────────────────────────────────────────────────────────

  const renderHandle = (endpoint: Endpoint, worldPos: Pt, isConnected: boolean) => {
    const isDragging =
      dragRef.current?.endpoint === endpoint && dragRef.current.lineId === selectedLineId;
    const screen = worldToScreen(worldPos.x, worldPos.y);
    const size = 14;

    return (
      <div
        key={endpoint}
        className={`absolute rounded-full border-2 cursor-grab transition-all duration-75 ${
          isDragging
            ? 'bg-blue-500 border-blue-600 scale-125 shadow-lg z-[1003]'
            : isConnected
              ? 'bg-white border-green-500 hover:scale-110 z-[1001]'
              : 'bg-white border-[#6965db] hover:scale-110 z-[1001]'
        }`}
        style={{
          left: screen.x - size / 2,
          top: screen.y - size / 2,
          width: size,
          height: size,
          pointerEvents: 'auto' as const,
        }}
        onMouseDown={(e) => {
          (e.nativeEvent as MouseEvent).stopImmediatePropagation();
          e.preventDefault();
          isDraggingRef.current = true;
          dragRef.current = {
            lineId: selectedLineId!,
            endpoint,
            startWorld,
            currentWorld: worldPos,
            targetHover: null,
          };
          rerender();
        }}
        title={
          isConnected
            ? `${endpoint} endpoint — drag to reconnect or Delete to detach`
            : `${endpoint} endpoint — drag to connect`
        }
      />
    );
  };

  const renderDragLine = () => {
    if (!dragRef.current || dragRef.current.lineId !== selectedLineId) return null;
    const ds = dragRef.current;
    const otherEnd = ds.endpoint === 'start' ? endWorld : startWorld;
    const sp = worldToScreen(otherEnd.x, otherEnd.y);
    const ep = worldToScreen(ds.currentWorld.x, ds.currentWorld.y);

    if (routerType === 'orthogonal') {
      const routePts = buildOrthogonalRoute(
        otherEnd,
        ds.currentWorld,
        ds.endpoint === 'start'
          ? (props.sourceAnchor as AnchorId)
          : (props.targetAnchor as AnchorId),
        ds.endpoint === 'start'
          ? (props.targetAnchor as AnchorId)
          : (props.sourceAnchor as AnchorId),
      );
      const first = routePts[0]!;
      let pathD = `M ${first.x} ${first.y}`;
      for (let i = 1; i < routePts.length; i++) {
        const p = routePts[i]!;
        pathD += ` L ${p.x} ${p.y}`;
      }
      return (
        <svg
          className="absolute inset-0 pointer-events-none z-[999]"
          style={{ overflow: 'visible' }}
        >
          <path
            d={pathD}
            stroke="#6965db"
            strokeWidth={2}
            strokeDasharray="6 4"
            fill="none"
            vectorEffect="non-scaling-stroke"
            transform={`translate(${viewport.offsetX},${viewport.offsetY}) scale(${viewport.zoom})`}
          />
        </svg>
      );
    }

    return (
      <svg className="absolute inset-0 pointer-events-none z-[999]" style={{ overflow: 'visible' }}>
        <line
          x1={sp.x}
          y1={sp.y}
          x2={ep.x}
          y2={ep.y}
          stroke="#6965db"
          strokeWidth={2}
          strokeDasharray="6 4"
        />
      </svg>
    );
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-[998]">
      <PortOverlay
        hoveredAnchor={hoveredAnchorRef.current}
        worldToScreen={worldToScreen}
        state={state}
        viewport={viewport}
      />

      <div className="pointer-events-none">
        {renderHandle('start', startWorld, !!props.sourceNodeId)}
        {renderHandle('end', endWorld, !!props.targetNodeId)}
      </div>

      {renderDragLine()}
    </div>
  );
}
