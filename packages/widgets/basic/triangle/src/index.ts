import { defineWidget } from '@thingsvis/widget-sdk';
import { controls } from './controls';
import en from './locales/en.json';
import zh from './locales/zh.json';
import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';

type Point = { x: number; y: number };

function pointToward(from: Point, to: Point, distance: number): Point {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  return {
    x: from.x + (dx / length) * distance,
    y: from.y + (dy / length) * distance,
  };
}

function trianglePath(points: Point[], radius: number): string {
  if (radius <= 0) {
    return `M ${points[0]!.x} ${points[0]!.y} L ${points[1]!.x} ${points[1]!.y} L ${points[2]!.x} ${points[2]!.y} Z`;
  }

  const corners = points.map((point, index) => {
    const previous = points[(index + points.length - 1) % points.length]!;
    const next = points[(index + 1) % points.length]!;
    const previousLength = Math.hypot(previous.x - point.x, previous.y - point.y);
    const nextLength = Math.hypot(next.x - point.x, next.y - point.y);
    const offset = Math.min(radius, previousLength / 2, nextLength / 2);
    return {
      point,
      incoming: pointToward(point, previous, offset),
      outgoing: pointToward(point, next, offset),
    };
  });

  let path = `M ${corners[0]!.outgoing.x} ${corners[0]!.outgoing.y}`;
  for (let index = 1; index <= corners.length; index += 1) {
    const corner = corners[index % corners.length]!;
    path += ` L ${corner.incoming.x} ${corner.incoming.y}`;
    path += ` Q ${corner.point.x} ${corner.point.y} ${corner.outgoing.x} ${corner.outgoing.y}`;
  }
  return `${path} Z`;
}

function renderTriangle(element: HTMLElement, props: Props): void {
  element.style.width = '100%';
  element.style.height = '100%';
  element.style.boxSizing = 'border-box';

  let svg = element.querySelector('svg');
  let path = svg?.querySelector('path');
  if (!svg || !path) {
    const ns = 'http://www.w3.org/2000/svg';
    svg = document.createElementNS(ns, 'svg');
    path = document.createElementNS(ns, 'path');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.style.display = 'block';
    svg.appendChild(path);
    element.replaceChildren(svg);
  }

  const inset = Math.min(10, Math.max(0, props.strokeWidth / 2));
  const points = [
    { x: 50, y: inset },
    { x: 100 - inset, y: 100 - inset },
    { x: inset, y: 100 - inset },
  ];
  path.setAttribute('d', trianglePath(points, props.cornerRadius));
  path.setAttribute('fill', props.fill);
  path.setAttribute('stroke', props.strokeWidth > 0 ? props.stroke : 'none');
  path.setAttribute('stroke-width', String(props.strokeWidth));
  path.setAttribute('stroke-linejoin', 'miter');
  path.setAttribute('stroke-linecap', 'butt');
  path.setAttribute('stroke-miterlimit', '20');
  path.setAttribute('vector-effect', 'non-scaling-stroke');
  path.setAttribute('opacity', String(props.opacity));
}

export const Main = defineWidget({
  ...metadata,
  locales: { zh, en },
  schema: PropsSchema,
  controls,
  render: (element: HTMLElement, props: Props) => {
    renderTriangle(element, props);
    return {
      update: (nextProps: Props) => renderTriangle(element, nextProps),
      destroy: () => element.replaceChildren(),
    };
  },
});

export default Main;
