import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { KernelStore, KernelState } from '@thingsvis/kernel';

type Props = {
  kernelStore: KernelStore;
  containerRef: React.RefObject<HTMLElement>;
  getViewport: () => { width: number; height: number; zoom: number; offsetX: number; offsetY: number };
  onUserEdit?: () => void;
};

type AnchorType = 'top' | 'right' | 'bottom' | 'left' | 'center';

type DragState = {
  lineId: string;
  endpoint: 'start' | 'end';
  startWorldPos: { x: number; y: number };
  currentWorldPos: { x: number; y: number };
};

/**
 * LineConnectionTool
 * 
 * 处理线条组件的连接交互：
 * 1. 选中线条时显示端点连接手柄
 * 2. 拖动手柄到其他组件时显示锚点
 * 3. 释放时自动连接
 */
export default function LineConnectionTool({ kernelStore, containerRef, getViewport, onUserEdit }: Props) {
  const state = useSyncExternalStore(
    useCallback((cb) => kernelStore.subscribe(cb), [kernelStore]),
    () => kernelStore.getState() as KernelState
  );

  const [dragState, setDragState] = useState<DragState | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredAnchor, setHoveredAnchor] = useState<AnchorType | null>(null);

  // Keep latest endpoints available to event handlers (mouse up is registered once)
  const endpointsRef = useRef<{ start: { x: number; y: number }; end: { x: number; y: number } } | null>(null);

  // 获取选中的线条组件
  const selectedLineIds = state.selection.nodeIds.filter((id) => {
    const node = state.nodesById[id];
    return node?.schemaRef?.type === 'basic/line';
  });

  const selectedLineId = selectedLineIds.length === 1 ? selectedLineIds[0] : null;
  const selectedLine = selectedLineId ? state.nodesById[selectedLineId] : null;

  // 获取节点锚点的世界坐标
  function getAnchorWorldPosition(schema: any, anchor: AnchorType): { x: number; y: number } {
    const pos = schema.position || { x: 0, y: 0 };
    const size = schema.size || { width: 100, height: 100 };
    const cx = pos.x + size.width / 2;
    const cy = pos.y + size.height / 2;
    
    switch (anchor) {
      case 'top': return { x: cx, y: pos.y };
      case 'right': return { x: pos.x + size.width, y: cy };
      case 'bottom': return { x: cx, y: pos.y + size.height };
      case 'left': return { x: pos.x, y: cy };
      case 'center':
      default: return { x: cx, y: cy };
    }
  }

  // 获取线条的端点世界坐标
  // 优先使用节点绑定的锚点；否则使用 props.points；再否则回退到线条 bbox 左右中心。
  const getEndpointWorldPositions = useCallback(() => {
    if (!selectedLine) return null;
    
    const schema = selectedLine.schemaRef as any;
    const pos = schema.position || { x: 0, y: 0 };
    const size = schema.size || { width: 200, height: 40 };
    const props = schema.props || {};

    const resolveBound = (nodeId?: string, anchor?: AnchorType) => {
      if (!nodeId) return null;
      const boundNode = state.nodesById[nodeId];
      if (!boundNode) return null;
      return getAnchorWorldPosition(boundNode.schemaRef as any, (anchor || 'center') as AnchorType);
    };

    const startBound = resolveBound(props.sourceNodeId, props.sourceAnchor);
    const endBound = resolveBound(props.targetNodeId, props.targetAnchor);
    if (startBound || endBound) {
      // If only one end is bound, keep the other end from points/bbox.
      const fallback = () => {
        const pts = Array.isArray(props.points) ? props.points : null;
        if (pts && pts.length >= 2) {
          const first = pts[0];
          const last = pts[pts.length - 1];
          const normalized =
            [first, last].every((p) => typeof p?.x === 'number' && typeof p?.y === 'number') &&
            Math.max(first.x, first.y, last.x, last.y) <= 1;
          const fx = normalized ? first.x * size.width : first.x;
          const fy = normalized ? first.y * size.height : first.y;
          const lx = normalized ? last.x * size.width : last.x;
          const ly = normalized ? last.y * size.height : last.y;
          return {
            start: { x: pos.x + fx, y: pos.y + fy },
            end: { x: pos.x + lx, y: pos.y + ly },
          };
        }
        return {
          start: { x: pos.x, y: pos.y + size.height / 2 },
          end: { x: pos.x + size.width, y: pos.y + size.height / 2 },
        };
      };

      const fb = fallback();
      return {
        start: startBound ?? fb.start,
        end: endBound ?? fb.end,
      };
    }

    // Not bound: try explicit points.
    const pts = Array.isArray(props.points) ? props.points : null;
    if (pts && pts.length >= 2) {
      const first = pts[0];
      const last = pts[pts.length - 1];
      const normalized =
        [first, last].every((p) => typeof p?.x === 'number' && typeof p?.y === 'number') &&
        Math.max(first.x, first.y, last.x, last.y) <= 1;
      const fx = normalized ? first.x * size.width : first.x;
      const fy = normalized ? first.y * size.height : first.y;
      const lx = normalized ? last.x * size.width : last.x;
      const ly = normalized ? last.y * size.height : last.y;
      return {
        start: { x: pos.x + fx, y: pos.y + fy },
        end: { x: pos.x + lx, y: pos.y + ly },
      };
    }
    
    // Fallback: bbox left/right center
    const startPos = { x: pos.x, y: pos.y + size.height / 2 };
    const endPos = { x: pos.x + size.width, y: pos.y + size.height / 2 };
    return { start: startPos, end: endPos };
  }, [selectedLine]);

  // 将屏幕坐标转换为世界坐标
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    const container = containerRef.current;
    if (!container) return { x: screenX, y: screenY };
    
    const rect = container.getBoundingClientRect();
    const vp = getViewport();
    
    // 屏幕坐标 → 容器内局部坐标 → 缩放变换还原 → 世界坐标
    const localX = screenX - rect.left;
    const localY = screenY - rect.top;
    const x = (localX - vp.offsetX) / vp.zoom;
    const y = (localY - vp.offsetY) / vp.zoom;
    
    return { x, y };
  }, [containerRef, getViewport]);

  // 将世界坐标转换为屏幕坐标
  const worldToScreen = useCallback((worldX: number, worldY: number) => {
    const container = containerRef.current;
    if (!container) return { x: worldX, y: worldY };
    
    const rect = container.getBoundingClientRect();
    const vp = getViewport();
    
    // 世界坐标 → 缩放变换 → 容器内局部坐标 → 屏幕坐标
    const x = worldX * vp.zoom + vp.offsetX + rect.left;
    const y = worldY * vp.zoom + vp.offsetY + rect.top;
    
    return { x, y };
  }, [containerRef, getViewport]);

  // 检测鼠标位置下的节点和最近锚点
  const detectNodeAndAnchor = useCallback((worldPos: { x: number; y: number }) => {
    const nodes = Object.values(state.nodesById);
    
    for (const node of nodes) {
      if (node.id === selectedLineId) continue; // 跳过当前线条
      if (node.schemaRef?.type === 'basic/line') continue; // 跳过其他线条
      if (!node.visible) continue;
      
      const schema = node.schemaRef as any;
      const pos = schema.position || { x: 0, y: 0 };
      const size = schema.size || { width: 100, height: 100 };
      
      // 检查是否在节点范围内（扩大检测区域）
      const padding = 30;
      if (
        worldPos.x >= pos.x - padding &&
        worldPos.x <= pos.x + size.width + padding &&
        worldPos.y >= pos.y - padding &&
        worldPos.y <= pos.y + size.height + padding
      ) {
        // 找到最近的锚点
        const anchors: AnchorType[] = ['top', 'right', 'bottom', 'left', 'center'];
        let closestAnchor: AnchorType = 'center';
        let closestDist = Infinity;
        
        for (const anchor of anchors) {
          const anchorPos = getAnchorWorldPosition(schema, anchor);
          const dist = Math.hypot(worldPos.x - anchorPos.x, worldPos.y - anchorPos.y);
          if (dist < closestDist) {
            closestDist = dist;
            closestAnchor = anchor;
          }
        }
        
        return { nodeId: node.id, anchor: closestAnchor };
      }
    }
    
    return null;
  }, [state.nodesById, selectedLineId]);

  // 处理手柄拖拽开始
  const handleHandleMouseDown = useCallback((endpoint: 'start' | 'end', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!selectedLineId) return;
    
    const worldPos = screenToWorld(e.clientX, e.clientY);
    
    setDragState({
      lineId: selectedLineId,
      endpoint,
      startWorldPos: worldPos,
      currentWorldPos: worldPos,
    });
  }, [selectedLineId, screenToWorld]);

  // 处理双击手柄：断开连接
  const handleHandleDoubleClick = useCallback((endpoint: 'start' | 'end', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!selectedLineId) return;
    
    const currentState = kernelStore.getState() as any;
    const updateNode = currentState.updateNode;
    if (!updateNode) return;
    
    const node = state.nodesById[selectedLineId];
    const currentProps = (node?.schemaRef as any)?.props || {};
    
    const propKey = endpoint === 'start' ? 'sourceNodeId' : 'targetNodeId';
    const anchorKey = endpoint === 'start' ? 'sourceAnchor' : 'targetAnchor';
    
    // 如果当前端点有连接，则断开
    if (currentProps[propKey]) {
      const newProps = { ...currentProps };
      delete newProps[propKey];
      delete newProps[anchorKey];
      
      updateNode(selectedLineId, { props: newProps });
      onUserEdit?.();
    }
  }, [selectedLineId, kernelStore, state.nodesById, onUserEdit]);

  // 处理全局鼠标移动
  useEffect(() => {
    if (!dragState) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const worldPos = screenToWorld(e.clientX, e.clientY);
      setDragState((prev) => prev ? { ...prev, currentWorldPos: worldPos } : null);
      
      // 检测悬停的节点和锚点
      const detected = detectNodeAndAnchor(worldPos);
      if (detected) {
        setHoveredNodeId(detected.nodeId);
        setHoveredAnchor(detected.anchor);
      } else {
        setHoveredNodeId(null);
        setHoveredAnchor(null);
      }
    };
    
    const handleMouseUp = () => {
      if (dragState) {
        const currentState = kernelStore.getState() as any;
        const updateNode = currentState.updateNode;
        if (updateNode) {
          const lineNode = state.nodesById[dragState.lineId];
          const lineSchema = lineNode?.schemaRef as any;
          const currentProps = lineSchema?.props || {};

          const propKey = dragState.endpoint === 'start' ? 'sourceNodeId' : 'targetNodeId';
          const anchorKey = dragState.endpoint === 'start' ? 'sourceAnchor' : 'targetAnchor';

          // Determine new props:
          // - drop on anchor => connect
          // - drop on empty => disconnect that endpoint
          const nextProps: any = { ...currentProps };
          if (hoveredNodeId && hoveredAnchor) {
            nextProps[propKey] = hoveredNodeId;
            nextProps[anchorKey] = hoveredAnchor;
          } else {
            delete nextProps[propKey];
            delete nextProps[anchorKey];
          }

          const latest = endpointsRef.current;
          if (latest) {
            const otherEndpoint = dragState.endpoint === 'start' ? latest.end : latest.start;
            const dragged =
              hoveredNodeId && hoveredAnchor && state.nodesById[hoveredNodeId]
                ? getAnchorWorldPosition((state.nodesById[hoveredNodeId].schemaRef as any) || {}, hoveredAnchor)
                : dragState.currentWorldPos;

            // If dropped on an anchor, snap to the anchor world position.
            const a = dragState.endpoint === 'start' ? dragged : otherEndpoint;
            const b = dragState.endpoint === 'start' ? otherEndpoint : dragged;

            const padding = 24;
            const minX = Math.min(a.x, b.x) - padding;
            const minY = Math.min(a.y, b.y) - padding;
            const maxX = Math.max(a.x, b.x) + padding;
            const maxY = Math.max(a.y, b.y) + padding;
            const nextPosition = { x: minX, y: minY };
            const nextSize = {
              width: Math.max(40, maxX - minX),
              height: Math.max(40, maxY - minY),
            };

            const points = [
              { x: a.x - nextPosition.x, y: a.y - nextPosition.y },
              { x: b.x - nextPosition.x, y: b.y - nextPosition.y },
            ];

            updateNode(dragState.lineId, {
              props: { ...nextProps, points },
              position: nextPosition,
              size: nextSize,
            });
            onUserEdit?.();
          } else {
            updateNode(dragState.lineId, { props: nextProps });
            onUserEdit?.();
          }
        }
      }

      setDragState(null);
      setHoveredNodeId(null);
      setHoveredAnchor(null);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, hoveredNodeId, hoveredAnchor, kernelStore, state.nodesById, screenToWorld, detectNodeAndAnchor, onUserEdit]);

  // 如果没有选中线条，不渲染
  if (!selectedLineId || !selectedLine) {
    return null;
  }

  const endpoints = getEndpointWorldPositions();
  if (!endpoints) {
    return null;
  }

  endpointsRef.current = endpoints;

  const handleSize = 14;

  // 检查端点是否已连接
  const isEndpointConnected = (endpoint: 'start' | 'end') => {
    const schema = selectedLine.schemaRef as any;
    const props = schema.props || {};
    return endpoint === 'start' ? !!props.sourceNodeId : !!props.targetNodeId;
  };

  // 渲染端点手柄
  const renderHandle = (worldPos: { x: number; y: number }, endpoint: 'start' | 'end') => {
    const isDragging = dragState?.endpoint === endpoint;
    const isConnected = isEndpointConnected(endpoint);
    const displayWorldPos = isDragging && dragState ? dragState.currentWorldPos : worldPos;
    const screenPos = worldToScreen(displayWorldPos.x, displayWorldPos.y);
    
    // 已连接的端点显示绿色，未连接显示紫色
    const baseColor = isConnected ? 'green' : '[#6965db]';
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
        onMouseDown={(e) => handleHandleMouseDown(endpoint, e)}
        onDoubleClick={(e) => handleHandleDoubleClick(endpoint, e)}
        title={isConnected ? '双击断开连接' : '拖动连接到其他组件'}
      />
    );
  };

  // 渲染连接线（拖拽时显示）
  const renderDragLine = () => {
    if (!dragState) return null;
    
    // 获取拖拽起点：如果是 start 端点，用 end 作为起点，反之亦然
    const otherEndpoint = dragState.endpoint === 'start' ? endpoints.end : endpoints.start;
    const startScreenPos = worldToScreen(otherEndpoint.x, otherEndpoint.y);
    const endScreenPos = worldToScreen(dragState.currentWorldPos.x, dragState.currentWorldPos.y);
    
    return (
      <svg
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 999 }}
      >
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

  // 渲染悬停节点的锚点
  const renderHoveredAnchors = () => {
    if (!hoveredNodeId) return null;
    
    const node = state.nodesById[hoveredNodeId];
    if (!node) return null;
    
    const schema = node.schemaRef as any;
    const anchors: AnchorType[] = ['top', 'right', 'bottom', 'left', 'center'];
    
    return anchors.map((anchor) => {
      const anchorPos = getAnchorWorldPosition(schema, anchor);
      const screenPos = worldToScreen(anchorPos.x, anchorPos.y);
      const isActive = anchor === hoveredAnchor;
      const anchorSize = isActive ? 16 : 10;
      
      return (
        <div
          key={anchor}
          className={`absolute rounded-full border-2 pointer-events-none transition-all duration-100 ${
            isActive 
              ? 'bg-green-500 border-green-600 shadow-lg' 
              : 'bg-white border-gray-400'
          }`}
          style={{
            left: screenPos.x - anchorSize / 2,
            top: screenPos.y - anchorSize / 2,
            width: anchorSize,
            height: anchorSize,
            zIndex: 1001,
          }}
        />
      );
    });
  };

  // 渲染节点高亮边框
  const renderNodeHighlight = () => {
    if (!hoveredNodeId) return null;
    
    const node = state.nodesById[hoveredNodeId];
    if (!node) return null;
    
    const schema = node.schemaRef as any;
    const pos = schema.position || { x: 0, y: 0 };
    const size = schema.size || { width: 100, height: 100 };
    
    const topLeft = worldToScreen(pos.x, pos.y);
    const bottomRight = worldToScreen(pos.x + size.width, pos.y + size.height);
    
    return (
      <div
        className="absolute border-2 border-green-500 border-dashed pointer-events-none"
        style={{
          left: topLeft.x,
          top: topLeft.y,
          width: bottomRight.x - topLeft.x,
          height: bottomRight.y - topLeft.y,
          zIndex: 998,
          borderRadius: 4,
        }}
      />
    );
  };

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 998 }}>
      {/* Debug indicator */}
      <div style={{ position: 'fixed', top: 10, left: 10, background: 'yellow', padding: 5, zIndex: 9999 }}>
        Line selected: {selectedLineId?.slice(0,8)}
      </div>
      
      {/* 节点高亮 */}
      {renderNodeHighlight()}
      
      {/* 端点手柄 */}
      <div className="pointer-events-auto">
        {renderHandle(endpoints.start, 'start')}
        {renderHandle(endpoints.end, 'end')}
      </div>
      
      {/* 拖拽线 */}
      {renderDragLine()}
      
      {/* 悬停锚点 */}
      {renderHoveredAnchors()}
    </div>
  );
}
