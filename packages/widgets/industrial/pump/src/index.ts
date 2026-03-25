import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import { defineWidget } from '@thingsvis/widget-sdk';
import zh from './locales/zh.json';
import en from './locales/en.json';

function renderPump(element: HTMLElement, props: Props): void {
  element.style.width = '100%';
  element.style.height = '100%';

  const shellColor = props.hasError ? '#ff4d4f' : props.baseColor;
  const animationDuration =
    props.isRunning && props.rpm > 0 ? `${(2 / props.rpm).toFixed(2)}s` : '0s';

  element.innerHTML = `
<svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @keyframes spin { 100% { transform: rotate(360deg); } }
      .impeller {
        transform-origin: 40px 50px;
        animation: spin ${animationDuration} linear infinite;
      }
    </style>
  </defs>
  <rect x="20" y="70" width="60" height="10" fill="#777" />
  <rect x="55" y="30" width="30" height="40" fill="#555" rx="5" />
  <circle cx="40" cy="50" r="25" fill="${shellColor}" />
  <g class="${props.isRunning ? 'impeller' : ''}" transform="translate(40,50)">
    <circle cx="0" cy="0" r="15" fill="#222" />
    <path d="M 0 -15 A 15 15 0 0 0 15 0 L 0 0 Z" fill="#eee" />
    <path d="M 0 15 A 15 15 0 0 0 -15 0 L 0 0 Z" fill="#eee" />
    <path d="M -15 0 A 15 15 0 0 0 0 15 L 0 0 Z" fill="#ccc" />
    <path d="M 15 0 A 15 15 0 0 0 0 -15 L 0 0 Z" fill="#ccc" />
  </g>
</svg>
`;
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
    renderPump(element, props);

    return {
      update: (nextProps: Props) => {
        renderPump(element, nextProps);
      },
      destroy: () => {
        element.innerHTML = '';
      },
    };
  },
});

export default Main;
