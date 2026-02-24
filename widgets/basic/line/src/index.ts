import { Rect } from 'leafer-ui';
import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, getStrokeWidthPx, getStrokeDasharray, type Props } from './schema';
import { controls } from './controls';
import type { WidgetMainModule, WidgetOverlayContext, PluginOverlayInstance, LinkedNodeInfo } from './lib/types';

type Pt = { x: number; y: number };
type AnchorType = 'top' | 'right' | 'bottom' | 'left' | 'center';

/** 根据锚点类型计算节点上的连接点位置（世界坐标） */
function getAnchorPoint(node: LinkedNodeInfo, anchor: AnchorType = 'center'): Pt {
  const { position, size } = node;
  const cx = position.x + size.width / 2;
  const cy = position.y + size.height / 2;
  
  switch (anchor) {
    case 'top':
      return { x: cx, y: position.y };
    case 'right':
      return { x: position.x + size.width, y: cy };
    case 'bottom':
      return { x: cx, y: position.y + size.height };
    case 'left':
      return { x: position.x, y: cy };
    case 'center':
    default:
      return { x: cx, y: cy };
  }
}

/** 将世界坐标转换为线条组件内的本地坐标 */
function worldToLocal(worldPt: Pt, linePosition: Pt): Pt {
  return {
    x: worldPt.x - linePosition.x,
    y: worldPt.y - linePosition.y,
  };
}

function isNormalizedPoints(points: Pt[]): boolean {
  // Heuristic: if all coords are between 0..1, treat as normalized
  return points.every((p) => p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1);
}

function toPxPoints(points: Pt[], size: { width: number; height: number }): Pt[] {
  if (!points.length) return [];
  if (!size.width || !size.height) return points;
  if (!isNormalizedPoints(points)) return points;
  return points.map((p) => ({ x: p.x * size.width, y: p.y * size.height }));
}

function clampMinSize(size?: { width: number; height: number }) {
  const width = Math.max(1, Number(size?.width ?? 0));
  const height = Math.max(1, Number(size?.height ?? 0));
  return { width, height };
}

function buildPolylinePointsAttr(points: Pt[]): string {
  return points.map((p) => `${p.x},${p.y}`).join(' ');
}

function buildLinePathD(points: Pt[]): string {
  if (points.length < 2) return '';
  const start = points[0]!;
  let d = `M ${start.x} ${start.y}`;
  for (let i = 1; i < points.length; i++) {
    const p = points[i]!;
    d += ` L ${p.x} ${p.y}`;
  }
  return d;
}

function buildCurvePathD(points: Pt[]): string {
  if (points.length < 2) return '';
  const a = points[0]!;
  const b = points[points.length - 1]!;

  // Simple deterministic cubic curve between endpoints.
  const dx = b.x - a.x;
  const c1 = { x: a.x + dx / 3, y: a.y };
  const c2 = { x: a.x + (dx * 2) / 3, y: b.y };
  return `M ${a.x} ${a.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${b.x} ${b.y}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function darkenHexColor(hex: string, amount01: number): string {
  // Supports #rgb or #rrggbb; otherwise return input.
  const h = (hex || '').trim();
  if (!h.startsWith('#')) return hex;
  let r = 0, g = 0, b = 0;
  if (h.length === 4) {
    const r1 = h.charAt(1);
    const g1 = h.charAt(2);
    const b1 = h.charAt(3);
    r = parseInt(r1 + r1, 16);
    g = parseInt(g1 + g1, 16);
    b = parseInt(b1 + b1, 16);
  } else if (h.length === 7) {
    r = parseInt(h.slice(1, 3), 16);
    g = parseInt(h.slice(3, 5), 16);
    b = parseInt(h.slice(5, 7), 16);
  } else {
    return hex;
  }
  const k = clamp(1 - amount01, 0, 1);
  const rr = clamp(Math.round(r * k), 0, 255);
  const gg = clamp(Math.round(g * k), 0, 255);
  const bb = clamp(Math.round(b * k), 0, 255);
  return `#${rr.toString(16).padStart(2, '0')}${gg.toString(16).padStart(2, '0')}${bb.toString(16).padStart(2, '0')}`;
}

