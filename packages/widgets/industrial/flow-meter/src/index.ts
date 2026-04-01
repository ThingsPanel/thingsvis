import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import { defineWidget } from '@thingsvis/widget-sdk';
import zh from './locales/zh.json';
import en from './locales/en.json';

function renderFlowMeter(element: HTMLElement, props: Props): void {
  element.style.width = '100%';
  element.style.height = '100%';

  const range = props.max - props.min;
  const percentage = range === 0
    ? 0
    : Math.min(100, Math.max(0, ((props.value - props.min) / range) * 100));
  const baseColor = props.hasError ? '#ff4d4f' : (props.baseColor || '#334155');
  const liquidColor = props.hasError ? '#ff7875' : (props.liquidColor || '#0ea5e9');
  const animationDuration = props.flowSpeed > 0 ? `${(1 / props.flowSpeed).toFixed(2)}s` : '0s';

  element.innerHTML = `
<svg width="100%" height="100%" viewBox="0 0 120 60" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @keyframes flow {
        0% { stroke-dashoffset: 20; }
        100% { stroke-dashoffset: 0; }
      }
      .flow-anim {
        animation: flow ${animationDuration} linear infinite;
      }
    </style>
    <linearGradient id="caseGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${lightenColor(baseColor, 10)};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${baseColor};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="liquidGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${liquidColor};stop-opacity:0.8" />
      <stop offset="50%" style="stop-color:${lightenColor(liquidColor, 30)};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${liquidColor};stop-opacity:0.8" />
    </linearGradient>
  </defs>

  <!-- 左右短管 -->
  <rect x="0" y="24" width="10" height="12" fill="#475569"/>
  <rect x="110" y="24" width="10" height="12" fill="#475569"/>

  <!-- 流量计主体 - 撑满 -->
  <rect x="10" y="10" width="100" height="40" rx="5" fill="url(#caseGradient)" stroke="#1e293b" stroke-width="2"/>

  <!-- 观察窗背景 -->
  <rect x="16" y="16" width="88" height="16" rx="3" fill="#0f172a" stroke="#475569" stroke-width="1"/>

  <!-- 液体填充 -->
  <rect x="18" y="18" width="${percentage * 0.8}" height="12" rx="2" fill="url(#liquidGradient)"/>

  <!-- 流动效果线 -->
  ${props.flowSpeed > 0 ? `
  <line x1="20" y1="24" x2="100" y2="24" stroke="${lightenColor(liquidColor, 40)}" stroke-width="2"
    stroke-dasharray="5,5" class="flow-anim" opacity="0.8"/>
  ` : ''}

  <!-- 刻度线 -->
  <line x1="24" y1="20" x2="24" y2="28" stroke="#475569" stroke-width="1"/>
  <line x1="60" y1="20" x2="60" y2="28" stroke="#475569" stroke-width="1"/>
  <line x1="96" y1="20" x2="96" y2="28" stroke="#475569" stroke-width="1"/>

  <!-- 数值显示 -->
  ${props.showValue ? `
  <text x="60" y="42" text-anchor="middle" fill="#e2e8f0" font-size="12" font-family="sans-serif" font-weight="bold">
    ${Math.round(props.value)}
  </text>
  ` : ''}

  <!-- 故障闪烁 -->
  ${props.hasError ? `
  <rect x="10" y="10" width="100" height="40" rx="5" fill="none" stroke="#ff4d4f" stroke-width="2.5" opacity="0.6">
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
    renderFlowMeter(element, props);
    return {
      update: (nextProps: Props) => renderFlowMeter(element, nextProps),
      destroy: () => { element.innerHTML = ''; },
    };
  },
});

export default Main;
