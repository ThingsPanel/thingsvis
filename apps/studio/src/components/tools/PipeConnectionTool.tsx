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
import { getAnchorWorld, nodeToLayout, type Pt } from '../../lib/canvas/nodeLayoutTransform';
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
      startWorld: Pt;
      basePoints: Pt[];
      currentWorld: Pt;
    };

const PIPE_DETACH_DISTANCE_PX = 24;
const PIPE_SEGMENT_DRAG_DISTANCE_PX = 6;

function worldDistance(a: Pt, b: Pt): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function parsePathPoints(d: string | null): Pt[] {
  if (!d) return [];
  const nums = d.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  const points: Pt[] = [];
  for (let i = 0; i < nums.length; i += 2) {
    const x = nums[i];
    const y = nums[i + 1];
    if (typeof x === 'number' && typeof y === 'number') {
      points.push({ x, y });
    }
  }
  return points;
}

function getRenderedPipeWorldPoints(
  pipeId: string,
  pipeNode: any,
  pipeColor: string,
  viewport: Viewport,
  containerEl?: HTMLElement | null,
): Pt[] {
  const overlay =
    document.querySelector<HTMLElement>(
      `.thingsvis-widget-layer [data-overlay-node-id="${pipeId}"]`,
    ) ?? document.querySelector<HTMLElement>(`.thingsvis-widget-layer [data-node-id="${pipeId}"]`);
  if (!overlay) return [];

  const svg = overlay.querySelector<SVGSVGElement>('svg');
  const path =
    overlay.querySelector<SVGPathElement>(`path[stroke="${pipeColor}"]`) ??
    overlay.querySelector<SVGPathElement>('path');
  if (!svg || !path) return [];

  const localPoints = parsePathPoints(path.getAttribute('d'));
  if (localPoints.length < 2) return [];

  const matrix = path.getScreenCTM?.();
  const containerRect = containerEl?.getBoundingClientRect();
  const containerLeft = containerRect?.left ?? 0;
  const containerTop = containerRect?.top ?? 0;

  if (matrix && typeof DOMPoint === 'function') {
    return localPoints.map((point) => {
      const screenPoint = new DOMPoint(point.x, point.y).matrixTransform(matrix);
      return {
        x: (screenPoint.x - containerLeft - viewport.offsetX) / viewport.zoom,
        y: (screenPoint.y - containerTop - viewport.offsetY) / viewport.zoom,
      };
    });
  }

  const svgLeft = Number.parseFloat(svg.style.left || '0') || 0;
  const svgTop = Number.parseFloat(svg.style.top || '0') || 0;
  const widgetPosition = pipeNode?.schemaRef?.position ?? { x: 0, y: 0 };

  return localPoints.map((point) => ({
    x: widgetPosition.x + svgLeft + point.x,
    y: widgetPosition.y + svgTop + point.y,
  }));
}

function resolveVisiblePipeWorldPoints(
  pipeId: string,
  pipeNode: any,
  state: KernelState,
  getViewport: () => Viewport,
  containerEl?: HTMLElement | null,
): Pt[] {
  const props = ((pipeNode?.schemaRef as any)?.props ?? {}) as Record<string, unknown>;
  const rendered = getRenderedPipeWorldPoints(
    pipeId,
    pipeNode,
    String(props.pipeColor ?? '#2563eb'),
    getViewport(),
    containerEl,
  );
  if (rendered.length >= 2) return rendered;
  return computeIndustrialPipeWorldPolyline(
    pipeNode,
    state.nodesById,
    getViewport,
    containerEl ?? null,
  );
}

function resolveExpectedEndpointWorld(
  endpoint: Endpoint,
  props: Record<string, unknown>,
  state: KernelState,
): Pt | null {
  const nodeId =
    endpoint === 'start'
      ? (props.sourceNodeId as string | undefined)
      : (props.targetNodeId as string | undefined);
  if (!nodeId) return null;
  const targetNode = state.nodesById[nodeId];
  if (!targetNode) return null;
  const anchor =
    endpoint === 'start'
      ? (props.sourceAnchor as Parameters<typeof getAnchorWorld>[1] | undefined)
      : (props.targetAnchor as Parameters<typeof getAnchorWorld>[1] | undefined);
  return getAnchorWorld(nodeToLayout(targetNode as any), anchor ?? 'center');
}

