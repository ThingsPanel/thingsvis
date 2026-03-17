import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import { defineWidget } from '@thingsvis/widget-sdk';

import zh from './locales/zh.json';
import en from './locales/en.json';

function renderCircle(element: HTMLElement, props: Props): void {
  element.style.width = '100%';
  element.style.height = '100%';
  element.style.boxSizing = 'border-box';
  element.style.borderRadius = '50%';
  element.style.backgroundColor = props.fill;
  element.style.border = props.strokeWidth > 0 ? `${props.strokeWidth}px solid ${props.stroke}` : 'none';
  element.style.opacity = String(props.opacity);
}

export const Main = defineWidget({
  id: metadata.id,
  name: metadata.name,
  category: metadata.category,
  icon: metadata.icon,
  version: metadata.version,
  defaultSize: metadata.defaultSize,
  constraints: metadata.constraints,
  resizable: metadata.resizable,
  locales: { zh, en },
  schema: PropsSchema,
  controls,
  render: (element: HTMLElement, props: Props) => {
    renderCircle(element, props);

    return {
      update: (nextProps: Props) => {
        renderCircle(element, nextProps);
      },
      destroy: () => {
        element.removeAttribute('style');
      },
    };
  },
});

export default Main;