/** 构建折线路径（Elbow），适用于流程图式连接 */
function buildElbowRoutePoints(a: Pt, b: Pt, sourceAnchor?: AnchorType, targetAnchor?: AnchorType): Pt[] {
  const isSourceHorizontal = sourceAnchor === 'left' || sourceAnchor === 'right';
  const isSourceVertical = sourceAnchor === 'top' || sourceAnchor === 'bottom';
  const isTargetHorizontal = targetAnchor === 'left' || targetAnchor === 'right';
  const isTargetVertical = targetAnchor === 'top' || targetAnchor === 'bottom';

  if (isSourceVertical && isTargetVertical) {
    const midY = (a.y + b.y) / 2;
    return [a, { x: a.x, y: midY }, { x: b.x, y: midY }, b];
  }
  if (isSourceHorizontal && isTargetHorizontal) {
    const midX = (a.x + b.x) / 2;
    return [a, { x: midX, y: a.y }, { x: midX, y: b.y }, b];
  }
  if (isSourceVertical && isTargetHorizontal) {
    return [a, { x: a.x, y: b.y }, b];
  }
  if (isSourceHorizontal && isTargetVertical) {
    return [a, { x: b.x, y: a.y }, b];
  }
  const midX = (a.x + b.x) / 2;
  return [a, { x: midX, y: a.y }, { x: midX, y: b.y }, b];
}

/** 构建折线路径（Elbow），适用于流程图式连接 */
function buildElbowPathD(points: Pt[], sourceAnchor?: AnchorType, targetAnchor?: AnchorType): string {
  if (points.length < 2) return '';
  const a = points[0]!;
  const b = points[points.length - 1]!;
  return buildLinePathD(buildElbowRoutePoints(a, b, sourceAnchor, targetAnchor));
}

/** 应用手绘风格抖动到路径点 */
function applySloppiness(points: Pt[], sloppiness: 'none' | 'low' | 'high', seed: number): Pt[] {
  if (sloppiness === 'none' || points.length < 2) return points;
  
  const amplitude = sloppiness === 'low' ? 2 : 5;
  
  // 使用简单的伪随机数生成器，保持确定性
  const random = (i: number) => {
    const x = Math.sin(seed * 9999 + i * 7777) * 10000;
    return x - Math.floor(x);
  };
  
  return points.map((p, i) => {
    // 首尾点保持不动
    if (i === 0 || i === points.length - 1) return p;
    
    const offsetX = (random(i * 2) - 0.5) * amplitude * 2;
    const offsetY = (random(i * 2 + 1) - 0.5) * amplitude * 2;
    return { x: p.x + offsetX, y: p.y + offsetY };
  });
}

