import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, getStrokeWidthPx, getStrokeDasharray, type Props } from './schema';
import { controls } from './controls';
import { defineWidget, type WidgetOverlayContext } from '@thingsvis/widget-sdk';
import zh from './locales/zh.json';
import en from './locales/en.json';
import { type Pt, type AnchorType, buildOrthogonalRoute, buildCurvedPathD, pointsToPathD } from './routing';

type LinkedNodeInfo = {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
};

type NodeBounds = {
  position: { x: number; y: number };
  size: { width: number; height: number };
};

const defaults = getDefaultProps();

/** Resolve a port's world position from the DOM.
 *  Falls back to bbox anchor when no DOM port is found. */
function getPortWorldPosition(
  nodeId: string,
  portId: string,
  zoom: number,
): { x: number; y: number } | null {
  const el = document.querySelector<HTMLElement>(
    `.thingsvis-widget-layer [data-node-id="${nodeId}"][data-port-id="${portId}"]`,
  );
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  const container = el.closest('[data-node-id]') as HTMLElement | null;
  const vp = (window as any)._thingsvisViewport as { offsetX: number; offsetY: number } | undefined;
  const offsetX = vp?.offsetX ?? 0;
  const offsetY = vp?.offsetY ?? 0;
  const containerRect = container?.getBoundingClientRect();
  const left = container ? parseFloat(container.style.left || '0') : 0;
  const top = container ? parseFloat(container.style.top || '0') : 0;
  const worldX = (rect.left + rect.width / 2 - (containerRect?.left ?? 0) - offsetX) / zoom - left;
  const worldY = (rect.top + rect.height / 2 - (containerRect?.top ?? 0) - offsetY) / zoom - top;
  return { x: worldX, y: worldY };
}

/** Get node world position from DOM (fallback when linkedNodes is unavailable).
 *  Returns { position, size } or null if not found. */
function getNodeWorldFromDom(nodeId: string): { position: { x: number; y: number }; size: { width: number; height: number } } | null {
  const nodeEl = document.querySelector<HTMLElement>(`.thingsvis-widget-layer [data-node-id="${nodeId}"]`);
  if (!nodeEl) return null;
  const x = parseFloat(nodeEl.style.left || '0');
  const y = parseFloat(nodeEl.style.top || '0');
  const w = parseFloat(nodeEl.style.width || '100');
  const h = parseFloat(nodeEl.style.height || '100');
  return { position: { x, y }, size: { width: w, height: h } };
}

