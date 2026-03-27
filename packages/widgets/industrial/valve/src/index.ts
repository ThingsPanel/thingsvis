import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import { defineWidget } from '@thingsvis/widget-sdk';
import zh from './locales/zh.json';
import en from './locales/en.json';

function renderValve(element: HTMLElement, props: Props): void {
  element.style.width = '100%';
  element.style.height = '100%';

  let valveColor = props.isOpen ? props.openColor : props.closedColor;
  if (props.hasError) {
    valveColor = '#ff4d4f';
  }

  const handleCssClass = props.isOpen ? 'open-handle' : 'closed-handle';

  element.innerHTML = `
<svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .handle {
        transform-origin: 50px 30px;
        transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      .open-handle { transform: rotate(0deg); }
      .closed-handle { transform: rotate(90deg); }
      .valve-body {
        transition: fill 0.3s ease;
      }
    </style>
  </defs>
  <path class="valve-body" d="M 15 25 L 15 75 L 85 25 L 85 75 Z" fill="${valveColor}" stroke="#222" stroke-width="2" stroke-linejoin="round"/>
  <rect x="46" y="30" width="8" height="20" fill="#666" />
  <circle cx="50" cy="50" r="12" fill="#333" />
  <rect class="handle ${handleCssClass}" x="25" y="25" width="50" height="10" fill="${props.hasError ? '#a8071a' : '#444'}" rx="4" stroke="#111" stroke-width="1"/>
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
    renderValve(element, props);

    return {
      update: (nextProps: Props) => {
        renderValve(element, nextProps);
      },
      destroy: () => {
        element.innerHTML = '';
      },
    };
  },
});

export default Main;
