/**
 * PipeConnectionTool
 *
 * Pure overlay for industrial pipe editing. Anchors are resolved via nodeLayoutTransform
 * with full rotation support.
 *
 * CRITICAL: All hooks are called unconditionally. Conditional returns come AFTER the
 * hooks section. This is required by the Rules of Hooks — hook call order must be
 * identical across every render, whether the component renders or returns null.
 */

import React, { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import type { KernelStore, KernelState } from '@thingsvis/kernel';
import { detectNodeAndAnchor, PortOverlay, type HoverAnchor, type Viewport } from './PortOverlay';
import type { Pt } from '../../lib/canvas/nodeLayoutTransform';
import {
  computeIndustrialPipeWorldPolyline,
  fitWorldRouteToNodeBox,
  movePipeSegment,
} from '../../../../../packages/widgets/industrial/pipe/src/routeWorld';

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

type DragState =
  | {
      kind: 'endpoint';
      pipeId: string;
      endpoint: Endpoint;
      startWorld: Pt;
      currentWorld: Pt;
      targetHover: HoverAnchor | null;
    }
  | {
      kind: 'segment';
      pipeId: string;
      segmentIndex: number;
      axis: 'x' | 'y';
      basePoints: Pt[];
      currentWorld: Pt;
    };

const PIPE_DETACH_DISTANCE_PX = 24;

function worldDistance(a: Pt, b: Pt): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PipeConnectionTool({
  kernelStore,
  getViewport,
  onUserEdit,
  containerRef,
}: Props) {
  // ── ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURN ─────────────────
  // This is the core fix: even if this component returns null on a given render,
  // all hooks must execute in the same order every time.

  const state = useSyncExternalStore(
    useCallback((cb) => kernelStore.subscribe(cb), [kernelStore]),
    () => kernelStore.getState() as KernelState,
  );

  const dragRef = useRef<DragState | null>(null);
  const hoveredAnchorRef = useRef<HoverAnchor | null>(null);
  const [, forceRender] = React.useState(0);
  const rerender = useCallback(() => forceRender((n) => n + 1), []);

  const viewport = getViewport();

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

  const routePoints = React.useMemo(
    () => {
      const selectedPipeIds = state.selection.nodeIds.filter(
        (id) => (state.nodesById[id]?.schemaRef as any)?.type === 'industrial/pipe',
      );
      const selectedPipeId = selectedPipeIds.length === 1 ? selectedPipeIds[0] : null;
      const selectedPipe = selectedPipeId ? state.nodesById[selectedPipeId] : null;
      if (!selectedPipe) return { pipeId: null, points: [], props: {} };
      const schema = selectedPipe.schemaRef as any;
      return {
        pipeId: selectedPipeId,
        points: computeIndustrialPipeWorldPolyline(
          selectedPipe,
          state.nodesById,
          getViewport,
          containerRef?.current ?? null,
        ),
        props: schema?.props ?? {},
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.selection, state.nodesById, getViewport, containerRef],
  );

  // ── Drag event handlers ──────────────────────────────────────────────────
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const world = screenToWorld(e.clientX, e.clientY);

      if (dragRef.current.kind === 'endpoint') {
        const ds = dragRef.current;
        const vp = getViewport();
        const detected = detectNodeAndAnchor(
          world,
          { x: e.clientX, y: e.clientY },
          state,
          [ds.pipeId],
          vp,
          containerRef?.current ?? null,
        );
        dragRef.current = { ...ds, currentWorld: world, targetHover: detected };
        hoveredAnchorRef.current = detected;
      } else {
        const ds = dragRef.current;
        dragRef.current = { ...ds, currentWorld: world };
      }
      rerender();
    };

    const onMouseUp = () => {
      const ds = dragRef.current;
      if (!ds) return;
      dragRef.current = null;
      hoveredAnchorRef.current = null;
      rerender();

      const currentState = kernelStore.getState() as any;
      const updateNode = currentState.updateNode;
      if (!updateNode) return;

      const pipeNode = state.nodesById[ds.pipeId];
      if (!pipeNode) return;
      const nodeProps: Record<string, unknown> = { ...((pipeNode.schemaRef as any)?.props ?? {}) };
      const worldPoints = computeIndustrialPipeWorldPolyline(
        pipeNode,
        currentState.nodesById,
        getViewport,
        containerRef?.current ?? null,
      );
      const nextWorldPoints =
        worldPoints.length >= 2 ? worldPoints.map((point) => ({ ...point })) : [];
      const commitWorldRoute = (routePoints: Pt[]) => {
        const fitted = fitWorldRouteToNodeBox(routePoints, nodeProps.strokeWidth);
        nodeProps.points = fitted.points;
        nodeProps.waypoints = fitted.waypoints;
        updateNode(ds.pipeId, {
          position: fitted.position,
          size: fitted.size,
          props: nodeProps,
        });
      };

      if (ds.kind === 'endpoint') {
        const propKey = ds.endpoint === 'start' ? 'sourceNodeId' : 'targetNodeId';
        const anchorKey = ds.endpoint === 'start' ? 'sourceAnchor' : 'targetAnchor';
        const portKey = ds.endpoint === 'start' ? 'sourcePortId' : 'targetPortId';
        const hadBinding = Boolean(nodeProps[propKey]);
        const detachDistanceWorld = PIPE_DETACH_DISTANCE_PX / Math.max(0.0001, getViewport().zoom);
        const shouldDetach =
          !ds.targetHover &&
          (!hadBinding || worldDistance(ds.startWorld, ds.currentWorld) > detachDistanceWorld);
        const endpointWorld = ds.targetHover
          ? { x: ds.targetHover.x, y: ds.targetHover.y }
          : shouldDetach
            ? ds.currentWorld
            : ds.startWorld;

        if (nextWorldPoints.length >= 2) {
          if (ds.endpoint === 'start') nextWorldPoints[0] = endpointWorld;
          else nextWorldPoints[nextWorldPoints.length - 1] = endpointWorld;
        }

        if (ds.targetHover) {
          nodeProps[propKey] = ds.targetHover.nodeId;
          nodeProps[anchorKey] = ds.targetHover.anchor;
          if (ds.targetHover.portId) nodeProps[portKey] = ds.targetHover.portId;
          else nodeProps[portKey] = undefined;
        } else if (shouldDetach) {
          nodeProps[propKey] = undefined;
          nodeProps[anchorKey] = undefined;
          nodeProps[portKey] = undefined;
        }
        commitWorldRoute(nextWorldPoints);
      } else {
        commitWorldRoute(
          movePipeSegment(ds.basePoints, ds.segmentIndex, ds.currentWorld, {
            sourceAnchor: nodeProps.sourceAnchor as any,
            targetAnchor: nodeProps.targetAnchor as any,
          }),
        );
      }
      onUserEdit?.();
      rerender();
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [kernelStore, getViewport, screenToWorld, state, onUserEdit, rerender]);

  // ── Conditional return AFTER all hooks ───────────────────────────────────
  if (!routePoints.pipeId || routePoints.points.length < 2) return null;

  const { props } = routePoints;
  const points =
    dragRef.current?.kind === 'segment' && dragRef.current.pipeId === routePoints.pipeId
      ? movePipeSegment(
          dragRef.current.basePoints,
          dragRef.current.segmentIndex,
          dragRef.current.currentWorld,
          {
            sourceAnchor: props.sourceAnchor as any,
            targetAnchor: props.targetAnchor as any,
          },
        )
      : routePoints.points;
  const selectedPipeId = routePoints.pipeId;

  // ── Render helpers ────────────────────────────────────────────────────────

  const renderEndpointHandle = (endpoint: Endpoint, worldPos: Pt) => {
    const ds = dragRef.current;
    const isDragging =
      ds?.kind === 'endpoint' && ds.pipeId === selectedPipeId && ds.endpoint === endpoint;
    const isConnected = endpoint === 'start' ? !!props.sourceNodeId : !!props.targetNodeId;
    const displayPos = isDragging ? (ds as any).currentWorld : worldPos;
    const screen = worldToScreen(displayPos.x, displayPos.y);
    const size = 14;

    return (
      <div
        key={endpoint}
        className={`absolute rounded-full border-2 cursor-grab transition-all duration-75 ${
          isDragging
            ? 'bg-blue-500 border-blue-600 scale-125 shadow-lg z-[1003]'
            : isConnected
              ? 'bg-white border-green-500 hover:scale-110 z-[1001]'
              : 'bg-white border-orange-400 hover:scale-110 z-[1001]'
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
          dragRef.current = {
            kind: 'endpoint',
            pipeId: selectedPipeId,
            endpoint,
            startWorld: displayPos,
            currentWorld: displayPos,
            targetHover: null,
          };
          rerender();
        }}
        title={endpoint === 'start' ? 'Drag to connect start' : 'Drag to connect end'}
      />
    );
  };

  const renderSegmentHandles = () => {
    return points.slice(0, -1).map((pt, i) => {
      const next = points[i + 1]!;
      const mid: Pt = { x: (pt.x + next.x) / 2, y: (pt.y + next.y) / 2 };
      const screen = worldToScreen(mid.x, mid.y);
      const isDragging =
        dragRef.current?.kind === 'segment' && (dragRef.current as any).segmentIndex === i;
      const isEndpoint = i === 0 || i === points.length - 2;

      return (
        <div
          key={`seg-${i}`}
          className={`absolute rounded border transition-all duration-75 ${
            isDragging
              ? 'bg-orange-500 border-orange-600 shadow-lg'
              : 'bg-white/90 border-orange-400 hover:bg-orange-50'
          }`}
          style={{
            left: screen.x - 9,
            top: screen.y - 9,
            width: 18,
            height: 18,
            zIndex: isEndpoint ? 998 : 999,
            pointerEvents: 'auto' as const,
          }}
          onMouseDown={(e) => {
            (e.nativeEvent as MouseEvent).stopImmediatePropagation();
            e.preventDefault();
            dragRef.current = {
              kind: 'segment',
              pipeId: selectedPipeId,
              segmentIndex: i,
              axis: Math.abs(next.x - pt.x) >= Math.abs(next.y - pt.y) ? 'y' : 'x',
              basePoints: routePoints.points.map((point) => ({ ...point })),
              currentWorld: screenToWorld(e.clientX, e.clientY),
            };
            rerender();
          }}
          title="Drag segment midpoint to adjust routing"
        />
      );
    });
  };

  const renderDragLine = () => {
    if (
      !dragRef.current ||
      dragRef.current.kind !== 'endpoint' ||
      dragRef.current.pipeId !== selectedPipeId
    )
      return null;
    const ds = dragRef.current;
    const otherEnd = ds.endpoint === 'start' ? points[points.length - 1]! : points[0]!;
    const p1 = worldToScreen(otherEnd.x, otherEnd.y);
    const p2 = worldToScreen(ds.currentWorld.x, ds.currentWorld.y);

    return (
      <svg className="absolute inset-0 pointer-events-none z-[999]" style={{ overflow: 'visible' }}>
        <line
          x1={p1.x}
          y1={p1.y}
          x2={p2.x}
          y2={p2.y}
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
        {renderEndpointHandle('start', points[0]!)}
        {renderEndpointHandle('end', points[points.length - 1]!)}
        {renderSegmentHandles()}
      </div>

      {renderDragLine()}
    </div>
  );
}
