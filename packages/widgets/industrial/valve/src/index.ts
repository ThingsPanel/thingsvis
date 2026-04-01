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
<svg width="100%" height="100%" viewBox="0 0 120 60" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .handle {
        transform-origin: 60px 18px;
        transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      .open-handle { transform: rotate(0deg); }
      .closed-handle { transform: rotate(90deg); }
      .valve-body {
        transition: fill 0.3s ease;
      }
    </style>
  </defs>

  <!-- 左管道 -->
  <rect x="0" y="22" width="34" height="16" fill="#64748b" stroke="#1e293b" stroke-width="1"/>
  <!-- 左法兰 -->
  <rect x="32" y="18" width="6" height="24" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1"/>
  <circle cx="35" cy="21" r="1" fill="#94a3b8"/>
  <circle cx="35" cy="39" r="1" fill="#94a3b8"/>

  <!-- 阀体 -->
  <path class="valve-body" d="M 38 18 L 38 42 L 82 18 L 82 42 Z" fill="${valveColor}" stroke="#1e293b" stroke-width="2" stroke-linejoin="round"/>
  <rect x="58" y="22" width="4" height="16" fill="#475569" />
  <circle cx="60" cy="30" r="8" fill="#334155" stroke="#1e293b" stroke-width="1"/>

  <!-- 右法兰 -->
  <rect x="82" y="18" width="6" height="24" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1"/>
  <circle cx="85" cy="21" r="1" fill="#94a3b8"/>
  <circle cx="85" cy="39" r="1" fill="#94a3b8"/>
  <!-- 右管道 -->
  <rect x="86" y="22" width="34" height="16" fill="#64748b" stroke="#1e293b" stroke-width="1"/>

  <!-- 手柄 -->
  <rect class="handle ${handleCssClass}" x="45" y="14" width="30" height="6" fill="${props.hasError ? '#a8071a' : '#444'}" rx="2" stroke="#111" stroke-width="1"/>

  <!-- 故障闪烁 -->
  ${props.hasError ? `
  <path d="M 38 18 L 38 42 L 82 18 L 82 42 Z" fill="none" stroke="#ff4d4f" stroke-width="2" opacity="0.6">
    <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1s" repeatCount="indefinite"/>
  </path>
  ` : ''}
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