function routePointsChanged(a: Pt[], b: Pt[], eps = 0.5): boolean {
  if (a.length !== b.length) return true;
  return a.some(
    (point, index) =>
      Math.abs(point.x - b[index]!.x) > eps || Math.abs(point.y - b[index]!.y) > eps,
  );
}

function collapseRenderedFreeJog(points: Pt[], props: Record<string, unknown>): Pt[] {
  if (points.length < 3) return points;
  const threshold = Math.max(12, Number(props.strokeWidth ?? 12));
  const hasStoredWaypoints = Array.isArray(props.waypoints) && props.waypoints.length > 0;
  if (hasStoredWaypoints) return points;

  const collapseStart = !props.sourceNodeId && !props.sourcePortId;
  const collapseEnd = !props.targetNodeId && !props.targetPortId;

  if (collapseStart) {
    const start = points[0]!;
    const elbow = points[1]!;
    const next = points[2]!;
    const startLength = Math.abs(elbow.x - start.x) + Math.abs(elbow.y - start.y);
    const secondHorizontal = Math.abs(next.y - elbow.y) <= 0.5;
    const secondVertical = Math.abs(next.x - elbow.x) <= 0.5;
    if (startLength <= threshold && (secondHorizontal || secondVertical)) {
      return secondHorizontal
        ? [{ x: start.x, y: elbow.y }, ...points.slice(2)]
        : [{ x: elbow.x, y: start.y }, ...points.slice(2)];
    }
  }

  if (collapseEnd) {
    const prev = points[points.length - 3]!;
    const elbow = points[points.length - 2]!;
    const end = points[points.length - 1]!;
    const endLength = Math.abs(end.x - elbow.x) + Math.abs(end.y - elbow.y);
    const prevHorizontal = Math.abs(prev.y - elbow.y) <= 0.5;
    const prevVertical = Math.abs(prev.x - elbow.x) <= 0.5;
    if (endLength <= threshold && (prevHorizontal || prevVertical)) {
      return prevHorizontal
        ? [...points.slice(0, -2), { x: end.x, y: elbow.y }]
        : [...points.slice(0, -2), { x: elbow.x, y: end.y }];
    }
  }

  return points;
}

function hasPipeConnectionBinding(props: Record<string, unknown> | null | undefined): boolean {
  return !!(
    props?.sourceNodeId ||
    props?.targetNodeId ||
    props?.sourcePortId ||
    props?.targetPortId
  );
}

export type PipeSegmentHitRegion = {
  key: string;
  left: number;
  top: number;
  width: number;
  height: number;
  segmentIndex: number;
};

