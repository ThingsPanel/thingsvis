import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import { defineWidget } from '@thingsvis/widget-sdk';

import zh from './locales/zh.json';
import en from './locales/en.json';

const BLINK_STYLE_ID = 'thingsvis-basic-rectangle-blink-style';

function ensureBlinkStyle(): void {
  if (typeof document === 'undefined' || document.getElementById(BLINK_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = BLINK_STYLE_ID;
  style.textContent = `
    @keyframes thingsvis-basic-rectangle-blink {
      0%, 100% {
        opacity: var(--thingsvis-rectangle-opacity, 1);
        background-color: var(--thingsvis-rectangle-fill);
        box-shadow: 0 0 0 rgba(255, 255, 255, 0);
      }
      50% {
        opacity: var(--thingsvis-rectangle-blink-min-opacity, 0.35);
        background-color: var(--thingsvis-rectangle-alt-fill, var(--thingsvis-rectangle-fill));
        box-shadow: 0 0 10px var(--thingsvis-rectangle-alt-fill, var(--thingsvis-rectangle-fill));
      }
    }
  `;
  document.head.appendChild(style);
}

function renderRectangle(element: HTMLElement, props: Props): void {
  element.style.width = '100%';
  element.style.height = '100%';
  element.style.boxSizing = 'border-box';
  element.style.backgroundColor = props.fill;
  element.style.setProperty('--thingsvis-rectangle-fill', props.fill);
  element.style.setProperty('--thingsvis-rectangle-alt-fill', props.blinkAlternateFill || props.fill);
  element.style.setProperty('--thingsvis-rectangle-opacity', String(props.opacity));
  element.style.setProperty('--thingsvis-rectangle-blink-min-opacity', String(props.blinkMinOpacity));

  if (props.blinkEnabled) {
    ensureBlinkStyle();
    element.style.opacity = '';
    element.style.animation = `thingsvis-basic-rectangle-blink ${props.blinkDurationMs}ms ease-in-out infinite`;
  } else {
    element.style.animation = 'none';
    element.style.opacity = String(props.opacity);
  }
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
    renderRectangle(element, props);

    return {
      update: (nextProps: Props) => {
        renderRectangle(element, nextProps);
      },
      destroy: () => {
        element.removeAttribute('style');
      },
    };
  },
});

export default Main;
