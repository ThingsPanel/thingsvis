import { defineWidget } from '@thingsvis/widget-sdk';
import { controls } from './controls';
import en from './locales/en.json';
import zh from './locales/zh.json';
import { metadata } from './metadata';
import { getStrokeDasharray, PropsSchema, type Props } from './schema';

function renderStraightLine(element: HTMLElement, props: Props): void {
  element.style.width = '100%';
  element.style.height = '100%';
  element.style.boxSizing = 'border-box';

  let svg = element.querySelector('svg');
  let line = svg?.querySelector('line');
  if (!svg || !line) {
    const ns = 'http://www.w3.org/2000/svg';
    svg = document.createElementNS(ns, 'svg');
    line = document.createElementNS(ns, 'line');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.style.display = 'block';
    svg.appendChild(line);
    element.replaceChildren(svg);
  }

  const width = Math.max(1, props.strokeWidth);
  const padding = width / 2;
  svg.setAttribute('viewBox', '0 0 100 100');
  line.setAttribute('x1', String(padding));
  line.setAttribute('y1', '50');
  line.setAttribute('x2', String(100 - padding));
  line.setAttribute('y2', '50');
  line.setAttribute('fill', 'none');
  line.setAttribute('stroke', props.stroke);
  line.setAttribute('stroke-width', String(width));
  line.setAttribute('stroke-linecap', props.strokeStyle === 'dotted' ? 'round' : 'butt');
  line.setAttribute('vector-effect', 'non-scaling-stroke');
  line.setAttribute('opacity', String(props.opacity));

  const dasharray = getStrokeDasharray(props.strokeStyle, width);
  if (dasharray) line.setAttribute('stroke-dasharray', dasharray);
  else line.removeAttribute('stroke-dasharray');
}

export const Main = defineWidget({
  ...metadata,
  locales: { zh, en },
  schema: PropsSchema,
  controls,
  render: (element: HTMLElement, props: Props) => {
    renderStraightLine(element, props);
    return {
      update: (nextProps: Props) => renderStraightLine(element, nextProps),
      destroy: () => element.replaceChildren(),
    };
  },
});

export default Main;