export function buildPipeSegmentHitRegions(
  points: Pt[],
  worldToScreen: (wx: number, wy: number) => Pt,
  size = 18,
): PipeSegmentHitRegion[] {
  if (!Array.isArray(points) || points.length < 2) return [];

  const half = size / 2;
  return points.slice(0, -1).flatMap((point, segmentIndex) => {
    const next = points[segmentIndex + 1];
    if (!next) return [];

    const start = worldToScreen(point.x, point.y);
    const end = worldToScreen(next.x, next.y);
    const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
      return [];
    }

    return [
      {
        key: `seg-${segmentIndex}`,
        left: mid.x - half,
        top: mid.y - half,
        width: size,
        height: size,
        segmentIndex,
      },
    ];
  });
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
        points: resolveVisiblePipeWorldPoints(
          selectedPipeId!,
          selectedPipe,
          state,
          getViewport,
          containerRef?.current ?? null,
        ),
        props: schema?.props ?? {},
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.selection, state.nodesById, getViewport, containerRef],
  );
  const supportsConnectionEditing = hasPipeConnectionBinding(
    routePoints.props as Record<string, unknown>,
  );
  const canRenderEndpointHandles = !!routePoints.pipeId && routePoints.points.length >= 2;

  // ── Drag event handlers ──────────────────────────────────────────────────
  useEffect(() => {
    if (!canRenderEndpointHandles) return;

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
      const worldPoints = resolveVisiblePipeWorldPoints(
        ds.pipeId,
        pipeNode,
        currentState,
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
        const segmentDragDistanceWorld =
          PIPE_SEGMENT_DRAG_DISTANCE_PX / Math.max(0.0001, getViewport().zoom);
        if (worldDistance(ds.startWorld, ds.currentWorld) <= segmentDragDistanceWorld) {
          rerender();
          return;
        }

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
  }, [
    kernelStore,
    getViewport,
    screenToWorld,
    state,
    onUserEdit,
    rerender,
    canRenderEndpointHandles,
  ]);

  useEffect(() => {
    if (!supportsConnectionEditing) return;
    if (dragRef.current) return;
    if (!routePoints.pipeId) return;

    const pipeNode = state.nodesById[routePoints.pipeId];
    if (!pipeNode) return;

    const nodeProps = ((pipeNode.schemaRef as any)?.props ?? {}) as Record<string, unknown>;
    if (!nodeProps.sourceNodeId && !nodeProps.targetNodeId) return;

    const renderedWorldPoints = getRenderedPipeWorldPoints(
      routePoints.pipeId,
      pipeNode,
      String(nodeProps.pipeColor ?? '#2563eb'),
      viewport,
      containerRef?.current ?? null,
    );
    if (renderedWorldPoints.length < 2) return;

    const detachDistanceWorld = 12 / Math.max(0.0001, viewport.zoom);
    const startExpected = resolveExpectedEndpointWorld('start', nodeProps, state);
    const endExpected = resolveExpectedEndpointWorld('end', nodeProps, state);
    const detachStart =
      !!startExpected &&
      worldDistance(renderedWorldPoints[0]!, startExpected) > detachDistanceWorld;
    const detachEnd =
      !!endExpected &&
      worldDistance(renderedWorldPoints[renderedWorldPoints.length - 1]!, endExpected) >
        detachDistanceWorld;

    if (!detachStart && !detachEnd) return;

    const nextProps: Record<string, unknown> = { ...nodeProps };
    if (detachStart) {
      nextProps.sourceNodeId = undefined;
      nextProps.sourceAnchor = undefined;
      nextProps.sourcePortId = undefined;
    }
    if (detachEnd) {
      nextProps.targetNodeId = undefined;
      nextProps.targetAnchor = undefined;
      nextProps.targetPortId = undefined;
    }

    const fitted = fitWorldRouteToNodeBox(renderedWorldPoints, nextProps.strokeWidth);
    nextProps.points = fitted.points;
    nextProps.waypoints = fitted.waypoints;
    kernelStore.getState().updateNode(routePoints.pipeId, {
      position: fitted.position,
      size: fitted.size,
      props: nextProps,
    });
    onUserEdit?.();
  }, [
    kernelStore,
    onUserEdit,
    routePoints.pipeId,
    state,
    viewport.zoom,
    supportsConnectionEditing,
  ]);

  useEffect(() => {
    if (!supportsConnectionEditing) return;
    if (dragRef.current) return;
    if (!routePoints.pipeId) return;

    const pipeNode = state.nodesById[routePoints.pipeId];
    if (!pipeNode) return;

    const nodeProps = ((pipeNode.schemaRef as any)?.props ?? {}) as Record<string, unknown>;
    const renderedWorldPoints = getRenderedPipeWorldPoints(
      routePoints.pipeId,
      pipeNode,
      String(nodeProps.pipeColor ?? '#2563eb'),
      viewport,
      containerRef?.current ?? null,
    );
    if (renderedWorldPoints.length < 3) return;

    const collapsed = collapseRenderedFreeJog(renderedWorldPoints, nodeProps);
    if (!routePointsChanged(renderedWorldPoints, collapsed)) return;

    const fitted = fitWorldRouteToNodeBox(collapsed, nodeProps.strokeWidth);
    kernelStore.getState().updateNode(routePoints.pipeId, {
      position: fitted.position,
      size: fitted.size,
      props: {
        ...nodeProps,
        points: fitted.points,
        waypoints: fitted.waypoints,
      },
    });
    onUserEdit?.();
  }, [
    containerRef,
    kernelStore,
    onUserEdit,
    routePoints.pipeId,
    state,
    viewport,
    supportsConnectionEditing,
  ]);

  useEffect(() => {
    if (!supportsConnectionEditing) return;
    if (!routePoints.pipeId) return;

    const overlay =
      document.querySelector<HTMLElement>(
        `.thingsvis-widget-layer [data-overlay-node-id="${routePoints.pipeId}"]`,
      ) ??
      document.querySelector<HTMLElement>(
        `.thingsvis-widget-layer [data-node-id="${routePoints.pipeId}"]`,
      );
    if (!overlay) return;

    const svg = overlay.querySelector<SVGSVGElement>('svg');
    const path =
      overlay.querySelector<SVGPathElement>(
        `path[stroke="${String(routePoints.props.pipeColor ?? '#2563eb')}"]`,
      ) ?? overlay.querySelector<SVGPathElement>('path');
    if (!svg || !path) return;

    let rafId: number | null = null;
    const scheduleSync = () => {
      if (rafId != null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        rerender();
      });
    };

    const observer = new MutationObserver(() => {
      scheduleSync();
    });

    observer.observe(path, {
      attributes: true,
      attributeFilter: ['d', 'stroke'],
    });
    observer.observe(svg, {
      attributes: true,
      attributeFilter: ['style', 'width', 'height', 'viewBox'],
    });

    return () => {
      observer.disconnect();
      if (rafId != null) window.cancelAnimationFrame(rafId);
    };
  }, [rerender, routePoints.pipeId, routePoints.props.pipeColor, supportsConnectionEditing]);

  // ── Conditional return AFTER all hooks ───────────────────────────────────
  useEffect(() => {
    const activeDrag = dragRef.current;
    const shouldReset =
      (!routePoints.pipeId && (!!activeDrag || !!hoveredAnchorRef.current)) ||
      (!!activeDrag && activeDrag.pipeId !== routePoints.pipeId);
    if (!shouldReset) return;

    dragRef.current = null;
    hoveredAnchorRef.current = null;
    rerender();
  }, [routePoints.pipeId, rerender]);

  if (!routePoints.pipeId || routePoints.points.length < 2) {
    return null;
  }

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

  const renderSegmentHitRegions = () => {
    return buildPipeSegmentHitRegions(points, worldToScreen).map((segment) => (
      <div
        key={segment.key}
        data-pipe-segment-hit="true"
        data-segment-index={segment.segmentIndex}
        className="pipe-segment-hit absolute"
        style={{
          left: segment.left,
          top: segment.top,
          width: segment.width,
          height: segment.height,
          zIndex: 999,
          pointerEvents: 'auto' as const,
          cursor: 'move',
          background: 'transparent',
        }}
        onMouseDown={(e) => {
          const start = points[segment.segmentIndex]!;
          const next = points[segment.segmentIndex + 1]!;
          (e.nativeEvent as MouseEvent).stopImmediatePropagation();
          e.preventDefault();
          dragRef.current = {
            kind: 'segment',
            pipeId: selectedPipeId,
            segmentIndex: segment.segmentIndex,
            axis: Math.abs(next.x - start.x) >= Math.abs(next.y - start.y) ? 'y' : 'x',
            startWorld: screenToWorld(e.clientX, e.clientY),
            basePoints: routePoints.points.map((point) => ({ ...point })),
            currentWorld: screenToWorld(e.clientX, e.clientY),
          };
          rerender();
        }}
        title="Drag pipe segment to adjust routing"
      />
    ));
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
        {renderSegmentHitRegions()}
      </div>

      {renderDragLine()}
    </div>
  );
}
