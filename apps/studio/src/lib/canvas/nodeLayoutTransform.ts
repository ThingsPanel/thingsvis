/**
 * nodeLayoutTransform
 *
 * Single source of truth for all geometry calculations involving nodes.
 * All world-space anchor positions, coordinate conversions, and node transforms
 * MUST go through this module. No scattered left/top/size calculations elsewhere.
 *
 * Coordinate system:
 *   - World space: absolute canvas coordinates (the "logical" coordinate space)
 *   - Local space: relative to node's own origin (position.x, position.y)
 *   - CSS transforms (rotate, scale) on proxy nodes are purely visual;
 *     this module deals only with the logical position/size/rotation data.
 *
 * Rotation model:
 *   - Nodes store rotation as degrees (0 = no rotation)
 *   - Anchor points are defined in local space (no rotation applied)
 *   - To get a world-space anchor: apply the node's rotation around its center
 *   - CSS rotate on the proxy node MUST match this same rotation value
 *     (CanvasView is responsible for keeping them in sync)
 */

/** 2D point */
export interface Pt {
  x: number;
  y: number;
}

/** Axis-aligned bounding box before rotation */
export interface Size {
  width: number;
  height: number;
}

/** A node's layout data — only the fields this module cares about.
 *  Compatible with KernelState nodes and schemaRef. */
export interface NodeLayout {
  position: Pt; // top-left corner in world space
  size: Size;
  rotation: number; // degrees, 0 = no rotation
}

/** The 9 anchor positions defined in LOCAL space (relative to top-left of bbox) */
export type AnchorId =
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'center'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

/** A resolved anchor: local offset + world position */
export interface ResolvedAnchor {
  anchor: AnchorId;
  local: Pt; // offset from node.position
  world: Pt; // after rotation
}

/** Convert degrees to radians */
export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Rotate a point around an origin */
export function rotatePt(pt: Pt, origin: Pt, angleDeg: number): Pt {
  if (angleDeg === 0) return { x: pt.x, y: pt.y };
  const rad = degToRad(angleDeg);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = pt.x - origin.x;
  const dy = pt.y - origin.y;
  return {
    x: origin.x + dx * cos - dy * sin,
    y: origin.y + dx * sin + dy * cos,
  };
}

/** Get the center point of a node in world space */
export function nodeCenter(layout: NodeLayout): Pt {
  return {
    x: layout.position.x + layout.size.width / 2,
    y: layout.position.y + layout.size.height / 2,
  };
}

/** Anchor offset in LOCAL space (relative to top-left corner) */
export function anchorLocalOffset(anchor: AnchorId, size: Size): Pt {
  const { width: w, height: h } = size;
  switch (anchor) {
    case 'top':
      return { x: w / 2, y: 0 };
    case 'right':
      return { x: w, y: h / 2 };
    case 'bottom':
      return { x: w / 2, y: h };
    case 'left':
      return { x: 0, y: h / 2 };
    case 'center':
      return { x: w / 2, y: h / 2 };
    case 'top-left':
      return { x: 0, y: 0 };
    case 'top-right':
      return { x: w, y: 0 };
    case 'bottom-left':
      return { x: 0, y: h };
    case 'bottom-right':
      return { x: w, y: h };
  }
}

/** Convert a local-space point to world space, applying node rotation */
export function localToWorld(layout: NodeLayout, localPt: Pt): Pt {
  const center = nodeCenter(layout);
  const rawWorld = {
    x: layout.position.x + localPt.x,
    y: layout.position.y + localPt.y,
  };
  return rotatePt(rawWorld, center, layout.rotation);
}

/** Convert a world-space point to local space (reverse of above) */
export function worldToLocal(layout: NodeLayout, worldPt: Pt): Pt {
  const center = nodeCenter(layout);
  // Un-rotate first
  const unrotated = rotatePt(worldPt, center, -layout.rotation);
  return {
    x: unrotated.x - layout.position.x,
    y: unrotated.y - layout.position.y,
  };
}

/** Get a specific anchor's world-space position */
export function getAnchorWorld(layout: NodeLayout, anchor: AnchorId): Pt {
  const local = anchorLocalOffset(anchor, layout.size);
  return localToWorld(layout, local);
}

/** Get all 5 cardinal anchors' world positions */
export function getAllAnchorsWorld(layout: NodeLayout): ResolvedAnchor[] {
  const cardinals: AnchorId[] = ['top', 'right', 'bottom', 'left', 'center'];
  return cardinals.map((anchor) => {
    const local = anchorLocalOffset(anchor, layout.size);
    return { anchor, local, world: localToWorld(layout, local) };
  });
}

/** Find the closest cardinal anchor to a given world point */
export function closestAnchor(layout: NodeLayout, worldPt: Pt): ResolvedAnchor {
  const anchors = getAllAnchorsWorld(layout);
  let best = anchors[0]!;
  let bestDist = Infinity;
  for (const a of anchors) {
    const d = Math.hypot(worldPt.x - a.world.x, worldPt.y - a.world.y);
    if (d < bestDist) {
      bestDist = d;
      best = a;
    }
  }
  return best;
}

/** Distance from a point to a line segment (for connector hit-testing) */
export function distToSegment(pt: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(pt.x - a.x, pt.y - a.y);
  const t = Math.max(0, Math.min(1, ((pt.x - a.x) * dx + (pt.y - a.y) * dy) / lenSq));
  return Math.hypot(pt.x - (a.x + t * dx), pt.y - (a.y + t * dy));
}

/** Find the closest point on a polyline to a given world point.
 *  Returns { point, segmentIndex, t } where t is 0-1 along that segment. */
export function closestPointOnPolyline(
  pt: Pt,
  points: Pt[],
): { point: Pt; segmentIndex: number; t: number } | null {
  if (points.length < 2) return null;
  let bestPoint = points[0]!;
  let bestDist = Infinity;
  let bestIdx = 0;
  let bestT = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    const t =
      lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((pt.x - a.x) * dx + (pt.y - a.y) * dy) / lenSq));
    const cx = a.x + t * dx;
    const cy = a.y + t * dy;
    const d = Math.hypot(pt.x - cx, pt.y - cy);
    if (d < bestDist) {
      bestDist = d;
      bestPoint = { x: cx, y: cy };
      bestIdx = i;
      bestT = t;
    }
  }
  return { point: bestPoint, segmentIndex: bestIdx, t: bestT };
}

/** Extract NodeLayout from a KernelState node */
export function nodeToLayout(node: {
  schemaRef?: { position?: Pt; size?: Size; props?: { _rotation?: number; rotation?: number } };
  rotation?: number;
}): NodeLayout {
  const schema = node.schemaRef as any;
  return {
    position: schema?.position ?? { x: 0, y: 0 },
    size: schema?.size ?? { width: 100, height: 100 },
    rotation:
      schema?.props?._rotation ?? schema?.props?.rotation ?? schema?.rotation ?? node.rotation ?? 0,
  };
}

/** Simple elbow route (mirrors basic/line/src/routing.ts) */
export function buildOrthogonalRoute(
  start: Pt,
  end: Pt,
  _sourceAnchor?: AnchorId,
  _targetAnchor?: AnchorId,
): Pt[] {
  const horiz = Math.abs(end.x - start.x) >= Math.abs(end.y - start.y);
  if (horiz) {
    return [start, { x: end.x, y: start.y }, end];
  }
  return [start, { x: start.x, y: end.y }, end];
}

/** Viewport type used across tools */
export interface Viewport {
  zoom: number;
  offsetX: number;
  offsetY: number;
}
