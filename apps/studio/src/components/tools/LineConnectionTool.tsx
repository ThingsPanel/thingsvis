import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { KernelStore, KernelState } from '@thingsvis/kernel';
import {
  detectNodeAndAnchor,
  PortOverlay,
  type AnchorType,
  type HoverAnchor,
  getAnchorWorldPosition,
} from './PortOverlay';

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
  lineId: string;
  endpoint: 'start' | 'end';
  startWorldPos: { x: number; y: number };
  currentWorldPos: { x: number; y: number };
};

export default function LineConnectionTool({
  kernelStore,
  containerRef,
  getViewport,
  onUserEdit,
}: Props) {
  const state = useSyncExternalStore(
    useCallback((cb) => kernelStore.subscribe(cb), [kernelStore]),
    () => kernelStore.getState() as KernelState,
  );

  const [dragState, setDragState] = useState<EndpointDragState | null>(null);
  const [hoveredAnchor, setHoveredAnchor] = useState<HoverAnchor | null>(null);

  const selectedLineIds = state.selection.nodeIds.filter((id) => {
    return state.nodesById[id]?.schemaRef?.type === 'basic/line';
  });
  const selectedLineId = selectedLineIds.length === 1 ? selectedLineIds[0]! : null;
  const selectedLine = selectedLineId ? state.nodesById[selectedLineId] : null;

  const getPreviewTranslate = useCallback((nodeId?: string | null) => {
    // Line uses endpoints calculation. Typically lines don't use node-drag-preview directly
    // but rely on full reactivity from KernelStore. We'll simplify this in v3.
    return { x: 0, y: 0 };
  }, []);

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

  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const worldPos = screenToWorld(e.clientX, e.clientY);
      setDragState((prev) => (prev ? { ...prev, currentWorldPos: worldPos } : null));

      (window as any)._thingsvisViewport = getViewport();
      const detected = detectNodeAndAnchor(
        worldPos,
        { x: e.clientX, y: e.clientY },
        state,
        [dragState.lineId],
        getViewport().zoom,
        containerRef.current,
      );
      setHoveredAnchor(detected);
    };

    const handleMouseUp = () => {
      const currentState = kernelStore.getState() as any;
      const updateNode = currentState.updateNode;
      if (!updateNode) return;

      const lineNode = state.nodesById[dragState.lineId];
      if (!lineNode) return;
      const currentProps = (lineNode.schemaRef as any)?.props || {};

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
        delete nextProps[propKey];
        delete nextProps[anchorKey];
        delete nextProps[portKey];
      }

      // Update basic/line position implicitly by setting points correctly based on bounds
      // The line component resolves its own bounds during next render tick.
      // But we need to write the unlinked points.
      if (!hoveredAnchor) {
        // If unlinked, we set the manual line point
        const points = [...(Array.isArray(currentProps.points) ? currentProps.points : [])];
        if (dragState.endpoint === 'start') {
          points[0] = dragState.currentWorldPos;
        } else {
          points[points.length - 1] = dragState.currentWorldPos;
        }
        nextProps.points = points;
      }

      updateNode(dragState.lineId, { props: nextProps });
      onUserEdit?.();

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

  if (!selectedLineId || !selectedLine) return null;

  const schema = selectedLine.schemaRef as any;
  const props = schema.props || {};
  const linePos = schema.position || { x: 0, y: 0 };
  const size = schema.size || { width: 100, height: 100 };
  const rawPoints = Array.isArray(props.points) ? props.points : [];

  let startWorld = { x: linePos.x, y: linePos.y + size.height / 2 };
  let endWorld = { x: linePos.x + size.width, y: linePos.y + size.height / 2 };

  if (props.sourceNodeId && state.nodesById[props.sourceNodeId]) {
    const boundSchema = state.nodesById[props.sourceNodeId]!.schemaRef as any;
    startWorld = getAnchorWorldPosition(boundSchema, props.sourceAnchor || 'center');
    // If exact port exists and is known, we could map it exactly, but standard getAnchor is usually close enough for overlay
  } else if (rawPoints.length >= 2) {
    startWorld = rawPoints[0]; // the world position from schema if manually disconnected
  }

  if (props.targetNodeId && state.nodesById[props.targetNodeId]) {
    const boundSchema = state.nodesById[props.targetNodeId]!.schemaRef as any;
    endWorld = getAnchorWorldPosition(boundSchema, props.targetAnchor || 'center');
  } else if (rawPoints.length >= 2) {
    endWorld = rawPoints[rawPoints.length - 1];
  }

  const handleSize = 14;

  const renderHandle = (worldPos: { x: number; y: number }, endpoint: 'start' | 'end') => {
    const isDragging = dragState?.endpoint === endpoint;
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
            lineId: selectedLineId,
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
            // Initialize unlinked points
            const nextPoints = [...rawPoints];
            if (nextPoints.length === 0) {
              nextPoints.push(startWorld);
              nextPoints.push(endWorld);
            }
            if (endpoint === 'start') nextPoints[0] = startWorld;
            else nextPoints[nextPoints.length - 1] = endWorld;
            nextProps.points = nextPoints;

            updateNode(selectedLineId, { props: nextProps });
            onUserEdit?.();
          }
        }}
        title={isConnected ? '双击断开连接' : '拖动连接到其他组件'}
      />
    );
  };

  const renderDragLine = () => {
    if (!dragState) return null;
    const otherEndpoint = dragState.endpoint === 'start' ? endWorld : startWorld;
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
        {renderHandle(startWorld, 'start')}
        {renderHandle(endWorld, 'end')}
      </div>
      {renderDragLine()}
    </div>
  );
}
