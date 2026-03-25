import { defineWidget, type WidgetOverlayContext } from '@thingsvis/widget-sdk';
import { metadata } from './metadata';
import { controls } from './controls';
import {
  PropsSchema,
  getDefaultProps,
  getStrokeDasharray,
  getStrokeWidthPx,
  type Props,
} from './schema';
import zh from './locales/zh.json';
import en from './locales/en.json';

type Pt = { x: number; y: number };
type AnchorType = 'top' | 'right' | 'bottom' | 'left' | 'center';
type LinkedNodeInfo = {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
};

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

function worldToLocal(worldPt: Pt, nodePosition: Pt): Pt {
  return {
    x: worldPt.x - nodePosition.x,
    y: worldPt.y - nodePosition.y,
  };
}

function isNormalizedPoints(points: Pt[]): boolean {
  return points.every((p) => p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1);
}

function toPxPoints(points: Pt[], size: { width: number; height: number }): Pt[] {
  if (!points.length || !size.width || !size.height) return points;
  if (!isNormalizedPoints(points)) return points;
  return points.map((p) => ({ x: p.x * size.width, y: p.y * size.height }));
}

function clampMinSize(size?: { width: number; height: number }) {
  return {
    width: Math.max(1, Number(size?.width ?? 0)),
    height: Math.max(1, Number(size?.height ?? 0)),
  };
}

function buildPolylinePointsAttr(points: Pt[]): string {
  return points.map((p) => `${p.x},${p.y}`).join(' ');
}

function buildLinePathD(points: Pt[]): string {
  if (points.length < 2) return '';
  const first = points[0]!;
  let d = `M ${first.x} ${first.y}`;
  for (let i = 1; i < points.length; i++) {
    const p = points[i]!;
    d += ` L ${p.x} ${p.y}`;
  }
  return d;
}

function buildElbowRoutePoints(a: Pt, b: Pt, sourceAnchor?: AnchorType, targetAnchor?: AnchorType): Pt[] {
  const sourceHorizontal = sourceAnchor === 'left' || sourceAnchor === 'right';
  const sourceVertical = sourceAnchor === 'top' || sourceAnchor === 'bottom';
  const targetHorizontal = targetAnchor === 'left' || targetAnchor === 'right';
  const targetVertical = targetAnchor === 'top' || targetAnchor === 'bottom';

  if (sourceVertical && targetVertical) {
    const midY = (a.y + b.y) / 2;
    return [a, { x: a.x, y: midY }, { x: b.x, y: midY }, b];
  }
  if (sourceHorizontal && targetHorizontal) {
    const midX = (a.x + b.x) / 2;
    return [a, { x: midX, y: a.y }, { x: midX, y: b.y }, b];
  }
  if (sourceVertical && targetHorizontal) {
    return [a, { x: a.x, y: b.y }, b];
  }
  if (sourceHorizontal && targetVertical) {
    return [a, { x: b.x, y: a.y }, b];
  }
  const midX = (a.x + b.x) / 2;
  return [a, { x: midX, y: a.y }, { x: midX, y: b.y }, b];
}

function isHorizontalSegment(a: Pt, b: Pt, eps = 1) {
  return Math.abs(a.y - b.y) < eps;
}

function isVerticalSegment(a: Pt, b: Pt, eps = 1) {
  return Math.abs(a.x - b.x) < eps;
}

