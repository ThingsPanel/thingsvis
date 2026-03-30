import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useMemo,
} from 'react';
import type { KernelStore, KernelState } from '@thingsvis/kernel';
import {
  detectNodeAndAnchor,
  PortOverlay,
  type AnchorType,
  type HoverAnchor,
  getAnchorWorldPosition,
} from './PortOverlay';

type Pt = { x: number; y: number };

type Props = {
  kernelStore: KernelStore;
  containerRef: React.RefObject<HTMLElement>;
  getViewport: () => {
    width: number;
    height: number;
    zoom: number;
    offsetX: number;
    offsetY: number;
  };
  onUserEdit?: () => void;
};

type EndpointDragState = {
  kind: 'endpoint';
  pipeId: string;
  endpoint: 'start' | 'end';
  startWorldPos: Pt;
  currentWorldPos: Pt;
};

type SegmentDragState = {
  kind: 'segment';
  pipeId: string;
  segmentIndex: number;
  axis: 'x' | 'y';
  baseWaypoints: Pt[];
  baseStart: Pt;
  baseEnd: Pt;
  startWorldPos: Pt;
  currentWorldPos: Pt;
};

type DragState = EndpointDragState | SegmentDragState;

function isHorizontal(a: Pt, b: Pt, eps = 1): boolean {
  return Math.abs(a.y - b.y) < eps;
}

function isVertical(a: Pt, b: Pt, eps = 1): boolean {
  return Math.abs(a.x - b.x) < eps;
}

