import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import { defineWidget } from '@thingsvis/widget-sdk';
import zh from './locales/zh.json';
import en from './locales/en.json';

function renderMotor(element: HTMLElement, props: Props): void {
  element.style.width = '100%';
  element.style.height = '100%';

  const baseColor = props.hasError ? '#ff4d4f' : (props.baseColor || '#334155');
  const runColor = props.hasError ? '#ff7875' : '#0ea5e9';
  const fanDuration = props.rpm > 0 ? `${Math.max(1 / props.rpm, 0.2).toFixed(2)}s` : '0s';

  element.innerHTML = `
<svg width="100%" height="100%" viewBox="0 0 120 60" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="motorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${lightenColor(baseColor, 10)};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${baseColor};stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- 左短管接口 -->
  <rect x="0" y="24" width="8" height="12" fill="#475569"/>

  <!-- 电机主体 - 撑满 -->
  <rect x="8" y="12" width="96" height="36" rx="3" fill="url(#motorGrad)" stroke="#1e293b" stroke-width="2"/>
  
  <!-- 前端盖 -->
  <rect x="6" y="14" width="4" height="32" rx="1" fill="${darkenColor(baseColor, 10)}" stroke="#1e293b" stroke-width="1.5"/>

  <!-- 接线盒 -->
  <rect x="20" y="14" width="18" height="10" rx="1" fill="${darkenColor(baseColor, 10)}" stroke="#1e293b" stroke-width="1.5"/>

  <!-- 后端风扇罩 -->
  <path d="M 104 14 Q 116 30 104 46" fill="none" stroke="#475569" stroke-width="2"/>
  <g transform="translate(84 30)">
    <circle cx="0" cy="0" r="7" fill="#0f172a" stroke="#475569" stroke-width="1.5"/>
    <path d="M 0 -6 C 4 -6 6 -2 2 0 C 0 -1 -1 -3 0 -6" fill="${props.isRunning ? runColor : '#64748b'}" opacity="0.9"/>
    <path d="M 6 0 C 6 4 2 6 0 2 C 1 0 3 -1 6 0" fill="${props.isRunning ? runColor : '#64748b'}" opacity="0.8"/>
    <path d="M 0 6 C -4 6 -6 2 -2 0 C 0 1 1 3 0 6" fill="${props.isRunning ? runColor : '#64748b'}" opacity="0.9"/>
    <path d="M -6 0 C -6 -4 -2 -6 0 -2 C -1 0 -3 1 -6 0" fill="${props.isRunning ? runColor : '#64748b'}" opacity="0.8"/>
    <circle cx="0" cy="0" r="1.5" fill="#94a3b8"/>
    ${props.isRunning && props.rpm > 0 ? `
    <animateTransform
      attributeName="transform"
      type="rotate"
      from="0 0 0"
      to="360 0 0"
      dur="${fanDuration}"
      repeatCount="indefinite"
    />
    ` : ''}
  </g>

  <!-- 运行指示灯 -->
  <circle cx="94" cy="22" r="3" fill="${props.isRunning ? runColor : '#475569'}" stroke="#1e293b" stroke-width="1"/>

  <!-- 底座 -->
  <rect x="16" y="50" width="80" height="6" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1.5"/>

  <!-- 故障闪烁 -->
  ${props.hasError ? `
  <rect x="8" y="12" width="96" height="36" rx="3" fill="none" stroke="#ff4d4f" stroke-width="2.5" opacity="0.6">
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
  ...metadata,
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
