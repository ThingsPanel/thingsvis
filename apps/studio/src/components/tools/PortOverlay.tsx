/**
 * PortOverlay
 *
 * Renders hover feedback for connector endpoints:
 *   - Green dot at the active anchor (replaces the old 5-dot noisy display)
 *   - Rotated diamond at a specific SVG port (if hovered)
 *
 * All world-to-screen conversions go through the geometry module so that
 * anchor positions are always rotation-consistent with what's rendered.
 */

import React from 'react';
import type { KernelState } from '@thingsvis/kernel';
import {
  getAllAnchorsWorld,
  closestAnchor,
  nodeToLayout,
  type AnchorId,
  type Viewport,
} from '../../lib/canvas/nodeLayoutTransform';

export type { Viewport };
export type { AnchorId };
export type { Pt } from '../../lib/canvas/nodeLayoutTransform';

export type HoverAnchor = {
  nodeId: string;
  portId?: string;
  anchor: AnchorId;
  x: number;
  y: number;
};

/** Convert screen rect center + viewport into world-space position.
 *  Used when a DOM port element is hit directly. */
export function screenRectToWorld(
  rect: DOMRect,
  viewport: Viewport,
  containerRect: DOMRect,
): { x: number; y: number } {
  return {
    x: (rect.left + rect.width / 2 - containerRect.left - viewport.offsetX) / viewport.zoom,
    y: (rect.top + rect.height / 2 - containerRect.top - viewport.offsetY) / viewport.zoom,
  };
}

/** Hit-test a world-space point against nodes.
 *
 * Strategy:
 *   1. DOM-based port hit (via elementsFromPoint) — finds precise SVG ports.
 *   2. Rotation-aware AABB + closest-anchor fallback.
 *
 * NOTE: After a node is rotated, its visual bbox no longer aligns with the
 * unrotated position/size in the schema. This function uses the geometry
 * module so that anchor positions stay consistent with the CSS-transformed
 * proxy node in CanvasView.
 */
export function detectNodeAndAnchor(
  worldPos: { x: number; y: number },
  screenPos: { x: number; y: number },
  state: KernelState,
  excludeNodeIds: string[],
  viewport: Viewport,
  container: HTMLElement | null,
): HoverAnchor | null {
  // 1. Precise DOM-based port hit
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
          const containerRect = container.getBoundingClientRect();
          const worldCenter = screenRectToWorld(rect, viewport, containerRect);

          return {
            nodeId,
            portId,
            anchor: 'center',
            x: worldCenter.x,
            y: worldCenter.y,
          };
        }
      }
    }
  }

  // 2. Rotation-aware AABB + closest anchor
  const containerRect = container?.getBoundingClientRect();
  const nodes = Object.values(state.nodesById);

  for (const node of nodes) {
    if (excludeNodeIds.includes(node.id)) continue;
    if (!node.visible) continue;
    // Skip connector nodes in the general hit pass
    const nodeType = (node.schemaRef as any)?.type;
    if (nodeType === 'basic/line' || nodeType === 'industrial/pipe') continue;

    const layout = nodeToLayout(node as any);

    // Expand hit region slightly around the bbox
    const padding = 30;
    const x0 = layout.position.x - padding;
    const y0 = layout.position.y - padding;
    const x1 = layout.position.x + layout.size.width + padding;
    const y1 = layout.position.y + layout.size.height + padding;

    if (worldPos.x < x0 || worldPos.x > x1 || worldPos.y < y0 || worldPos.y > y1) continue;

    // Find the closest cardinal anchor to the cursor
    const nearest = closestAnchor(layout, worldPos);

    return {
      nodeId: node.id,
      anchor: nearest.anchor,
      x: nearest.world.x,
      y: nearest.world.y,
    };
  }

  return null;
}

// ─── Overlay rendering ────────────────────────────────────────────────────────

type PortOverlayProps = {
  hoveredAnchor: HoverAnchor | null;
  worldToScreen: (wx: number, wy: number) => { x: number; y: number };
  state: KernelState;
  viewport: Viewport;
};

export const PortOverlay: React.FC<PortOverlayProps> = ({
  hoveredAnchor,
  worldToScreen,
  state,
  viewport: _vp,
}) => {
  if (!hoveredAnchor) return null;

  // Active anchor dot (only when NOT over a specific port)
  let anchorDot: React.ReactNode = null;
  if (hoveredAnchor.nodeId && !hoveredAnchor.portId) {
    const screenPos = worldToScreen(hoveredAnchor.x, hoveredAnchor.y);
    const size = 16;
    anchorDot = (
      <div
        className="absolute rounded-full border-2 bg-green-500 border-green-600 shadow-lg pointer-events-none"
        style={{
          left: screenPos.x - size / 2,
          top: screenPos.y - size / 2,
          width: size,
          height: size,
          zIndex: 1001,
        }}
      />
    );
  }

  // Port hit indicator (rotated diamond)
  let portDot: React.ReactNode = null;
  if (hoveredAnchor.portId) {
    const screenPos = worldToScreen(hoveredAnchor.x, hoveredAnchor.y);
    const size = 14;
    portDot = (
      <div
        className="absolute rounded border-2 bg-green-500 border-green-600 shadow-lg pointer-events-none"
        style={{
          left: screenPos.x - size / 2,
          top: screenPos.y - size / 2,
          width: size,
          height: size,
          zIndex: 1002,
          transform: 'rotate(45deg)',
        }}
      />
    );
  }

  return (
    <>
      {anchorDot}
      {portDot}
    </>
  );
};
