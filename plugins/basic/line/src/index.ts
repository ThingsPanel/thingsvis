import { Rect } from 'leafer-ui';
import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, getStrokeWidthPx, getStrokeDasharray, type Props } from './schema';
import { controls } from './controls';
import type { PluginMainModule, PluginOverlayContext, PluginOverlayInstance } from './lib/types';

type Pt = { x: number; y: number };

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

/** 构建折线路径（Elbow），适用于流程图式连接 */
function buildElbowPathD(points: Pt[]): string {
  if (points.length < 2) return '';
  const a = points[0]!;
  const b = points[points.length - 1]!;

  // 折线：从起点水平走一半，然后垂直到终点的 y，再水平到终点
  const midX = (a.x + b.x) / 2;
  return `M ${a.x} ${a.y} L ${midX} ${a.y} L ${midX} ${b.y} L ${b.x} ${b.y}`;
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

function createOverlay(ctx: PluginOverlayContext): PluginOverlayInstance {
  const element = document.createElement('div');
  element.style.width = '100%';
  element.style.height = '100%';
  element.style.boxSizing = 'border-box';

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('viewBox', '0 0 1 1');
  svg.setAttribute('preserveAspectRatio', 'none');

  const defs = document.createElementNS(svgNS, 'defs');
  svg.appendChild(defs);

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

  svg.appendChild(poly);
  svg.appendChild(path);
  element.appendChild(svg);

  // Flow animation state
  let rafId: number | null = null;
  let lastTS = 0;
  let dashOffset = 0;
  let cachedPathLen = 0;

  let flowTarget: (SVGGeometryElement & { style: CSSStyleDeclaration }) | null = null;

  function stopFlow() {
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    lastTS = 0;
  }

  function tick(speed: number, dashSpacing: number) {
    rafId = requestAnimationFrame((ts) => {
      if (!lastTS) lastTS = ts;
      const dt = Math.max(0, ts - lastTS) / 1000;
      lastTS = ts;

      // px/s -> px per frame
      dashOffset = (dashOffset - speed * dt) % Math.max(1, dashSpacing);
      if (flowTarget) flowTarget.style.strokeDashoffset = String(dashOffset);
      tick(speed, dashSpacing);
    });
  }

  function applyStrokeAttrs(el: SVGElement, props: Props) {
    const strokeWidthPx = getStrokeWidthPx(props.strokeWidth);
    const dashArray = getStrokeDasharray(props.strokeStyle, strokeWidthPx);
    
    el.setAttribute('stroke', props.stroke);
    el.setAttribute('stroke-width', String(strokeWidthPx));
    el.setAttribute('opacity', String(props.opacity));
    el.setAttribute('stroke-linecap', props.lineCap);
    el.setAttribute('stroke-linejoin', 'round');

    // 优先使用新的 strokeStyle，回退到旧的 dashPattern
    if (dashArray) {
      el.setAttribute('stroke-dasharray', dashArray);
    } else if (props.dashPattern && props.dashPattern.trim()) {
      el.setAttribute('stroke-dasharray', props.dashPattern);
    } else {
      el.removeAttribute('stroke-dasharray');
    }
  }

  function clearMarkers(el: SVGElement) {
    el.removeAttribute('marker-start');
    el.removeAttribute('marker-end');
  }

  function applyMarkers(el: SVGElement, props: Props) {
    // 新 API: arrowStart 和 arrowEnd
    const hasArrowStart = props.arrowStart === 'arrow';
    const hasArrowEnd = props.arrowEnd === 'arrow';
    
    // 如果新 API 有值，使用新 API；否则回退到旧的 direction
    const useNewAPI = props.arrowStart !== undefined || props.arrowEnd !== undefined;
    
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

  function update(next: PluginOverlayContext) {
    const defaults = getDefaultProps();
    const props: Props = { ...defaults, ...(next.props as Partial<Props>) };

    const size = clampMinSize((next as any).size);
    const strokeWidthPx = getStrokeWidthPx(props.strokeWidth);
    const arrowSizePx = Math.max(4, props.arrowSize);

    // Keep viewBox in px so points are intuitive
    svg.setAttribute('viewBox', `0 0 ${size.width} ${size.height}`);

    const rawPoints = Array.isArray(props.points) ? (props.points as any as Pt[]) : defaults.points;
    let points = toPxPoints(rawPoints, size);
    
    // 应用手绘风格抖动
    const seed = next.id ? next.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : 42;
    points = applySloppiness(points, props.sloppiness, seed);

    // 判断箭头是否显示
    const hasArrowStart = props.arrowStart === 'arrow' || props.direction === 'reverse' || props.direction === 'bidirectional';
    const hasArrowEnd = props.arrowEnd === 'arrow' || props.direction === 'forward' || props.direction === 'bidirectional';

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

    // 根据 arrowType 或 kind 决定使用哪种路径
    const arrowType = props.arrowType || 'straight';
    const kind = props.kind;
    
    // 决定路径类型
    let pathType: 'polyline' | 'curve' | 'elbow' | 'mind' = 'polyline';
    if (arrowType === 'curved' || kind === 'curve') {
      pathType = 'curve';
    } else if (arrowType === 'elbow') {
      pathType = 'elbow';
    } else if (kind === 'mind') {
      pathType = 'mind';
    } else if (kind === 'polyline' || kind === 'straight') {
      pathType = 'polyline';
    }
    
    const usePath = pathType === 'curve' || pathType === 'mind' || pathType === 'elbow';
    poly.style.display = usePath ? 'none' : '';
    path.style.display = usePath ? '' : 'none';

    if (usePath) {
      const radius = Math.min(60, Math.max(6, strokeWidthPx * 1.5));
      let d: string;
      if (pathType === 'curve') {
        d = buildCurvePathD(points);
      } else if (pathType === 'elbow') {
        d = buildElbowPathD(points);
      } else {
        d = buildRoundedPolylinePathD(points, radius);
      }
      path.setAttribute('d', d);
    } else {
      poly.setAttribute('points', buildPolylinePointsAttr(points));
    }

    applyStrokeAttrs(usePath ? path : poly, props);
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

    applyMarkers(usePath ? path : poly, props);

    // Flow: use a dedicated dash pattern so dashoffset moves visible markers.
    if (props.flowEnabled && props.flowSpeed > 0) {
      const spacing = Math.max(2, props.flowSpacing);
      const markerLen = Math.max(1, Math.min(spacing - 1, Math.max(1, strokeWidthPx * 1.5)));
      const target = (usePath ? path : poly) as any;
      target.style.strokeDasharray = `${markerLen} ${Math.max(1, spacing - markerLen)}`;

      // Cache length for potential future use
      if ((usePath ? (path as any) : (poly as any)).getTotalLength) {
        try {
          cachedPathLen = (usePath ? (path as any) : (poly as any)).getTotalLength();
        } catch {
          cachedPathLen = polylineLength(points);
        }
      } else {
        cachedPathLen = polylineLength(points);
      }

      flowTarget = (usePath ? (path as any) : (poly as any)) as any;

      if (rafId == null) {
        dashOffset = 0;
        lastTS = 0;
        tick(props.flowSpeed, spacing);
      }
    } else {
      stopFlow();
      flowTarget = null;
      (poly as any).style.strokeDashoffset = '0';
      (path as any).style.strokeDashoffset = '0';
      // Restore user dashPattern if set
      if (props.dashPattern && props.dashPattern.trim()) {
        (poly as any).style.strokeDasharray = props.dashPattern;
        (path as any).style.strokeDasharray = props.dashPattern;
      } else {
        (poly as any).style.strokeDasharray = '';
        (path as any).style.strokeDasharray = '';
      }
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

export const Main: PluginMainModule = {
  ...metadata,
  schema: PropsSchema,
  controls,
  create,
  createOverlay,
};

export default Main;