export default function PipeConnectionTool({
  kernelStore,
  containerRef,
  getViewport,
  onUserEdit,
}: Props) {
  const state = useSyncExternalStore(
    useCallback((cb) => kernelStore.subscribe(cb), [kernelStore]),
    () => kernelStore.getState() as KernelState,
  );

  const [dragState, setDragState] = useState<DragState | null>(null);
  const [hoveredAnchor, setHoveredAnchor] = useState<HoverAnchor | null>(null);

  const selectedPipeIds = state.selection.nodeIds.filter((id) => {
    return state.nodesById[id]?.schemaRef?.type === 'industrial/pipe';
  });
  const selectedPipeId = selectedPipeIds.length === 1 ? selectedPipeIds[0]! : null;
  const selectedPipe = selectedPipeId ? state.nodesById[selectedPipeId] : null;

  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => {
      const container = containerRef.current;
      if (!container) return { x: screenX, y: screenY };
      const rect = container.getBoundingClientRect();
      const vp = getViewport();
      return {
        x: (screenX - rect.left - vp.offsetX) / vp.zoom,
        y: (screenY - rect.top - vp.offsetY) / vp.zoom,
      };
    },
    [containerRef, getViewport],
  );

  const worldToScreen = useCallback(
    (worldX: number, worldY: number) => {
      const container = containerRef.current;
      if (!container) return { x: worldX, y: worldY };
      const rect = container.getBoundingClientRect();
      const vp = getViewport();
      return {
        x: worldX * vp.zoom + vp.offsetX + rect.left,
        y: worldY * vp.zoom + vp.offsetY + rect.top,
      };
    },
    [containerRef, getViewport],
  );

  // We must re-create the routing logic for visual preview during drag, or read from DOM.
  // Actually, since Pipe is reactive, we only need to dispatch updates directly into kernel
  // on every mouse move to get real-time previews if we want, OR we can maintain local state.
  // We'll dispatch kernel updates directly on mouse move if segment dragging to utilize Pipe's internal router.

  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const worldPos = screenToWorld(e.clientX, e.clientY);
      setDragState((prev) => (prev ? { ...prev, currentWorldPos: worldPos } : null));

      (window as any)._thingsvisViewport = getViewport();

      if (dragState.kind === 'endpoint') {
        const detected = detectNodeAndAnchor(
          worldPos,
          { x: e.clientX, y: e.clientY },
          state,
          [dragState.pipeId],
          getViewport().zoom,
          containerRef.current,
        );
        setHoveredAnchor(detected);
      }
    };

    const handleMouseUp = () => {
      const currentState = kernelStore.getState() as any;
      const updateNode = currentState.updateNode;
      if (!updateNode) return;

      const pipeNode = state.nodesById[dragState.pipeId];
      if (!pipeNode) return;
      const currentProps = (pipeNode.schemaRef as any)?.props || {};

      if (dragState.kind === 'endpoint') {
        const propKey = dragState.endpoint === 'start' ? 'sourceNodeId' : 'targetNodeId';
        const anchorKey = dragState.endpoint === 'start' ? 'sourceAnchor' : 'targetAnchor';
        const portKey = dragState.endpoint === 'start' ? 'sourcePortId' : 'targetPortId';

        const nextProps: any = { ...currentProps };

        if (hoveredAnchor) {
          nextProps[propKey] = hoveredAnchor.nodeId;
          nextProps[anchorKey] = hoveredAnchor.anchor;
          if (hoveredAnchor.portId) {
            nextProps[portKey] = hoveredAnchor.portId;
          } else {
            delete nextProps[portKey];
          }
        } else {
          // Become free waypoint
          delete nextProps[propKey];
          delete nextProps[anchorKey];
          delete nextProps[portKey];

          let waypoints: Pt[] = currentProps.waypoints || [];
          // We need start or end based on the current worldPos
          if (dragState.endpoint === 'start') {
            waypoints = [dragState.currentWorldPos, ...waypoints];
          } else {
            waypoints = [...waypoints, dragState.currentWorldPos];
          }
          nextProps.waypoints = waypoints;
        }

        updateNode(dragState.pipeId, { props: nextProps });
        onUserEdit?.();
      } else if (dragState.kind === 'segment') {
        // Find how much dragged
        const dx = dragState.currentWorldPos.x - dragState.startWorldPos.x;
        const dy = dragState.currentWorldPos.y - dragState.startWorldPos.y;

        // We will read the pipe's internal path from the DOM before we save
        // Actually, the pipe widget rendered with new waypoints?
        // No, we didn't update node in mouseMove. Wait!
        updateNode(dragState.pipeId, {
          props: { ...currentProps, waypoints: getDraggedWaypoints(dragState) },
        });
        onUserEdit?.();
      }

      setDragState(null);
      setHoveredAnchor(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    dragState,
    containerRef,
    getViewport,
    hoveredAnchor,
    kernelStore,
    onUserEdit,
    screenToWorld,
    state,
  ]);

  useEffect(() => {
    (window as any)._connectionToolActive = !!dragState;
    return () => {
      (window as any)._connectionToolActive = false;
    };
  }, [dragState]);

  const getDraggedWaypoints = useCallback((ds: SegmentDragState): Pt[] => {
    // This is a naive translation. In reality, moving a segment adds/modifies waypoints.
    // For free pipes, we just shift all waypoints.
    // For bound pipes, shifting a segment means calculating new elbow offsets.
    // To keep it simple in v3: we translate the segment points, and rely on the widget's `simplifyOrthogonal` to clean it up.

    // Pipe components routePoints are rendered purely from waypoints via buildOrthogonalRoute.
    // If the user drags a line, we can inject intermediate waypoints.

    // Instead of complex logic: we just add waypoints.
    const dx = ds.currentWorldPos.x - ds.startWorldPos.x;
    const dy = ds.currentWorldPos.y - ds.startWorldPos.y;

    const wps = [...ds.baseWaypoints];

    // If wps is empty, it was a straight line. We need to make it an elbow by injecting a waypoint.
    if (wps.length === 0) {
      if (ds.axis === 'y') {
        // Vertical move -> insert 2 waypoints
        const midY = ds.startWorldPos.y + dy;
        return [
          { x: ds.baseStart.x, y: midY },
          { x: ds.baseEnd.x, y: midY },
        ];
      } else {
        const midX = ds.startWorldPos.x + dx;
        return [
          { x: midX, y: ds.baseStart.y },
          { x: midX, y: ds.baseEnd.y },
        ];
      }
    }

    // TODO: More advanced segment drag logic can be added later.
    return wps.map((p) => ({
      x: p.x + (ds.axis === 'x' ? dx : 0),
      y: p.y + (ds.axis === 'y' ? dy : 0),
    }));
  }, []);

  const routePoints = useMemo(() => {
    if (!selectedPipeId) return null;
    const domSvg = document.querySelector(
      `.thingsvis-widget-layer [data-node-id="${selectedPipeId}"] svg`,
    );
    const path = domSvg?.querySelector('path');
    if (!path) return null;

    const d = path.getAttribute('d');
    if (!d) return null;

    // Parse SVG D to world points
    const nums = d.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
    const points: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < nums.length; i += 2) {
      points.push({ x: nums[i]!, y: nums[i + 1]! });
    }

    const containerEl = domSvg?.parentElement;
    if (containerEl) {
      const offsetX = parseFloat(containerEl.style.left || '0');
      const offsetY = parseFloat(containerEl.style.top || '0');
      return points.map((p) => ({ x: p.x + offsetX, y: p.y + offsetY }));
    }
    return points;
  }, [state, selectedPipeId, dragState]);

  if (!selectedPipeId || !selectedPipe || !routePoints || routePoints.length < 2) return null;

  const schema = selectedPipe.schemaRef as any;
  const props = schema.props || {};

  const handleSize = 14;

  const renderEndpointHandle = (worldPos: Pt, endpoint: 'start' | 'end') => {
    const isDragging = dragState?.kind === 'endpoint' && dragState.endpoint === endpoint;
    const isConnected = endpoint === 'start' ? !!props.sourceNodeId : !!props.targetNodeId;
    const displayWorldPos = isDragging ? dragState.currentWorldPos : worldPos;
    const screenPos = worldToScreen(displayWorldPos.x, displayWorldPos.y);
    const borderColor = isConnected ? 'border-green-500' : 'border-[#6965db]';
    const hoverBg = isConnected ? 'hover:bg-green-500/20' : 'hover:bg-[#6965db]/20';

    return (
      <div
        key={endpoint}
        className={`absolute rounded-full border-2 cursor-grab transition-all duration-75 ${
          isDragging
            ? 'bg-blue-500 border-blue-600 scale-125 shadow-lg'
            : `bg-white ${borderColor} ${hoverBg} hover:scale-110`
        }`}
        style={{
          left: screenPos.x - handleSize / 2,
          top: screenPos.y - handleSize / 2,
          width: handleSize,
          height: handleSize,
          zIndex: 1000,
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragState({
            kind: 'endpoint',
            pipeId: selectedPipeId,
            endpoint,
            startWorldPos: displayWorldPos,
            currentWorldPos: displayWorldPos,
          });
        }}
        onDoubleClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const currentState = kernelStore.getState() as any;
          const updateNode = currentState.updateNode;
          if (!updateNode) return;
          const propKey = endpoint === 'start' ? 'sourceNodeId' : 'targetNodeId';
          const anchorKey = endpoint === 'start' ? 'sourceAnchor' : 'targetAnchor';
          const portKey = endpoint === 'start' ? 'sourcePortId' : 'targetPortId';
          if (props[propKey]) {
            const nextProps = { ...props };
            delete nextProps[propKey];
            delete nextProps[anchorKey];
            delete nextProps[portKey];
            // Push to waypoints
            let waypoints = nextProps.waypoints || [];
            if (endpoint === 'start') waypoints = [routePoints[0], ...waypoints];
            else waypoints = [...waypoints, routePoints[routePoints.length - 1]];
            nextProps.waypoints = waypoints;
            updateNode(selectedPipeId, { props: nextProps });
            onUserEdit?.();
          }
        }}
        title={isConnected ? '双击断开连接' : '拖动连接到其他组件'}
      />
    );
  };

  const renderSegmentHandles = () => {
    // Basic segment handles for Pipe
    return routePoints.slice(0, -1).map((point, index) => {
      const next = routePoints[index + 1]!;
      const dx = next.x - point.x;
      const dy = next.y - point.y;
      const horizontal = Math.abs(dx) >= Math.abs(dy);
      const axis: 'x' | 'y' = horizontal ? 'y' : 'x';
      const isEdgeSegment = index === 0 || index === routePoints.length - 2;

      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return null;

      const mid = { x: (point.x + next.x) / 2, y: (point.y + next.y) / 2 };
      const screenPos = worldToScreen(mid.x, mid.y);
      const isDragging = dragState?.kind === 'segment' && dragState.segmentIndex === index;

      // In v3, we support basic handle rendering. Dragging requires `getDraggedWaypoints` enhancements.
      return (
        <div
          key={`segment-${index}`}
          className={`absolute rounded border transition-all duration-75 ${
            isDragging
              ? 'bg-orange-500 border-orange-600 shadow-lg'
              : 'bg-white/90 border-orange-400 hover:bg-orange-50'
          }`}
          style={{
            left: screenPos.x - 9,
            top: screenPos.y - 9,
            width: 18,
            height: 18,
            zIndex: isEdgeSegment ? 998 : 999,
            cursor: axis === 'x' ? 'col-resize' : 'row-resize',
            pointerEvents: 'auto',
          }}
          onMouseDown={(e) => {
            if (e.detail >= 2) return;
            e.preventDefault();
            e.stopPropagation();
            setDragState({
              kind: 'segment',
              pipeId: selectedPipeId,
              segmentIndex: index,
              axis,
              baseWaypoints: Array.isArray(props.waypoints) ? props.waypoints : [],
              baseStart: routePoints[0]!,
              baseEnd: routePoints[routePoints.length - 1]!,
              startWorldPos: screenToWorld(e.clientX, e.clientY),
              currentWorldPos: screenToWorld(e.clientX, e.clientY),
            });
          }}
          onDoubleClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const currentState = kernelStore.getState() as any;
            currentState.updateNode?.(selectedPipeId, {
              props: { ...props, waypoints: [] }, // Reset route
            });
            onUserEdit?.();
          }}
          title={
            axis === 'x'
              ? '拖动调整竖向管段，双击恢复默认路由'
              : '拖动调整横向管段，双击恢复默认路由'
          }
        />
      );
    });
  };

  const renderDragLine = () => {
    if (!dragState || dragState.kind !== 'endpoint') return null;
    const otherEndpoint =
      dragState.endpoint === 'start' ? routePoints[routePoints.length - 1]! : routePoints[0]!;
    const startScreenPos = worldToScreen(otherEndpoint.x, otherEndpoint.y);
    const endScreenPos = worldToScreen(dragState.currentWorldPos.x, dragState.currentWorldPos.y);

    return (
      <svg className="fixed inset-0 pointer-events-none" style={{ zIndex: 999 }}>
        <line
          x1={startScreenPos.x}
          y1={startScreenPos.y}
          x2={endScreenPos.x}
          y2={endScreenPos.y}
          stroke="#6965db"
          strokeWidth={2}
          strokeDasharray="6 4"
        />
      </svg>
    );
  };

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 998 }}>
      <PortOverlay hoveredAnchor={hoveredAnchor} worldToScreen={worldToScreen} state={state} />
      <div className="pointer-events-auto">
        {renderEndpointHandle(routePoints[0]!, 'start')}
        {renderEndpointHandle(routePoints[routePoints.length - 1]!, 'end')}
        {renderSegmentHandles()}
      </div>
      {renderDragLine()}
    </div>
  );
}
