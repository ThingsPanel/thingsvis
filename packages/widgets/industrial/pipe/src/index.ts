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
import { computeIndustrialPipeLocalRoute, getPipeNodeWorldBoundsFromDom, type Pt } from './routeWorld';

type LinkedNodeInfo = {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
};

type PipePt = Pt;

function pipePointsToPathD(points: PipePt[], cornerRadius = 0): string {
  if (!points || points.length === 0) return '';
  const first = points[0]!;
  let d = `M ${first.x} ${first.y}`;

  if (cornerRadius <= 0 || points.length < 3) {
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i]!.x} ${points[i]!.y}`;
    }
    return d;
  }

  for (let i = 1; i < points.length; i++) {
    const current = points[i]!;
    const prev = points[i - 1]!;
    const next = points[i + 1];

    if (!next) {
      d += ` L ${current.x} ${current.y}`;
      continue;
    }

    const prevHorizontal = prev.y === current.y;
    const nextHorizontal = next.y === current.y;
    const isOrthogonalTurn = prevHorizontal !== nextHorizontal;

    if (!isOrthogonalTurn) {
      d += ` L ${current.x} ${current.y}`;
      continue;
    }

    const prevLen = Math.abs(prevHorizontal ? current.x - prev.x : current.y - prev.y);
    const nextLen = Math.abs(nextHorizontal ? next.x - current.x : next.y - current.y);
    const radius = Math.min(cornerRadius, prevLen / 2, nextLen / 2);

    if (radius <= 0) {
      d += ` L ${current.x} ${current.y}`;
      continue;
    }

    const before = prevHorizontal
      ? { x: current.x - Math.sign(current.x - prev.x) * radius, y: current.y }
      : { x: current.x, y: current.y - Math.sign(current.y - prev.y) * radius };
    const after = nextHorizontal
      ? { x: current.x + Math.sign(next.x - current.x) * radius, y: current.y }
      : { x: current.x, y: current.y + Math.sign(next.y - current.y) * radius };

    d += ` L ${before.x} ${before.y} Q ${current.x} ${current.y} ${after.x} ${after.y}`;
  }

  return d;
}

function clampMinSize(size?: { width: number; height: number }) {
  return {
    width: Math.max(1, Number(size?.width ?? 0)),
    height: Math.max(1, Number(size?.height ?? 0)),
  };
}

function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
  const B = Math.min(255, (num & 0x0000ff) + amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
  const B = Math.max(0, (num & 0x0000ff) - amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
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

  const uuid = Math.random().toString(36).slice(2, 9);
  const glowId = `pipe-glow-${uuid}`;
  const defs = document.createElementNS(svgNS, 'defs');
  defs.innerHTML = `
    <filter id="${glowId}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  `;
  svg.appendChild(defs);

  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('viewBox', '0 0 1 1');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.style.width = '100%';
  svg.style.height = '100%';
  svg.style.overflow = 'visible';
  svg.style.pointerEvents = 'none';

  const borderPath = document.createElementNS(svgNS, 'path');
  borderPath.setAttribute('fill', 'none');
  borderPath.setAttribute('vector-effect', 'non-scaling-stroke');

  const pipePath = document.createElementNS(svgNS, 'path');
  pipePath.setAttribute('fill', 'none');
  pipePath.setAttribute('vector-effect', 'non-scaling-stroke');

  const shadowPath = document.createElementNS(svgNS, 'path');
  shadowPath.setAttribute('fill', 'none');
  shadowPath.setAttribute('vector-effect', 'non-scaling-stroke');
  shadowPath.style.pointerEvents = 'none';

  const highlightPath = document.createElementNS(svgNS, 'path');
  highlightPath.setAttribute('fill', 'none');
  highlightPath.setAttribute('vector-effect', 'non-scaling-stroke');
  highlightPath.style.pointerEvents = 'none';

  const flowPath = document.createElementNS(svgNS, 'path');
  flowPath.setAttribute('fill', 'none');
  flowPath.setAttribute('vector-effect', 'non-scaling-stroke');
  flowPath.style.pointerEvents = 'none';

  svg.appendChild(borderPath);
  svg.appendChild(pipePath);
  svg.appendChild(shadowPath);
  svg.appendChild(highlightPath);
  svg.appendChild(flowPath);
  element.appendChild(svg);

  let rafId: number | null = null;
  let lastTs = 0;
  let dashOffset = 0;
  let flowTarget: SVGElement | null = null;
  let flowSpeedPx = 0;
  let flowSpacingPx = 0;
  let flowDirection = 1;

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
      if (flowTarget) {
        flowTarget.style.strokeDashoffset = String(dashOffset);
      }

      tick();
    });
  }

  function applyPipeAttrs(el: SVGElement, props: Props) {
    const strokeWidth = getStrokeWidthPx(props.strokeWidth);
    el.setAttribute('stroke', props.pipeColor);
    el.setAttribute('stroke-width', String(strokeWidth));
    el.setAttribute('opacity', String(props.opacity));
    el.setAttribute('stroke-linecap', props.pipeStyle === 'realistic' ? 'round' : 'square');
    el.setAttribute('stroke-linejoin', 'round');
  }

  function applyBorderAttrs(el: SVGElement, props: Props) {
    const strokeWidth = getStrokeWidthPx(props.strokeWidth);
    const outlineWidth = Math.max(1, Math.round(strokeWidth * 0.25));

    el.setAttribute('stroke', props.pipeBackground);
    el.setAttribute('stroke-width', String(strokeWidth + outlineWidth * 2));
    el.setAttribute('opacity', String(props.opacity));
    el.setAttribute('stroke-linecap', props.pipeStyle === 'realistic' ? 'round' : 'square');
    el.setAttribute('stroke-linejoin', 'round');
    el.setAttribute('stroke-miterlimit', '10');
  }

  function applyRealisticAttrs(shadowEl: SVGElement, highlightEl: SVGElement, props: Props) {
    if (props.pipeStyle !== 'realistic') {
      shadowEl.style.display = 'none';
      highlightEl.style.display = 'none';
      return;
    }

    const strokeWidth = getStrokeWidthPx(props.strokeWidth);
    shadowEl.style.display = '';
    highlightEl.style.display = '';

    shadowEl.setAttribute('stroke', darkenColor(props.pipeColor, 35));
    shadowEl.setAttribute('stroke-width', String(Math.max(2, strokeWidth * 0.68)));
    shadowEl.setAttribute('opacity', String(Math.min(0.45, props.opacity)));
    shadowEl.setAttribute('stroke-linecap', 'round');
    shadowEl.setAttribute('stroke-linejoin', 'round');

    highlightEl.setAttribute('stroke', lightenColor(props.pipeColor, 42));
    highlightEl.setAttribute('stroke-width', String(Math.max(1, strokeWidth * 0.18)));
    highlightEl.setAttribute('opacity', String(Math.min(0.75, props.opacity)));
    highlightEl.setAttribute('stroke-linecap', 'round');
    highlightEl.setAttribute('stroke-linejoin', 'round');
  }

  function applyFlowAttrs(el: SVGElement, props: Props) {
    if (!props.flowEnabled) {
      el.style.display = 'none';
      return;
    }

    const strokeWidth = getStrokeWidthPx(props.strokeWidth);
    const flowWidth = Math.max(2, strokeWidth - 2);
    el.style.display = '';
    
    if (props.glowEnabled) {
       el.setAttribute('filter', `url(#${glowId})`);
       el.setAttribute('stroke', props.glowColor || props.flowColor);
       el.style.transition = 'stroke 0.2s';
       
       const filter = defs.querySelector(`#${glowId} feGaussianBlur`);
       if (filter) {
         filter.setAttribute('stdDeviation', String(props.glowIntensity));
       }
    } else {
       el.removeAttribute('filter');
       el.setAttribute('stroke', props.flowColor);
    }
    
    el.setAttribute('stroke-width', String(flowWidth));
    el.setAttribute('opacity', '1');
    el.setAttribute('stroke-linecap', 'butt');
    el.setAttribute('stroke-linejoin', 'round');
    el.setAttribute('stroke-dasharray', `${props.flowLength} ${props.flowSpacing}`);
  }

  function update(nextProps: Props, nextCtx: WidgetOverlayContext) {
    const size = clampMinSize((nextCtx as any).size);
    const widgetPosition = nextCtx.position ?? { x: 0, y: 0 };
    const linkedNodes = (nextCtx as any).linkedNodes as Record<string, LinkedNodeInfo> | undefined;
    const sourceNode = nextProps.sourceNodeId ? linkedNodes?.[nextProps.sourceNodeId] : undefined;
    const targetNode = nextProps.targetNodeId ? linkedNodes?.[nextProps.targetNodeId] : undefined;

    const sourceDomNode =
      nextProps.sourceNodeId && !sourceNode ? getPipeNodeWorldBoundsFromDom(nextProps.sourceNodeId) : undefined;
    const targetDomNode =
      nextProps.targetNodeId && !targetNode ? getPipeNodeWorldBoundsFromDom(nextProps.targetNodeId) : undefined;

    const hasNodeBinding = !!(sourceNode || targetNode || sourceDomNode || targetDomNode);

    const wv = (window as any)._thingsvisViewport as { offsetX: number; offsetY: number; zoom: number } | undefined;
    let routePoints = computeIndustrialPipeLocalRoute(nextProps, size, widgetPosition, linkedNodes, {
      viewport: {
        zoom: (nextCtx as any).zoom ?? wv?.zoom ?? 1,
        offsetX: wv?.offsetX ?? 0,
        offsetY: wv?.offsetY ?? 0,
      },
      containerEl: null,
    });

    if (hasNodeBinding && routePoints.length) {
      const strokeWidth = getStrokeWidthPx(nextProps.strokeWidth);
      const pad = Math.max(20, strokeWidth * 2 + 12);
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      for (const point of routePoints) {
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
      
      routePoints = routePoints.map((point) => ({ x: point.x - minX, y: point.y - minY }));
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

    const cornerRadius = Math.max(0, Math.min(nextProps.cornerRadius, 80));
    const pipeD = pipePointsToPathD(routePoints, cornerRadius);
    const flowD = pipeD;
    borderPath.setAttribute('d', pipeD);
    pipePath.setAttribute('d', pipeD);
    pipePath.setAttribute('data-route-points', JSON.stringify(routePoints));
    shadowPath.setAttribute('d', pipeD);
    highlightPath.setAttribute('d', pipeD);
    flowPath.setAttribute('d', flowD);

    applyBorderAttrs(borderPath, nextProps);
    applyPipeAttrs(pipePath, nextProps);
    applyRealisticAttrs(shadowPath, highlightPath, nextProps);
    applyFlowAttrs(flowPath, nextProps);

    if (nextProps.flowEnabled && nextProps.flowSpeed > 0) {
      flowSpeedPx = nextProps.flowSpeed;
      flowSpacingPx = nextProps.flowLength + nextProps.flowSpacing;
      flowDirection = nextProps.flowDirection === 'reverse' ? 1 : -1;
      flowTarget = flowPath as SVGElement & { style: CSSStyleDeclaration };
      if (!rafId) tick();
    } else {
      stopFlow();
      flowTarget = null;
      dashOffset = 0;
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