function orthogonalizePipePoints(points: Pt[], sourceAnchor?: AnchorType, targetAnchor?: AnchorType): Pt[] {
  if (points.length < 2) return points;

  const result: Pt[] = [points[0]!];

  const chooseElbow = (
    a: Pt,
    b: Pt,
    prev?: Pt,
    next?: Pt,
    isFirst?: boolean,
    isLast?: boolean,
  ): Pt => {
    let firstLeg: 'horizontal' | 'vertical' | null = null;

    if (isFirst) {
      if (sourceAnchor === 'left' || sourceAnchor === 'right') firstLeg = 'horizontal';
      if (sourceAnchor === 'top' || sourceAnchor === 'bottom') firstLeg = 'vertical';
    }

    if (!firstLeg && prev) {
      if (isHorizontalSegment(prev, a)) firstLeg = 'vertical';
      else if (isVerticalSegment(prev, a)) firstLeg = 'horizontal';
    }

    if (!firstLeg && next) {
      if (isHorizontalSegment(b, next)) firstLeg = 'horizontal';
      else if (isVerticalSegment(b, next)) firstLeg = 'vertical';
    }

    if (!firstLeg && isLast) {
      if (targetAnchor === 'left' || targetAnchor === 'right') firstLeg = 'vertical';
      if (targetAnchor === 'top' || targetAnchor === 'bottom') firstLeg = 'horizontal';
    }

    if (!firstLeg) {
      firstLeg = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y) ? 'horizontal' : 'vertical';
    }

    return firstLeg === 'horizontal' ? { x: b.x, y: a.y } : { x: a.x, y: b.y };
  };

  for (let i = 1; i < points.length; i++) {
    const a = result[result.length - 1]!;
    const b = points[i]!;

    if (isHorizontalSegment(a, b) || isVerticalSegment(a, b)) {
      result.push(b);
      continue;
    }

    const prev = result.length >= 2 ? result[result.length - 2] : undefined;
    const next = i < points.length - 1 ? points[i + 1] : undefined;
    const elbow = chooseElbow(a, b, prev, next, i === 1, i === points.length - 1);

    if (Math.abs(elbow.x - a.x) >= 1 || Math.abs(elbow.y - a.y) >= 1) {
      result.push(elbow);
    }
    result.push(b);
  }

  const compacted: Pt[] = [result[0]!];
  for (let i = 1; i < result.length - 1; i++) {
    const prev = compacted[compacted.length - 1]!;
    const curr = result[i]!;
    const next = result[i + 1]!;
    const collinearX = isVerticalSegment(prev, curr) && isVerticalSegment(curr, next);
    const collinearY = isHorizontalSegment(prev, curr) && isHorizontalSegment(curr, next);
    if (collinearX || collinearY) continue;
    compacted.push(curr);
  }
  compacted.push(result[result.length - 1]!);

  if (compacted.length > 4) {
    return buildCanonicalPipeRoute(
      compacted[0]!,
      compacted[compacted.length - 1]!,
      sourceAnchor,
      targetAnchor,
    );
  }

  return compacted;
}

function buildCanonicalPipeRoute(
  start: Pt,
  end: Pt,
  sourceAnchor?: AnchorType,
  targetAnchor?: AnchorType,
): Pt[] {
  if (isHorizontalSegment(start, end) || isVerticalSegment(start, end)) {
    return [start, end];
  }
  return buildElbowRoutePoints(start, end, sourceAnchor, targetAnchor);
}