function buildRoundedPolylinePathD(points: Pt[], radius: number): string {
  if (points.length < 2) return '';
  const r = Math.max(0, radius);
  if (r <= 0 || points.length === 2) return buildLinePathD(points);

  const start = points[0]!;
  let d = `M ${start.x} ${start.y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]!;
    const curr = points[i]!;
    const next = points[i + 1]!;

    const v1x = curr.x - prev.x;
    const v1y = curr.y - prev.y;
    const v2x = next.x - curr.x;
    const v2y = next.y - curr.y;

    const len1 = Math.hypot(v1x, v1y);
    const len2 = Math.hypot(v2x, v2y);
    if (len1 < 1e-6 || len2 < 1e-6) {
      d += ` L ${curr.x} ${curr.y}`;
      continue;
    }

    const n1x = v1x / len1;
    const n1y = v1y / len1;
    const n2x = v2x / len2;
    const n2y = v2y / len2;

    const cornerRadius = Math.min(r, len1 / 2, len2 / 2);
    const entry = { x: curr.x - n1x * cornerRadius, y: curr.y - n1y * cornerRadius };
    const exit = { x: curr.x + n2x * cornerRadius, y: curr.y + n2y * cornerRadius };

    d += ` L ${entry.x} ${entry.y}`;
    d += ` Q ${curr.x} ${curr.y} ${exit.x} ${exit.y}`;
  }

  const end = points[points.length - 1]!;
  d += ` L ${end.x} ${end.y}`;
  return d;
}

function polylineLength(points: Pt[]): number {
  let sum = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    sum += Math.hypot(dx, dy);
  }
  return sum;
}

function create(): Rect {
  return new Rect({
    width: 200,
    height: 40,
    fill: 'transparent',
    draggable: true,
    cursor: 'pointer',
  });
}

function createOverlay(ctx: WidgetOverlayContext): PluginOverlayInstance {
  const element = document.createElement('div');
  element.style.width = '100%';
  element.style.height = '100%';
  element.style.boxSizing = 'border-box';
  element.style.position = 'relative';
  element.style.overflow = 'visible'; // 允许溢出显示连接线
  // Let selection/drag interactions pass through (Moveable/Selecto target the proxy layer)
  element.style.pointerEvents = 'none';

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('viewBox', '0 0 1 1');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.style.overflow = 'visible'; // SVG 也允许溢出
  svg.style.pointerEvents = 'none';

  const defs = document.createElementNS(svgNS, 'defs');
  svg.appendChild(defs);

  // Box border (component frame)
  const frameRect = document.createElementNS(svgNS, 'rect');
  frameRect.setAttribute('x', '0');
  frameRect.setAttribute('y', '0');
  frameRect.setAttribute('width', '100%');
  frameRect.setAttribute('height', '100%');
  frameRect.setAttribute('fill', 'none');
  svg.appendChild(frameRect);

  const markerStart = document.createElementNS(svgNS, 'marker');
  const markerEnd = document.createElementNS(svgNS, 'marker');

  const startId = `tv-line-start-${Math.random().toString(36).slice(2)}`;
  const endId = `tv-line-end-${Math.random().toString(36).slice(2)}`;

  function setupMarker(marker: SVGMarkerElement, id: string) {
    marker.setAttribute('id', id);
    marker.setAttribute('markerUnits', 'strokeWidth');
    marker.setAttribute('orient', 'auto');
    marker.setAttribute('refX', '10');
    marker.setAttribute('refY', '5');
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '10');

    const path = document.createElementNS(svgNS, 'path');
    // Simple triangle
    path.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
    marker.appendChild(path);
    return path;
  }

  const startPath = setupMarker(markerStart as any, startId);
  const endPath = setupMarker(markerEnd as any, endId);

  defs.appendChild(markerStart);
  defs.appendChild(markerEnd);

  const poly = document.createElementNS(svgNS, 'polyline');
  poly.setAttribute('fill', 'none');
  poly.setAttribute('vector-effect', 'non-scaling-stroke');

  const path = document.createElementNS(svgNS, 'path');
  path.setAttribute('fill', 'none');
  path.setAttribute('vector-effect', 'non-scaling-stroke');

  // Pipe outline rendered behind the main stroke (not the component frame)
  const polyBorder = document.createElementNS(svgNS, 'polyline');
  polyBorder.setAttribute('fill', 'none');
  polyBorder.setAttribute('vector-effect', 'non-scaling-stroke');

  const pathBorder = document.createElementNS(svgNS, 'path');
  pathBorder.setAttribute('fill', 'none');
  pathBorder.setAttribute('vector-effect', 'non-scaling-stroke');

  // Flow overlay for Pipe style
  const polyFlow = document.createElementNS(svgNS, 'polyline');
  polyFlow.setAttribute('fill', 'none');
  polyFlow.setAttribute('vector-effect', 'non-scaling-stroke');
  polyFlow.style.pointerEvents = 'none';

  const pathFlow = document.createElementNS(svgNS, 'path');
  pathFlow.setAttribute('fill', 'none');
  pathFlow.setAttribute('vector-effect', 'non-scaling-stroke');
  pathFlow.style.pointerEvents = 'none';

  svg.appendChild(polyBorder);
  svg.appendChild(pathBorder);
  svg.appendChild(poly);
  svg.appendChild(path);
  svg.appendChild(polyFlow);
  svg.appendChild(pathFlow);
  element.appendChild(svg);

  // Flow animation state
  let rafId: number | null = null;
  let lastTS = 0;
  let dashOffset = 0;
  let cachedPathLen = 0;

  let flowSpeedPx = 0;
  let flowDashSpacing = 0;
  let flowTargets: Array<SVGGeometryElement & { style: CSSStyleDeclaration }> = [];

  function stopFlow() {
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    lastTS = 0;
  }

  function tick() {
    rafId = requestAnimationFrame((ts) => {
      if (!lastTS) lastTS = ts;
      const dt = Math.max(0, ts - lastTS) / 1000;
      lastTS = ts;

      // px/s -> px per frame
      const spacing = Math.max(1, flowDashSpacing);
      dashOffset = dashOffset - flowSpeedPx * dt;
      // Keep dashOffset within [0, spacing) to avoid negative modulo jitter.
      dashOffset = ((dashOffset % spacing) + spacing) % spacing;
      for (const t of flowTargets) {
        t.style.strokeDashoffset = String(dashOffset);
      }
      tick();
    });
  }

  function applyFlowAttrs(el: SVGElement, props: Props) {
    const isPipe = (props as any).renderStyle === 'pipe';
    if (!isPipe || !props.flowEnabled) {
      el.style.display = 'none';
      return;
    }

    el.style.display = '';
    
    // Flow overlay style - 流动内容使用方形端点，不加圆角
    const strokeWidthPx = getStrokeWidthPx(props.strokeWidth);
    // 流动颜色默认使用线条颜色
    const flowColor = (props as any).flowColor || props.stroke;
    
    el.setAttribute('stroke', flowColor);
    // Make flow slightly thinner than the pipe to stay inside
    el.setAttribute('stroke-width', String(Math.max(1, strokeWidthPx - 4))); 
    el.setAttribute('opacity', '0.9');
    // 使用 butt 端点，不要圆角
    el.setAttribute('stroke-linecap', 'butt');
    el.setAttribute('stroke-linejoin', 'miter');

    const spacing = props.flowSpacing || 16;
    // 使用用户配置的流动长度
    const dashLen = (props as any).flowLength || 8;
    el.setAttribute('stroke-dasharray', `${dashLen} ${spacing}`);
  }

  function applyStrokeAttrs(el: SVGElement, props: Props) {
    const strokeWidthPx = getStrokeWidthPx(props.strokeWidth);
    const dashArray = getStrokeDasharray(props.strokeStyle, strokeWidthPx);
    const isPipe = (props as any).renderStyle === 'pipe';

    el.setAttribute('stroke', props.stroke);
    el.setAttribute('stroke-width', String(strokeWidthPx));
    el.setAttribute('opacity', String(props.opacity));
    
    // 端点样式
    el.setAttribute('stroke-linecap', props.lineCap || 'butt');
    el.setAttribute('stroke-linejoin', 'miter');

    // 优先使用新的 strokeStyle，回退到旧的 dashPattern
    // For pipes, the main body (liquid) is usually solid.
    // Flow is handled by overlay.
    if (isPipe) {
      el.removeAttribute('stroke-dasharray');
    } else {
      if (dashArray) {
        el.setAttribute('stroke-dasharray', dashArray);
      } else if (props.dashPattern && props.dashPattern.trim()) {
        el.setAttribute('stroke-dasharray', props.dashPattern);
      } else {
        el.removeAttribute('stroke-dasharray');
      }
    }
  }

  function applyBorderAttrs(el: SVGElement, props: Props) {
    const strokeWidthPx = getStrokeWidthPx(props.strokeWidth);
    const renderStyle = (props as any).renderStyle as string | undefined;

    // Pipe style: use pipeBackground for the outer border
    if (renderStyle !== 'pipe') {
      el.style.display = 'none';
      return;
    }

    // 背景边框宽度
    const outlineWidth = Math.max(1, Math.round(strokeWidthPx * 0.25));
    const width = strokeWidthPx + outlineWidth * 2;
    const dashArray = getStrokeDasharray(props.strokeStyle, strokeWidthPx);
    el.style.display = '';
    // 使用用户配置的管道背景色
    const pipeBackground = (props as any).pipeBackground || '#1a1a2e';
    el.setAttribute('stroke', pipeBackground);
    el.setAttribute('stroke-width', String(width));
    el.setAttribute('opacity', String(props.opacity));
    // 使用 square 端点确保管道边框在拐角处完全延伸
    el.setAttribute('stroke-linecap', 'square');
    el.setAttribute('stroke-linejoin', 'miter');
    el.setAttribute('stroke-miterlimit', '10');

    // Keep dash pattern consistent with the main stroke.
    if (dashArray) {
      el.setAttribute('stroke-dasharray', dashArray);
    } else if (props.dashPattern && props.dashPattern.trim()) {
      el.setAttribute('stroke-dasharray', props.dashPattern);
    } else {
      el.removeAttribute('stroke-dasharray');
    }
  }

  function applyFrameBorder(props: Props) {
    const bw = Math.max(0, Number((props as any).borderWidth ?? 0));
    if (bw <= 0) {
      frameRect.style.display = 'none';
      return;
    }
    frameRect.style.display = '';
    frameRect.setAttribute('stroke', String((props as any).borderColor ?? '#ffffff'));
    frameRect.setAttribute('stroke-width', String(bw));
    frameRect.setAttribute('opacity', String(props.opacity));
  }

  function clearMarkers(el: SVGElement) {
    el.removeAttribute('marker-start');
    el.removeAttribute('marker-end');
  }

  function applyMarkers(el: SVGElement, props: Props, useNewAPI: boolean) {
    // 新 API: arrowStart 和 arrowEnd
    const hasArrowStart = props.arrowStart === 'arrow';
    const hasArrowEnd = props.arrowEnd === 'arrow';

    // NOTE: useNewAPI must be decided from raw next.props keys,
    // not merged defaults (defaults always contain arrowStart/arrowEnd).
    if (useNewAPI) {
      if (hasArrowStart) {
        el.setAttribute('marker-start', `url(#${startId})`);
      } else {
        el.removeAttribute('marker-start');
      }
      
      if (hasArrowEnd) {
        el.setAttribute('marker-end', `url(#${endId})`);
      } else {
        el.removeAttribute('marker-end');
      }
    } else {
      // 兑容旧的 direction 属性
      const dir = props.direction;
      if (dir === 'forward') {
        el.removeAttribute('marker-start');
        el.setAttribute('marker-end', `url(#${endId})`);
      } else if (dir === 'reverse') {
        el.setAttribute('marker-start', `url(#${startId})`);
        el.removeAttribute('marker-end');
      } else if (dir === 'bidirectional') {
        el.setAttribute('marker-start', `url(#${startId})`);
        el.setAttribute('marker-end', `url(#${endId})`);
      } else {
        clearMarkers(el);
      }
    }
  }

  function update(next: WidgetOverlayContext) {
    const defaults = getDefaultProps();
    const props: Props = { ...defaults, ...(next.props as Partial<Props>) };

    // Decide whether the host is using the new arrow API based on provided keys.
    // This avoids mixing legacy `direction` defaults with explicit arrowStart/arrowEnd.
    const rawProps = (next.props ?? {}) as Record<string, unknown>;
    const useNewArrowAPI =
      Object.prototype.hasOwnProperty.call(rawProps, 'arrowStart') ||
      Object.prototype.hasOwnProperty.call(rawProps, 'arrowEnd');

    const isPipe = (props as any).renderStyle === 'pipe';
    const rawHasDirection = Object.prototype.hasOwnProperty.call(rawProps, 'direction');
    // In pipe mode, default should be NO arrows unless user explicitly sets arrowStart/arrowEnd or direction.
    const defaultNoArrows = isPipe && !useNewArrowAPI && !rawHasDirection;

    const size = clampMinSize((next as any).size);
    const linePosition = next.position ?? { x: 0, y: 0 };
    const strokeWidthPx = getStrokeWidthPx(props.strokeWidth);
    const arrowSizePx = Math.max(4, props.arrowSize);

    // 获取连接节点信息
    const linkedNodes = (next as any).linkedNodes as Record<string, LinkedNodeInfo> | undefined;
    
    const sourceNode = props.sourceNodeId && linkedNodes?.[props.sourceNodeId];
    const targetNode = props.targetNodeId && linkedNodes?.[props.targetNodeId];

    // 检测是否有节点绑定
    const hasNodeBinding = !!(sourceNode || targetNode);

    // 根据 arrowType 或 kind 决定使用哪种路径（节点绑定默认 elbow）
    const arrowType = props.arrowType || 'straight';
    const kind = props.kind;

    let pathType: 'polyline' | 'curve' | 'elbow' | 'mind' = 'polyline';
    if (isPipe) {
      // Pipe style always forces Orthogonal (Elbow) routing for industrial standards
      pathType = 'elbow';
    } else if (arrowType === 'curved' || kind === 'curve') {
      pathType = 'curve';
    } else if (arrowType === 'elbow' || (hasNodeBinding && arrowType === 'straight')) {
      pathType = 'elbow';
    } else if (kind === 'mind') {
      pathType = 'mind';
    } else if (kind === 'polyline' || kind === 'straight') {
      pathType = 'polyline';
    }

    // Resolve base points
    let basePoints: Pt[];
    if (hasNodeBinding) {
      const startPt = sourceNode
        ? worldToLocal(getAnchorPoint(sourceNode, props.sourceAnchor as AnchorType), linePosition)
        : { x: 0, y: size.height / 2 };

      const endPt = targetNode
        ? worldToLocal(getAnchorPoint(targetNode, props.targetAnchor as AnchorType), linePosition)
        : { x: size.width, y: size.height / 2 };

      basePoints = [startPt, endPt];
    } else {
      const rawPoints = Array.isArray(props.points) ? (props.points as any as Pt[]) : defaults.points;
      basePoints = toPxPoints(rawPoints, size);
    }

    // Expand elbow into orthogonal route points for correct bounds + arrow trimming
    let points = basePoints;
    if (pathType === 'elbow' && basePoints.length >= 2) {
      const a = basePoints[0]!;
      const b = basePoints[basePoints.length - 1]!;
      points = buildElbowRoutePoints(a, b, props.sourceAnchor as AnchorType, props.targetAnchor as AnchorType);
    }
    
    // 应用手绘风格抖动（elbow 保持直角，不做抖动）
    if (pathType !== 'elbow') {
      const seed = next.id ? next.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : 42;
      points = applySloppiness(points, props.sloppiness, seed);
    }

    // 判断箭头是否显示：新旧 API 不要混用
    const hasArrowStart = defaultNoArrows
      ? false
      : useNewArrowAPI
        ? props.arrowStart === 'arrow'
        : props.direction === 'reverse' || props.direction === 'bidirectional';
    const hasArrowEnd = defaultNoArrows
      ? false
      : useNewArrowAPI
        ? props.arrowEnd === 'arrow'
        : props.direction === 'forward' || props.direction === 'bidirectional';

    // 缩短线条端点，为箭头留出空间
    if (points.length >= 2) {
      points = [...points]; // 复制数组
      
      if (hasArrowStart) {
        const p0 = points[0]!;
        const p1 = points[1]!;
        const dx = p1.x - p0.x;
        const dy = p1.y - p0.y;
        const len = Math.hypot(dx, dy);
        if (len > arrowSizePx) {
          const ratio = arrowSizePx / len;
          points[0] = { x: p0.x + dx * ratio, y: p0.y + dy * ratio };
        }
      }
      
      if (hasArrowEnd) {
        const pLast = points[points.length - 1]!;
        const pPrev = points[points.length - 2]!;
        const dx = pLast.x - pPrev.x;
        const dy = pLast.y - pPrev.y;
        const len = Math.hypot(dx, dy);
        if (len > arrowSizePx) {
          const ratio = arrowSizePx / len;
          points[points.length - 1] = { x: pLast.x - dx * ratio, y: pLast.y - dy * ratio };
        }
      }
    }

    // If node-bound, render in 1:1 pixel space by sizing/positioning the SVG
    // so it covers the whole path bounds, then shift points into that local space.
    if (hasNodeBinding && points.length) {
      const pad = Math.max(20, strokeWidthPx * 2 + arrowSizePx + 6);
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const p of points) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      }
      minX -= pad;
      minY -= pad;
      maxX += pad;
      maxY += pad;

      const w = Math.max(1, maxX - minX);
      const h = Math.max(1, maxY - minY);

      svg.style.position = 'absolute';
      svg.style.left = `${minX}px`;
      svg.style.top = `${minY}px`;
      svg.setAttribute('width', String(w));
      svg.setAttribute('height', String(h));
      (svg as any).style.width = `${w}px`;
      (svg as any).style.height = `${h}px`;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      svg.setAttribute('preserveAspectRatio', 'none');

      points = points.map(p => ({ x: p.x - minX, y: p.y - minY }));
    } else {
      // Reset SVG back to normal sized-to-node mode
      svg.style.position = '';
      svg.style.left = '';
      svg.style.top = '';
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      (svg as any).style.width = '100%';
      (svg as any).style.height = '100%';
      svg.setAttribute('viewBox', `0 0 ${size.width} ${size.height}`);
      svg.setAttribute('preserveAspectRatio', 'none');
    }

    const usePath = pathType === 'curve' || pathType === 'mind' || pathType === 'elbow';
    poly.style.display = usePath ? 'none' : '';
    path.style.display = usePath ? '' : 'none';
    polyBorder.style.display = usePath ? 'none' : '';
    pathBorder.style.display = usePath ? '' : 'none';
    // Sync flow overlay visibility
    polyFlow.style.display = usePath ? 'none' : '';
    pathFlow.style.display = usePath ? '' : 'none';

    if (usePath) {
      let d: string;
      let borderD: string;
      if (pathType === 'curve') {
        d = buildCurvePathD(points);
        borderD = d;
      } else {
        // 折线/管道都使用直角，不要圆角
        d = buildLinePathD(points);
        
        // 管道模式：背景路径端点缩短，让主体能完全覆盖背景
        if (isPipe && points.length >= 2) {
          const shrinkPts = [...points];
          const shrink = Math.max(2, strokeWidthPx * 0.5); // 缩短量
          
          // 缩短起点
          const p0 = shrinkPts[0]!;
          const p1 = shrinkPts[1]!;
          const dx0 = p1.x - p0.x;
          const dy0 = p1.y - p0.y;
          const len0 = Math.hypot(dx0, dy0);
          if (len0 > shrink * 2) {
            shrinkPts[0] = { x: p0.x + (dx0 / len0) * shrink, y: p0.y + (dy0 / len0) * shrink };
          }
          
          // 缩短终点
          const pLast = shrinkPts[shrinkPts.length - 1]!;
          const pPrev = shrinkPts[shrinkPts.length - 2]!;
          const dxL = pLast.x - pPrev.x;
          const dyL = pLast.y - pPrev.y;
          const lenL = Math.hypot(dxL, dyL);
          if (lenL > shrink * 2) {
            shrinkPts[shrinkPts.length - 1] = { x: pLast.x - (dxL / lenL) * shrink, y: pLast.y - (dyL / lenL) * shrink };
          }
          
          borderD = buildLinePathD(shrinkPts);
        } else {
          borderD = d;
        }
      }
      path.setAttribute('d', d);
      pathBorder.setAttribute('d', borderD);
      pathFlow.setAttribute('d', d);
    } else {
      const ptsAttr = buildPolylinePointsAttr(points);
      poly.setAttribute('points', ptsAttr);
      polyBorder.setAttribute('points', ptsAttr);
      polyFlow.setAttribute('points', ptsAttr);
    }

    applyStrokeAttrs(usePath ? path : poly, props);
    applyBorderAttrs(usePath ? pathBorder : polyBorder, props);
    applyFlowAttrs(usePath ? pathFlow : polyFlow, props);
    applyFrameBorder(props);
    clearMarkers(usePath ? poly : path);

    // Arrow markers
    const markerW = arrowSizePx;
    const markerH = arrowSizePx;

    // 箭头路径: M 0 0 L W H/2 L 0 H z (尖端在右边 x=W，底边在 x=0)
    // 线条端点已经缩短，箭头底边对齐到缩短后的端点，尖端指向原始端点
    // refX=0 让箭头底边对齐线条端点
    const refX = '0';

    // Update markers: markerWidth/Height in user units
    (markerStart as any).setAttribute('markerUnits', 'userSpaceOnUse');
    (markerEnd as any).setAttribute('markerUnits', 'userSpaceOnUse');
    markerStart.setAttribute('viewBox', `0 0 ${markerW} ${markerH}`);
    markerEnd.setAttribute('viewBox', `0 0 ${markerW} ${markerH}`);
    markerStart.setAttribute('orient', 'auto-start-reverse');
    markerEnd.setAttribute('orient', 'auto');
    markerStart.setAttribute('markerWidth', String(markerW));
    markerStart.setAttribute('markerHeight', String(markerH));
    markerStart.setAttribute('refX', refX);
    markerStart.setAttribute('refY', String(markerH / 2));
    startPath.setAttribute('d', `M 0 0 L ${markerW} ${markerH / 2} L 0 ${markerH} z`);

    markerEnd.setAttribute('markerWidth', String(markerW));
    markerEnd.setAttribute('markerHeight', String(markerH));
    markerEnd.setAttribute('refX', refX);
    markerEnd.setAttribute('refY', String(markerH / 2));
    endPath.setAttribute('d', `M 0 0 L ${markerW} ${markerH / 2} L 0 ${markerH} z`);

    startPath.setAttribute('fill', props.stroke);
    endPath.setAttribute('fill', props.stroke);

    if (defaultNoArrows) {
      clearMarkers(usePath ? path : poly);
    } else {
      applyMarkers(usePath ? path : poly, props, useNewArrowAPI);
    }

    flowTargets = [];
    const isPipe = (props as any).renderStyle === 'pipe';

    // Flow animation logic
    if (props.flowEnabled && props.flowSpeed > 0) {
      const spacing = Math.max(2, props.flowSpacing);
      flowSpeedPx = props.flowSpeed;

      if (isPipe) {
        // For Pipe, we animate the dedicated Flow Overlay (polyFlow/pathFlow).
        // The main liquid (poly/path) remains solid.
        // 与 applyFlowAttrs 保持一致
        const dashLen = (props as any).flowLength || 8;
        flowDashSpacing = dashLen + spacing;

        const target = (usePath ? pathFlow : polyFlow) as any;
        flowTargets = [target];
        if (!rafId) tick();
      } else {
        // Legacy/Line style flow: animate the main stroke & border dashes
        // use a dedicated dash pattern so dashoffset moves visible markers.
        const markerLen = Math.max(1, Math.min(spacing - 1, Math.max(1, strokeWidthPx * 1.5)));
        const target = (usePath ? path : poly) as any;
        target.style.strokeDasharray = `${markerLen} ${Math.max(1, spacing - markerLen)}`;

        const borderTarget = (usePath ? (pathBorder as any) : (polyBorder as any)) as any;
        // Keep border dash pattern consistent during flow.
        borderTarget.style.strokeDasharray = `${markerLen} ${Math.max(1, spacing - markerLen)}`;

        flowTargets = [target, borderTarget];
        if (!rafId) tick();
      }
    } else {
      // Flow disabled: stop animation and reset dash styles
      stopFlow();
      flowTargets = [];
      flowSpeedPx = 0;
      flowDashSpacing = 0;
      (poly as any).style.strokeDashoffset = '0';
      (path as any).style.strokeDashoffset = '0';
      (polyBorder as any).style.strokeDashoffset = '0';
      (pathBorder as any).style.strokeDashoffset = '0';
      (polyFlow as any).style.strokeDashoffset = '0';
      (pathFlow as any).style.strokeDashoffset = '0';
    }

    void cachedPathLen;
  }

  // Initial render
  update(ctx);

  return {
    element,
    update,
    destroy: () => {
      stopFlow();
    },
  };
}

export const Main: WidgetMainModule = {
  ...metadata,
  schema: PropsSchema,
  controls,
  create,
  createOverlay,
};

export default Main;
