import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import { defineWidget } from '@thingsvis/widget-sdk';
import zh from './locales/zh.json';
import en from './locales/en.json';

function renderFlowMeter(element: HTMLElement, props: Props): void {
  element.style.width = '100%';
  element.style.height = '100%';
  element.style.display = 'block';
  element.style.lineHeight = '0';

  const range = props.max - props.min;
  const percentage = range === 0
    ? 0
    : Math.min(100, Math.max(0, ((props.value - props.min) / range) * 100));
  const baseColor = props.hasError ? '#ff4d4f' : (props.baseColor || '#334155');
  const liquidColor = props.hasError ? '#ff7875' : (props.liquidColor || '#0ea5e9');
  const animationDuration = props.flowSpeed > 0 ? `${(1 / props.flowSpeed).toFixed(2)}s` : '0s';

  element.innerHTML = `
<svg width="100%" height="100%" viewBox="0 0 120 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style="display:block">
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
    <linearGradient id="fmCaseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${lightenColor(baseColor, 28)};stop-opacity:1" />
      <stop offset="38%" style="stop-color:${lightenColor(baseColor, 10)};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${darkenColor(baseColor, 18)};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="fmPipeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${lightenColor(baseColor, 18)};stop-opacity:1" />
      <stop offset="42%" style="stop-color:${lightenColor(baseColor, 28)};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${darkenColor(baseColor, 8)};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="fmFlangeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${lightenColor(baseColor, 18)};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${darkenColor(baseColor, 12)};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="liquidGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${liquidColor};stop-opacity:0.8" />
      <stop offset="50%" style="stop-color:${lightenColor(liquidColor, 30)};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${liquidColor};stop-opacity:0.8" />
    </linearGradient>
  </defs>

  <!-- 左管道 -->
  <rect x="0" y="24" width="10" height="12" fill="url(#fmPipeGrad)"/>
  <line x1="0" y1="24" x2="10" y2="24" stroke="${lightenColor(baseColor, 32)}" stroke-width="1"/>
  <line x1="0" y1="36" x2="10" y2="36" stroke="${darkenColor(baseColor, 22)}" stroke-width="1"/>
  <!-- 左法兰 -->
  <rect x="9" y="19" width="6" height="22" rx="1" fill="url(#fmFlangeGrad)" stroke="#1e293b" stroke-width="1"/>
  <line x1="10.5" y1="22" x2="10.5" y2="38" stroke="${lightenColor(baseColor, 28)}" stroke-width="0.8" opacity="0.55"/>

  <!-- 右管道 -->
  <rect x="110" y="24" width="10" height="12" fill="url(#fmPipeGrad)"/>
  <line x1="110" y1="24" x2="120" y2="24" stroke="${lightenColor(baseColor, 32)}" stroke-width="1"/>
  <line x1="110" y1="36" x2="120" y2="36" stroke="${darkenColor(baseColor, 22)}" stroke-width="1"/>
  <!-- 右法兰 -->
  <rect x="105" y="19" width="6" height="22" rx="1" fill="url(#fmFlangeGrad)" stroke="#1e293b" stroke-width="1"/>
  <line x1="109.5" y1="22" x2="109.5" y2="38" stroke="${lightenColor(baseColor, 28)}" stroke-width="0.8" opacity="0.55"/>

  <!-- 表壳阴影 -->
  <rect x="15" y="8.5" width="90" height="46" rx="5" fill="${darkenColor(baseColor, 30)}" opacity="0.25"/>
  <!-- 流量计主体 -->
  <rect x="15" y="7" width="90" height="46" rx="5" fill="url(#fmCaseGrad)" stroke="#1e293b" stroke-width="1.5"/>
  <!-- 表壳高光弧 -->
  <path d="M 17 9 L 80 9" fill="none" stroke="${lightenColor(baseColor, 38)}" stroke-width="1" stroke-linecap="round" opacity="0.5"/>

  <!-- 观察窗背景 -->
  <rect x="22" y="15" width="76" height="18" rx="3" fill="#0f172a" stroke="#475569" stroke-width="1"/>
  <line x1="23" y1="16" x2="96" y2="16" stroke="#475569" stroke-width="0.8" opacity="0.4"/>

  <!-- 液体填充 -->
  <rect x="24" y="17" width="${percentage * 0.72}" height="14" rx="2" fill="url(#liquidGradient)"/>

  <!-- 流动效果线 -->
  ${props.flowSpeed > 0 ? `
  <line x1="26" y1="24" x2="96" y2="24" stroke="${lightenColor(liquidColor, 40)}" stroke-width="2"
    stroke-dasharray="5,5" class="flow-anim" opacity="0.8"/>
  ` : ''}

  <!-- 刻度线 -->
  <line x1="30" y1="17" x2="30" y2="27" stroke="#475569" stroke-width="1"/>
  <line x1="60" y1="17" x2="60" y2="27" stroke="#475569" stroke-width="1"/>
  <line x1="90" y1="17" x2="90" y2="27" stroke="#475569" stroke-width="1"/>

  <!-- 数值显示 -->
  ${props.showValue ? `
  <text x="60" y="46" text-anchor="middle" fill="#e2e8f0" font-size="12" font-family="sans-serif" font-weight="bold">
    ${Math.round(props.value)}
  </text>
  ` : ''}

  <!-- 故障闪烁 -->
  ${props.hasError ? `
  <rect x="15" y="7" width="90" height="46" rx="5" fill="none" stroke="#ff4d4f" stroke-width="2.5" opacity="0.6">
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