function renderPipe(element: HTMLElement, initialProps: Props, initialCtx: WidgetOverlayContext) {
  element.style.width = '100%';
  element.style.height = '100%';
  element.style.boxSizing = 'border-box';
  element.style.position = 'relative';
  element.style.overflow = 'visible';
  element.style.pointerEvents = 'none';

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('viewBox', '0 0 1 1');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.style.width = '100%';
  svg.style.height = '100%';
  svg.style.overflow = 'visible';
  svg.style.pointerEvents = 'none';

  const borderPolyline = document.createElementNS(svgNS, 'polyline');
  borderPolyline.setAttribute('fill', 'none');
  borderPolyline.setAttribute('vector-effect', 'non-scaling-stroke');

  const borderPath = document.createElementNS(svgNS, 'path');
  borderPath.setAttribute('fill', 'none');
  borderPath.setAttribute('vector-effect', 'non-scaling-stroke');

  const pipePolyline = document.createElementNS(svgNS, 'polyline');
  pipePolyline.setAttribute('fill', 'none');
  pipePolyline.setAttribute('vector-effect', 'non-scaling-stroke');

  const pipePath = document.createElementNS(svgNS, 'path');
  pipePath.setAttribute('fill', 'none');
  pipePath.setAttribute('vector-effect', 'non-scaling-stroke');

  const flowPolyline = document.createElementNS(svgNS, 'polyline');
  flowPolyline.setAttribute('fill', 'none');
  flowPolyline.setAttribute('vector-effect', 'non-scaling-stroke');
  flowPolyline.style.pointerEvents = 'none';

  const flowPath = document.createElementNS(svgNS, 'path');
  flowPath.setAttribute('fill', 'none');
  flowPath.setAttribute('vector-effect', 'non-scaling-stroke');
  flowPath.style.pointerEvents = 'none';

  svg.appendChild(borderPolyline);
  svg.appendChild(borderPath);
  svg.appendChild(pipePolyline);
  svg.appendChild(pipePath);
  svg.appendChild(flowPolyline);
  svg.appendChild(flowPath);
  element.appendChild(svg);

  let rafId: number | null = null;
  let lastTs = 0;
  let dashOffset = 0;
  let flowTargets: Array<SVGElement & { style: CSSStyleDeclaration }> = [];
  let flowSpeedPx = 0;
  let flowSpacingPx = 0;
  let flowDirection = 1;
  const defaults = getDefaultProps();

  function stopFlow() {
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    lastTs = 0;
  }

  function tick() {
    rafId = requestAnimationFrame((ts) => {
      if (!lastTs) lastTs = ts;
      const dt = Math.max(0, ts - lastTs) / 1000;
      lastTs = ts;

      const spacing = Math.max(1, flowSpacingPx);
      dashOffset = dashOffset + flowDirection * flowSpeedPx * dt;
      dashOffset = ((dashOffset % spacing) + spacing) % spacing;
      for (const target of flowTargets) {
        target.style.strokeDashoffset = String(dashOffset);
      }

      tick();
    });
  }

  function applyPipeAttrs(el: SVGElement, props: Props) {
    const strokeWidth = getStrokeWidthPx(props.strokeWidth);
    const dashArray = props.flowEnabled ? '' : getStrokeDasharray(props.strokeStyle, strokeWidth);
    el.setAttribute('stroke', props.stroke);
    el.setAttribute('stroke-width', String(strokeWidth));
    el.setAttribute('opacity', String(props.opacity));
    el.setAttribute('stroke-linecap', 'square');
    el.setAttribute('stroke-linejoin', 'miter');

    if (dashArray) {
      el.setAttribute('stroke-dasharray', dashArray);
    } else {
      el.removeAttribute('stroke-dasharray');
    }
  }

  function applyBorderAttrs(el: SVGElement, props: Props) {
    const strokeWidth = getStrokeWidthPx(props.strokeWidth);
    const outlineWidth = Math.max(1, Math.round(strokeWidth * 0.25));
    const dashArray = props.flowEnabled ? '' : getStrokeDasharray(props.strokeStyle, strokeWidth);

    el.setAttribute('stroke', props.pipeBackground);
    el.setAttribute('stroke-width', String(strokeWidth + outlineWidth * 2));
    el.setAttribute('opacity', String(props.opacity));
    el.setAttribute('stroke-linecap', 'square');
    el.setAttribute('stroke-linejoin', 'miter');
    el.setAttribute('stroke-miterlimit', '10');

    if (dashArray) {
      el.setAttribute('stroke-dasharray', dashArray);
    } else {
      el.removeAttribute('stroke-dasharray');
    }
  }

  function applyFlowAttrs(el: SVGElement, props: Props) {
    if (!props.flowEnabled) {
      el.style.display = 'none';
      return;
    }

    const strokeWidth = getStrokeWidthPx(props.strokeWidth);
    const flowWidth = Math.max(2, Math.min(strokeWidth - 1, Math.round(strokeWidth * 0.5) || 1));
    el.style.display = '';
    el.setAttribute('stroke', props.flowColor || props.stroke);
    el.setAttribute('stroke-width', String(flowWidth));
    el.setAttribute('opacity', '0.9');
    el.setAttribute('stroke-linecap', 'round');
    el.setAttribute('stroke-linejoin', 'round');
    el.setAttribute('stroke-dasharray', `${props.flowLength} ${props.flowSpacing}`);
  }

  function update(nextProps: Props, nextCtx: WidgetOverlayContext) {
    const size = clampMinSize((nextCtx as any).size);
    const widgetPosition = nextCtx.position ?? { x: 0, y: 0 };
    const linkedNodes = (nextCtx as any).linkedNodes as Record<string, LinkedNodeInfo> | undefined;
    const sourceNode = nextProps.sourceNodeId ? linkedNodes?.[nextProps.sourceNodeId] : undefined;
    const targetNode = nextProps.targetNodeId ? linkedNodes?.[nextProps.targetNodeId] : undefined;
    const hasNodeBinding = !!(sourceNode || targetNode);

    let points: Pt[];
    if (hasNodeBinding) {
      const startPt = sourceNode
        ? worldToLocal(getAnchorPoint(sourceNode, nextProps.sourceAnchor), widgetPosition)
        : { x: 0, y: size.height / 2 };
      const endPt = targetNode
        ? worldToLocal(getAnchorPoint(targetNode, nextProps.targetAnchor), widgetPosition)
        : { x: size.width, y: size.height / 2 };
      const rawPoints = Array.isArray(nextProps.points) ? nextProps.points : defaults.points;
      const pxPoints = toPxPoints(rawPoints as Pt[], size);
      if (pxPoints.length >= 3) {
        points = orthogonalizePipePoints(
          pxPoints.map((point, index) => {
            if (index === 0) return startPt;
            if (index === pxPoints.length - 1) return endPt;
            return point;
          }),
          nextProps.sourceAnchor,
          nextProps.targetAnchor,
        );
      } else {
        points = buildElbowRoutePoints(startPt, endPt, nextProps.sourceAnchor, nextProps.targetAnchor);
      }
    } else {
      const rawPoints = Array.isArray(nextProps.points) ? nextProps.points : defaults.points;
      const pxPoints = toPxPoints(rawPoints as Pt[], size);
      points =
        pxPoints.length >= 3
          ? orthogonalizePipePoints(pxPoints, nextProps.sourceAnchor, nextProps.targetAnchor)
          : buildElbowRoutePoints(
              pxPoints[0] ?? { x: 0, y: size.height / 2 },
              pxPoints[pxPoints.length - 1] ?? { x: size.width, y: size.height / 2 },
              nextProps.sourceAnchor,
              nextProps.targetAnchor,
            );
    }

    if (hasNodeBinding && points.length) {
      const strokeWidth = getStrokeWidthPx(nextProps.strokeWidth);
      const pad = Math.max(20, strokeWidth * 2 + 12);
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      for (const point of points) {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      }

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
      points = points.map((point) => ({ x: point.x - minX, y: point.y - minY }));
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

    const usePath = points.length >= 3;
    borderPolyline.style.display = usePath ? 'none' : '';
    pipePolyline.style.display = usePath ? 'none' : '';
    flowPolyline.style.display = usePath ? 'none' : '';
    borderPath.style.display = usePath ? '' : 'none';
    pipePath.style.display = usePath ? '' : 'none';
    flowPath.style.display = usePath ? '' : 'none';

    if (usePath) {
      const d = buildLinePathD(points);
      borderPath.setAttribute('d', d);
      pipePath.setAttribute('d', d);
      flowPath.setAttribute('d', d);
    } else {
      const polyline = buildPolylinePointsAttr(points);
      borderPolyline.setAttribute('points', polyline);
      pipePolyline.setAttribute('points', polyline);
      flowPolyline.setAttribute('points', polyline);
    }

    applyBorderAttrs(usePath ? borderPath : borderPolyline, nextProps);
    applyPipeAttrs(usePath ? pipePath : pipePolyline, nextProps);
    applyFlowAttrs(usePath ? flowPath : flowPolyline, nextProps);

    if (nextProps.flowEnabled && nextProps.flowSpeed > 0) {
      flowSpeedPx = nextProps.flowSpeed;
      flowSpacingPx = nextProps.flowLength + nextProps.flowSpacing;
      flowDirection = nextProps.flowDirection === 'reverse' ? 1 : -1;
      flowTargets = [(usePath ? flowPath : flowPolyline) as SVGElement & { style: CSSStyleDeclaration }];
      if (!rafId) tick();
    } else {
      stopFlow();
      flowTargets = [];
      dashOffset = 0;
      flowPolyline.style.strokeDashoffset = '0';
      flowPath.style.strokeDashoffset = '0';
    }
  }

  update(initialProps, initialCtx);

  return {
    update,
    destroy: () => {
      stopFlow();
      element.innerHTML = '';
    },
  };
}

export const Main = defineWidget({
  ...metadata,
  locales: { zh, en },
  schema: PropsSchema,
  controls,
  render: renderPipe,
});

export default Main;
