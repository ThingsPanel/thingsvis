import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import { defineWidget } from '@thingsvis/widget-sdk';
import zh from './locales/zh.json';
import en from './locales/en.json';

function renderMotor(element: HTMLElement, props: Props): void {
  element.style.width = '100%';
  element.style.height = '100%';

  const baseColor = props.hasError ? '#ff4d4f' : props.baseColor;
  const animationDuration = props.isRunning && props.rpm > 0 ? `${(0.5 / props.rpm).toFixed(2)}s` : '0s';

  element.innerHTML = `
<svg width="100%" height="100%" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @keyframes spin {
        100% { transform: rotate(360deg); }
      }
      .fan-blade {
        transform-origin: 0 0;
        animation: spin ${animationDuration} linear infinite;
      }
    </style>
    <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${lightenColor(baseColor, 20)};stop-opacity:1" />
      <stop offset="50%" style="stop-color:${baseColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${darkenColor(baseColor, 20)};stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- 左管道 -->
  <rect x="0" y="22" width="18" height="16" fill="#64748b" stroke="#1e293b" stroke-width="1"/>
  <!-- 左法兰 -->
  <rect x="16" y="18" width="6" height="24" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1"/>
  <circle cx="19" cy="21" r="1" fill="#94a3b8"/>
  <circle cx="19" cy="39" r="1" fill="#94a3b8"/>

  <!-- 电机主体 - 卧式圆柱 -->
  <rect x="22" y="14" width="44" height="32" rx="4" fill="url(#bodyGradient)" stroke="#1e293b" stroke-width="1"/>
  <ellipse cx="22" cy="30" rx="4" ry="16" fill="${lightenColor(baseColor, 10)}" stroke="#1e293b" stroke-width="1"/>
  <ellipse cx="66" cy="30" rx="4" ry="16" fill="${darkenColor(baseColor, 10)}" stroke="#1e293b" stroke-width="1"/>

  <!-- 电机接线盒 -->
  <rect x="30" y="16" width="14" height="8" rx="1" fill="${darkenColor(baseColor, 10)}" stroke="#1e293b" stroke-width="1"/>

  <!-- 后端风扇罩 -->
  <path d="M 66 18 L 74 14 L 74 46 L 66 42 Z" fill="#64748b" stroke="#1e293b" stroke-width="1"/>

  <!-- 风扇叶片 -->
  <g transform="translate(82, 30)" class="${props.isRunning ? 'fan-blade' : ''}">
    <ellipse cx="0" cy="0" rx="1.5" ry="10" fill="#94a3b8" opacity="0.8"/>
    <ellipse cx="0" cy="0" rx="10" ry="1.5" fill="#94a3b8" opacity="0.8"/>
  </g>

  <!-- 风扇罩网格 -->
  <circle cx="82" cy="30" r="12" fill="none" stroke="#64748b" stroke-width="1.5"/>
  <line x1="82" y1="18" x2="82" y2="42" stroke="#64748b" stroke-width="1"/>
  <line x1="70" y1="30" x2="94" y2="30" stroke="#64748b" stroke-width="1"/>

  <!-- 底座 -->
  <rect x="28" y="48" width="32" height="4" fill="#64748b" stroke="#1e293b" stroke-width="1"/>
  <rect x="24" y="52" width="40" height="3" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1"/>

  <!-- 故障闪烁 -->
  ${props.hasError ? `
  <rect x="22" y="14" width="44" height="32" rx="4" fill="none" stroke="#ff4d4f" stroke-width="2" opacity="0.6">
    <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1s" repeatCount="indefinite"/>
  </rect>
  ` : ''}
</svg>
`;
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
    renderMotor(element, props);
    return {
      update: (nextProps: Props) => renderMotor(element, nextProps),
      destroy: () => { element.innerHTML = ''; },
    };
  },
});

export default Main;
