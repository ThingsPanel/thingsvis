import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import { defineWidget } from '@thingsvis/widget-sdk';
import zh from './locales/zh.json';
import en from './locales/en.json';

function renderPump(element: HTMLElement, props: Props): void {
  element.style.width = '100%';
  element.style.height = '100%';

  // 与其他工业组件统一的配色
  const baseColor = props.hasError ? '#ff4d4f' : '#334155';  // slate-700, 同tank
  const borderColor = props.hasError ? '#ff7875' : '#0ea5e9'; // sky-500
  const pipeColor = '#64748b'; // slate-500
  const fanColor = props.hasError ? '#ff7875' : '#0ea5e9';
  const animationDuration = props.isRunning && props.rpm > 0 ? `${(1 / props.rpm).toFixed(2)}s` : '0s';

  element.innerHTML = `
<svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @keyframes spin { 
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); } 
      }
      .fan-spin {
        transform-origin: 50px 50px;
        animation: spin ${animationDuration} linear infinite;
      }
    </style>
    <linearGradient id="pipeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${lightenColor(pipeColor, 15)}" />
      <stop offset="50%" style="stop-color:${pipeColor}" />
      <stop offset="100%" style="stop-color:${darkenColor(pipeColor, 15)}" />
    </linearGradient>
    <linearGradient id="shellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${lightenColor(baseColor, 10)}" />
      <stop offset="100%" style="stop-color:${baseColor}" />
    </linearGradient>
  </defs>
  
  <!-- 左下管道（入口） -->
  <rect x="10" y="55" width="30" height="16" fill="url(#pipeGrad)" stroke="#475569" stroke-width="1"/>
  
  <!-- 右上管道（出口） -->
  <rect x="60" y="28" width="30" height="16" fill="url(#pipeGrad)" stroke="#475569" stroke-width="1"/>
  
  <!-- 泵体外壳 -->
  <circle cx="50" cy="50" r="28" fill="url(#shellGrad)" stroke="${borderColor}" stroke-width="2"/>
  
  <!-- 内部圆 -->
  <circle cx="50" cy="50" r="22" fill="#1e293b" stroke="${borderColor}" stroke-width="1" opacity="0.5"/>
  
  <!-- 风扇叶轮 -->
  <g class="${props.isRunning ? 'fan-spin' : ''}">
    <!-- 4个弯曲叶片 -->
    <path d="M 50 50 L 50 28 Q 65 35 50 50" fill="${fanColor}" opacity="0.9"/>
    <path d="M 50 50 L 72 50 Q 65 65 50 50" fill="${fanColor}" opacity="0.8"/>
    <path d="M 50 50 L 50 72 Q 35 65 50 50" fill="${fanColor}" opacity="0.9"/>
    <path d="M 50 50 L 28 50 Q 35 35 50 50" fill="${fanColor}" opacity="0.8"/>
    <!-- 中心圆 -->
    <circle cx="50" cy="50" r="5" fill="#1e293b" stroke="${borderColor}" stroke-width="1"/>
  </g>
  
  <!-- 故障闪烁 -->
  ${props.hasError ? `
  <circle cx="50" cy="50" r="28" fill="none" stroke="#ff4d4f" stroke-width="3" opacity="0.6">
    <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1s" repeatCount="indefinite"/>
  </circle>
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
  defaultSize: { width: 100, height: 100 },
  constraints: { minWidth: 50, minHeight: 50 },
  resizable: true,
  locales: { zh, en },
  schema: PropsSchema,
  controls,
  render: (element: HTMLElement, props: Props) => {
    renderPump(element, props);
    return {
      update: (nextProps: Props) => renderPump(element, nextProps),
      destroy: () => { element.innerHTML = ''; },
    };
  },
});

export default Main;
