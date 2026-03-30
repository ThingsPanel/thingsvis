import React from 'react';
import type { KernelState } from '@thingsvis/kernel';

export type AnchorType = 'top' | 'right' | 'bottom' | 'left' | 'center';

export type HoverAnchor = {
  nodeId: string;
  portId?: string;
  anchor: AnchorType;
  x: number;
  y: number;
  active?: boolean;
};

export function getAnchorWorldPosition(node: any, anchor: AnchorType): { x: number; y: number } {
  const pos = node.position || { x: 0, y: 0 };
  const size = node.size || { width: 100, height: 100 };
  const cx = pos.x + size.width / 2;
  const cy = pos.y + size.height / 2;

  switch (anchor) {
    case 'top':
      return { x: cx, y: pos.y };
    case 'right':
      return { x: pos.x + size.width, y: cy };
    case 'bottom':
      return { x: cx, y: pos.y + size.height };
    case 'left':
      return { x: pos.x, y: cy };
    case 'center':
    default:
      return { x: cx, y: cy };
  }
}

export function detectNodeAndAnchor(
  worldPos: { x: number; y: number },
  screenPos: { x: number; y: number },
  state: KernelState,
  excludeNodeIds: string[],
  zoom: number,
  container: HTMLElement | null,
): HoverAnchor | null {
  // 1. Precise DOM-based hit testing for custom SVG ports first
  if (container) {
    const elements = document.elementsFromPoint(screenPos.x, screenPos.y);
    for (const el of elements) {
      const portEl = el.closest?.('[data-port-id]') as HTMLElement | null;
      const nodeEl = el.closest?.('[data-node-id]') as HTMLElement | null;

      if (portEl && nodeEl) {
        const nodeId = nodeEl.getAttribute('data-node-id');
        const portId = portEl.getAttribute('data-port-id');
        if (nodeId && portId && !excludeNodeIds.includes(nodeId) && state.nodesById[nodeId]) {
          const rect = portEl.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;

          // Map back to world coordinate for snapping precisely exactly to port center
          const containerRect = container.getBoundingClientRect();
          const vp = (window as any)._thingsvisViewport || { offsetX: 0, offsetY: 0 };
          const worldCenterX = (cx - containerRect.left - vp.offsetX) / zoom;
          const worldCenterY = (cy - containerRect.top - vp.offsetY) / zoom;

          return {
            nodeId,
            portId,
            anchor: 'center', // SVG ports act as a unified connection point
            x: worldCenterX,
            y: worldCenterY,
          };
        }
      }
    }
  }

  // 2. Fallback to general AABB testing
  const nodes = Object.values(state.nodesById);
  for (const node of nodes) {
    if (excludeNodeIds.includes(node.id)) continue;
    if (!node.visible) continue;
    // skip connector nodes for general AABB
    if (node.schemaRef?.type === 'basic/line' || node.schemaRef?.type === 'industrial/pipe')
      continue;

    const schema = node.schemaRef as any;
    const pos = schema.position || { x: 0, y: 0 };
    const size = schema.size || { width: 100, height: 100 };
    const padding = 30;

    if (
      worldPos.x >= pos.x - padding &&
      worldPos.x <= pos.x + size.width + padding &&
      worldPos.y >= pos.y - padding &&
      worldPos.y <= pos.y + size.height + padding
    ) {
      const anchors: AnchorType[] = ['top', 'right', 'bottom', 'left', 'center'];
      let closestAnchor: AnchorType = 'center';
      let closestDist = Infinity;
      let closestWorldPos = { x: 0, y: 0 };

      for (const anchor of anchors) {
        const anchorPos = getAnchorWorldPosition(schema, anchor);
        const dist = Math.hypot(worldPos.x - anchorPos.x, worldPos.y - anchorPos.y);
        if (dist < closestDist) {
          closestDist = dist;
          closestAnchor = anchor;
          closestWorldPos = anchorPos;
        }
      }

      return {
        nodeId: node.id,
        anchor: closestAnchor,
        x: closestWorldPos.x,
        y: closestWorldPos.y,
      };
    }
  }

  return null;
}

type PortOverlayProps = {
  hoveredAnchor: HoverAnchor | null;
  worldToScreen: (wx: number, wy: number) => { x: number; y: number };
  state: KernelState;
};

export const PortOverlay: React.FC<PortOverlayProps> = ({
  hoveredAnchor,
  worldToScreen,
  state,
}) => {
  if (!hoveredAnchor) return null;

  // Render highlighted node boundary
  let highlightNode = null;
  if (hoveredAnchor.nodeId) {
    const node = state.nodesById[hoveredAnchor.nodeId];
    if (node) {
      const schema = node.schemaRef as any;
      const pos = schema.position || { x: 0, y: 0 };
      const size = schema.size || { width: 100, height: 100 };
      const topLeft = worldToScreen(pos.x, pos.y);
      const bottomRight = worldToScreen(pos.x + size.width, pos.y + size.height);

      highlightNode = (
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
    }
  }

  // Render available anchors if using AABB logic (not a specific custom SVG port ID)
  let anchorsView = null;
  if (hoveredAnchor.nodeId && !hoveredAnchor.portId) {
    const node = state.nodesById[hoveredAnchor.nodeId];
    if (node) {
      const schema = node.schemaRef as any;
      const anchors: AnchorType[] = ['top', 'right', 'bottom', 'left', 'center'];
      anchorsView = anchors.map((anchor) => {
        const anchorPos = getAnchorWorldPosition(schema, anchor);
        const screenPos = worldToScreen(anchorPos.x, anchorPos.y);
        const isActive = anchor === hoveredAnchor.anchor;
        const anchorSize = isActive ? 16 : 10;

        return (
          <div
            key={anchor}
            className={`absolute rounded-full border-2 pointer-events-none transition-all duration-100 ${
              isActive ? 'bg-green-500 border-green-600 shadow-lg' : 'bg-white border-gray-400'
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
    }
  }

  // Render specific SVG port highlight if hovering over one
  let activePortView = null;
  if (hoveredAnchor.portId) {
    const screenPos = worldToScreen(hoveredAnchor.x, hoveredAnchor.y);
    const anchorSize = 16;
    activePortView = (
      <div
        className="absolute rounded border-2 bg-green-500 border-green-600 shadow-lg pointer-events-none transition-all duration-100"
        style={{
          left: screenPos.x - anchorSize / 2,
          top: screenPos.y - anchorSize / 2,
          width: anchorSize,
          height: anchorSize,
          zIndex: 1002,
          transform: 'rotate(45deg)',
        }}
      />
    );
  }

  return (
    <>
      {highlightNode}
      {anchorsView}
      {activePortView}
    </>
  );
};