function getAnchorPoint(node: LinkedNodeInfo | NodeBounds, anchor: AnchorType = 'center'): Pt {
  const { position, size } = node;
  const cx = position.x + size.width / 2;
  const cy = position.y + size.height / 2;
  switch (anchor) {
    case 'top': return { x: cx, y: position.y };
    case 'right': return { x: position.x + size.width, y: cy };
    case 'bottom': return { x: cx, y: position.y + size.height };
    case 'left': return { x: position.x, y: cy };
    case 'center':
    default: return { x: cx, y: cy };
  }
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function rotatePt(pt: Pt, origin: Pt, angleDeg: number): Pt {
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

function nodeCenter(position: Pt, size: { width: number; height: number }): Pt {
  return { x: position.x + size.width / 2, y: position.y + size.height / 2 };
}

/** Returns the world-space anchor point for a target node, accounting for its rotation.
 *  This mirrors the nodeLayoutTransform logic so the widget and studio stay in sync. */
function getTargetAnchorWorld(
  targetNode: { schemaRef?: { position?: Pt; size?: { width: number; height: number }; props?: { _rotation?: number; rotation?: number } } },
  anchor: AnchorType,
): Pt {
  const schema = targetNode.schemaRef as any;
  const pos = schema?.position ?? { x: 0, y: 0 };
  const sz = schema?.size ?? { width: 100, height: 100 };
  const rotation = schema?.props?._rotation ?? schema?.props?.rotation ?? schema?.rotation ?? 0;

  // Compute center once
  const cx = pos.x + sz.width / 2;
  const cy = pos.y + sz.height / 2;
  const center: Pt = { x: cx, y: cy };

  // Local anchor offset (relative to top-left)
  let local: Pt;
  switch (anchor) {
    case 'top':    local = { x: cx, y: pos.y }; break;
    case 'right':  local = { x: pos.x + sz.width, y: cy }; break;
    case 'bottom': local = { x: cx, y: pos.y + sz.height }; break;
    case 'left':   local = { x: pos.x, y: cy }; break;
    default:       local = { x: cx, y: cy };
  }

  if (rotation === 0) return local;
  return rotatePt(local, center, rotation);
}

function worldToLocal(worldPt: Pt, linePosition: Pt): Pt {
  return {
    x: worldPt.x - linePosition.x,
    y: worldPt.y - linePosition.y,
  };
}

function isNormalized(points: Pt[]): boolean {
  return points.every(p => p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1);
}

function toPxPoints(points: Pt[], size: { width: number; height: number }): Pt[] {
  if (!points.length || !size.width || !size.height) return points;
  if (!isNormalized(points)) return points;
  return points.map(p => ({ x: p.x * size.width, y: p.y * size.height }));
}

function clampMinSize(size?: { width: number; height: number }) {
  return {
    width: Math.max(1, Number(size?.width ?? 0)),
    height: Math.max(1, Number(size?.height ?? 0)),
  };
}

// Ensure line extends beyond bounds if necessary without clipping
const ARROW_SHRINK_PX = 8;
const MIN_DISTANCE_FOR_ARROW = 16;

function shortenSegment(start: Pt, end: Pt, shrinkBy: number): Pt {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.hypot(dx, dy);
  if (len < MIN_DISTANCE_FOR_ARROW) return end;
  
  const ratio = Math.max(0, len - shrinkBy) / len;
  return {
    x: start.x + dx * ratio,
    y: start.y + dy * ratio,
  };
}

function renderLine(element: HTMLElement, initialProps: Props, initialCtx: WidgetOverlayContext) {
  element.style.width = '100%';
  element.style.height = '100%';
  element.style.boxSizing = 'border-box';
  element.style.position = 'relative';
  element.style.overflow = 'visible';

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('viewBox', '0 0 1 1');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.style.width = '100%';
  svg.style.height = '100%';
  svg.style.overflow = 'visible';

  const defs = document.createElementNS(svgNS, 'defs');
  const startId = `marker-start-${Math.random().toString(36).slice(2, 9)}`;
  const endId = `marker-end-${Math.random().toString(36).slice(2, 9)}`;

  // Markers
  const markerStart = document.createElementNS(svgNS, 'marker');
  markerStart.setAttribute('id', startId);
  markerStart.setAttribute('markerUnits', 'userSpaceOnUse');
  markerStart.setAttribute('orient', 'auto-start-reverse');
  markerStart.setAttribute('refX', '5');
  markerStart.setAttribute('refY', '5');
  const startPath = document.createElementNS(svgNS, 'path');
  markerStart.appendChild(startPath);

  const markerEnd = document.createElementNS(svgNS, 'marker');
  markerEnd.setAttribute('id', endId);
  markerEnd.setAttribute('markerUnits', 'userSpaceOnUse');
  markerEnd.setAttribute('orient', 'auto');
  markerEnd.setAttribute('refX', '5');
  markerEnd.setAttribute('refY', '5');
  const endPath = document.createElementNS(svgNS, 'path');
  markerEnd.appendChild(endPath);

  defs.appendChild(markerStart);
  defs.appendChild(markerEnd);
  svg.appendChild(defs);

  const path = document.createElementNS(svgNS, 'path');
  path.setAttribute('fill', 'none');
  path.setAttribute('vector-effect', 'non-scaling-stroke');
  svg.appendChild(path);
  element.appendChild(svg);

  function applyMarkers(props: Props) {
    const size = props.arrowSize || 10;
    const size2 = size;
    const half = size2 / 2;
    
    // Adjust hit box
    markerStart.setAttribute('markerWidth', String(size2));
    markerStart.setAttribute('markerHeight', String(size2));
    markerStart.setAttribute('refX', String(half));
    markerStart.setAttribute('refY', String(half));

    markerEnd.setAttribute('markerWidth', String(size2));
    markerEnd.setAttribute('markerHeight', String(size2));
    markerEnd.setAttribute('refX', String(half));
    markerEnd.setAttribute('refY', String(half));

    const color = props.stroke || '#000';

    if (props.arrowStart === 'arrow') {
      startPath.setAttribute('d', `M 0 0 L ${size2} ${half} L 0 ${size2} Z`);
      startPath.setAttribute('fill', color);
      startPath.removeAttribute('stroke');
      path.setAttribute('marker-start', `url(#${startId})`);
    } else if (props.arrowStart === 'open-arrow') {
      startPath.setAttribute('d', `M 0 0 L ${size2} ${half} L 0 ${size2}`);
      startPath.setAttribute('fill', 'none');
      startPath.setAttribute('stroke', color);
      startPath.setAttribute('stroke-width', '2');
      path.setAttribute('marker-start', `url(#${startId})`);
    } else {
      path.removeAttribute('marker-start');
    }

    if (props.arrowEnd === 'arrow') {
      endPath.setAttribute('d', `M 0 0 L ${size2} ${half} L 0 ${size2} Z`);
      endPath.setAttribute('fill', color);
      endPath.removeAttribute('stroke');
      path.setAttribute('marker-end', `url(#${endId})`);
    } else if (props.arrowEnd === 'open-arrow') {
      endPath.setAttribute('d', `M 0 0 L ${size2} ${half} L 0 ${size2}`);
      endPath.setAttribute('fill', 'none');
      endPath.setAttribute('stroke', color);
      endPath.setAttribute('stroke-width', '2');
      path.setAttribute('marker-end', `url(#${endId})`);
    } else {
      path.removeAttribute('marker-end');
    }
  }

  function applyStyles(props: Props) {
    const width = getStrokeWidthPx(props.strokeWidth);
    path.setAttribute('stroke', props.stroke || '#000');
    path.setAttribute('stroke-width', String(width));
    path.setAttribute('opacity', String(props.opacity));
    
    const dash = getStrokeDasharray(props.strokeStyle, width);
    if (dash) {
      path.setAttribute('stroke-dasharray', dash);
    } else {
      path.removeAttribute('stroke-dasharray');
    }
  }

  function update(nextProps: Props, nextCtx: WidgetOverlayContext) {
    const size = clampMinSize((nextCtx as any).size);
    const linePosition = nextCtx.position ?? { x: 0, y: 0 };
    const linkedNodes = (nextCtx as any).linkedNodes as Record<string, LinkedNodeInfo> | undefined;

    const sourceNode = nextProps.sourceNodeId ? linkedNodes?.[nextProps.sourceNodeId] : undefined;
    const targetNode = nextProps.targetNodeId ? linkedNodes?.[nextProps.targetNodeId] : undefined;

    // Fallback: if linkedNodes didn't provide the node, read position from DOM
    const sourceDomNode = nextProps.sourceNodeId && !sourceNode
      ? getNodeWorldFromDom(nextProps.sourceNodeId)
      : undefined;
    const targetDomNode = nextProps.targetNodeId && !targetNode
      ? getNodeWorldFromDom(nextProps.targetNodeId)
      : undefined;

    const hasBinding = !!(sourceNode || targetNode || sourceDomNode || targetDomNode);

    let routePoints: Pt[];

    if (hasBinding) {
      // Resolve start anchor (world space, rotation-aware if linkedNodes is available)
      let startPt: Pt;
      if (nextProps.sourcePortId && (sourceNode || sourceDomNode)) {
        const portWorld = getPortWorldPosition(nextProps.sourceNodeId!, nextProps.sourcePortId, (nextCtx as any).zoom ?? 1);
        if (portWorld) {
          startPt = worldToLocal(portWorld, linePosition);
        } else if (sourceNode) {
          // Use rotation-aware anchor when full node data is available
          startPt = worldToLocal(getTargetAnchorWorld(sourceNode as any, nextProps.sourceAnchor as AnchorType), linePosition);
        } else {
          startPt = worldToLocal(getAnchorPoint(sourceDomNode!, nextProps.sourceAnchor as AnchorType), linePosition);
        }
      } else if (sourceNode) {
        startPt = worldToLocal(getTargetAnchorWorld(sourceNode as any, nextProps.sourceAnchor as AnchorType), linePosition);
      } else if (sourceDomNode) {
        startPt = worldToLocal(getAnchorPoint(sourceDomNode, nextProps.sourceAnchor as AnchorType), linePosition);
      } else {
        startPt = { x: 0, y: size.height / 2 };
      }

      // Resolve end anchor (world space, rotation-aware if linkedNodes is available)
      let endPt: Pt;
      if (nextProps.targetPortId && (targetNode || targetDomNode)) {
        const portWorld = getPortWorldPosition(nextProps.targetNodeId!, nextProps.targetPortId, (nextCtx as any).zoom ?? 1);
        if (portWorld) {
          endPt = worldToLocal(portWorld, linePosition);
        } else if (targetNode) {
          endPt = worldToLocal(getTargetAnchorWorld(targetNode as any, nextProps.targetAnchor as AnchorType), linePosition);
        } else {
          endPt = worldToLocal(getAnchorPoint(targetDomNode!, nextProps.targetAnchor as AnchorType), linePosition);
        }
      } else if (targetNode) {
        endPt = worldToLocal(getTargetAnchorWorld(targetNode as any, nextProps.targetAnchor as AnchorType), linePosition);
      } else if (targetDomNode) {
        endPt = worldToLocal(getAnchorPoint(targetDomNode, nextProps.targetAnchor as AnchorType), linePosition);
      } else {
        endPt = { x: size.width, y: size.height / 2 };
      }

      if (nextProps.routerType === 'orthogonal') {
        routePoints = buildOrthogonalRoute(startPt, endPt, nextProps.sourceAnchor as AnchorType, nextProps.targetAnchor as AnchorType);
      } else {
        routePoints = [startPt, endPt];
      }
    } else {
      const rawPoints = Array.isArray(nextProps.points) ? (nextProps.points as Pt[]) : defaults.points;
      routePoints = toPxPoints(rawPoints, size);
      
      if (routePoints.length < 2) {
        routePoints = [{ x: 0, y: size.height / 2 }, { x: size.width, y: size.height / 2 }];
      }
      
      if (nextProps.routerType === 'orthogonal' && routePoints.length >= 2) {
        const startPt = routePoints[0]!;
        const endPt = routePoints[routePoints.length - 1]!;
        routePoints = buildOrthogonalRoute(startPt, endPt, nextProps.sourceAnchor as AnchorType, nextProps.targetAnchor as AnchorType);
      }
    }

    // Shrink ends slightly to accommodate markers so they don't clip into target boxes
    if (routePoints.length >= 2) {
      if (nextProps.arrowStart !== 'none') {
        const p1 = routePoints[0]!;
        const p2 = routePoints[1]!;
        routePoints[0] = shortenSegment(p2, p1, ARROW_SHRINK_PX);
      }
      if (nextProps.arrowEnd !== 'none') {
        const lastIdx = routePoints.length - 1;
        const p1 = routePoints[lastIdx - 1]!;
        const p2 = routePoints[lastIdx]!;
        routePoints[lastIdx] = shortenSegment(p1, p2, ARROW_SHRINK_PX);
      }
    }

    // Adapt bounds to avoid clipping (especially for curved lines and overflow)
    if (routePoints.length >= 2 && hasBinding) {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      for (const p of routePoints) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }
      
      const pad = 20;
      minX -= pad;
      minY -= pad;
      maxX += pad;
      maxY += pad;
      
      const width = Math.max(1, maxX - minX);
      const height = Math.max(1, maxY - minY);
      
      svg.style.position = 'absolute';
      svg.style.left = `${minX}px`;
      svg.style.top = `${minY}px`;
      svg.style.width = `${width}px`;
      svg.style.height = `${height}px`;
      svg.setAttribute('width', String(width));
      svg.setAttribute('height', String(height));
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      
      routePoints = routePoints.map(p => ({ x: p.x - minX, y: p.y - minY }));
    } else {
      svg.style.position = '';
      svg.style.left = '';
      svg.style.top = '';
      svg.style.width = '100%';
      svg.style.height = '100%';
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      svg.setAttribute('viewBox', `0 0 ${size.width} ${size.height}`);
    }

    let d = '';
    if (nextProps.routerType === 'curved' && routePoints.length >= 2) {
      const startPt = routePoints[0]!;
      const endPt = routePoints[routePoints.length - 1]!;
      d = buildCurvedPathD(startPt, endPt);
    } else {
      d = pointsToPathD(routePoints);
    }

    path.setAttribute('d', d);
    
    applyStyles(nextProps);
    applyMarkers(nextProps);
  }

  update(initialProps, initialCtx);

  return {
    update,
    destroy: () => {
      element.innerHTML = '';
    },
  };
}

export const Main = defineWidget({
  ...metadata,
  locales: { zh, en },
  schema: PropsSchema,
  controls,
  render: renderLine,
});

export default Main;
