import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import { defineWidget } from '@thingsvis/widget-sdk';
import zh from './locales/zh.json';
import en from './locales/en.json';

function renderFlowMeter(element: HTMLElement, props: Props): void {
  element.style.width = '100%';
  element.style.height = '100%';

  const percentage = Math.min(100, Math.max(0, ((props.value - props.min) / (props.max - props.min)) * 100));
  const baseColor = props.hasError ? '#ff4d4f' : props.baseColor;
  const liquidColor = props.hasError ? '#ff7875' : props.liquidColor;
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
      <stop offset="0%" style="stop-color:${lightenColor(baseColor, 20)};stop-opacity:1" />
      <stop offset="50%" style="stop-color:${baseColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${darkenColor(baseColor, 20)};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="liquidGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${liquidColor};stop-opacity:0.8" />
      <stop offset="50%" style="stop-color:${lightenColor(liquidColor, 30)};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${liquidColor};stop-opacity:0.8" />
    </linearGradient>
  </defs>
  
  <!-- 左管道 -->
  <rect x="0" y="22" width="25" height="16" fill="#64748b" stroke="#1e293b" stroke-width="1"/>
  
  <!-- 流量计主体 -->
  <rect x="25" y="12" width="70" height="36" rx="6" fill="url(#caseGradient)" stroke="#1e293b" stroke-width="1"/>
  
  <!-- 观察窗背景 -->
  <rect x="30" y="17" width="60" height="18" rx="3" fill="#0f172a" stroke="#334155" stroke-width="1"/>
  
  <!-- 液体填充 -->
  <rect x="32" y="19" width="${percentage * 0.56}" height="14" rx="2" fill="url(#liquidGradient)"/>
  
  <!-- 流动效果线 -->
  ${props.flowSpeed > 0 ? `
  <line x1="35" y1="26" x2="85" y2="26" stroke="${lightenColor(liquidColor, 40)}" stroke-width="2" 
    stroke-dasharray="5,5" class="flow-anim" opacity="0.8"/>
  ` : ''}
  
  <!-- 刻度线 -->
  <line x1="35" y1="22" x2="35" y2="30" stroke="#475569" stroke-width="1"/>
  <line x1="60" y1="22" x2="60" y2="30" stroke="#475569" stroke-width="1"/>
  <line x1="85" y1="22" x2="85" y2="30" stroke="#475569" stroke-width="1"/>
  
  <!-- 右管道 -->
  <rect x="95" y="22" width="25" height="16" fill="#64748b" stroke="#1e293b" stroke-width="1"/>
  
  <!-- 法兰盘 -->
  <rect x="22" y="18" width="6" height="24" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1"/>
  <rect x="92" y="18" width="6" height="24" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1"/>
  
  <!-- 数值显示 -->
  ${props.showValue ? `
  <text x="60" y="42" text-anchor="middle" fill="#e2e8f0" font-size="8" font-family="sans-serif" font-weight="bold">
    ${Math.round(props.value)}
  </text>
  ` : ''}
  
  <!-- 故障闪烁 -->
  ${props.hasError ? `
  <rect x="25" y="12" width="70" height="36" rx="6" fill="none" stroke="#ff4d4f" stroke-width="2" opacity="0.6">
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
    renderFlowMeter(element, props);
    return {
      update: (nextProps: Props) => renderFlowMeter(element, nextProps),
      destroy: () => { element.innerHTML = ''; },
    };
  },
});

export default Main;
