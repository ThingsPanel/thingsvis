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
<svg width="100%" height="100%" viewBox="0 0 80 100" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
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
    <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${baseColor};stop-opacity:1" />
      <stop offset="50%" style="stop-color:${lightenColor(baseColor, 20)};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${baseColor};stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- 电机主体 - 圆柱形 -->
  <ellipse cx="35" cy="20" rx="25" ry="6" fill="${lightenColor(baseColor, 30)}" stroke="#1e293b" stroke-width="1"/>
  <rect x="10" y="20" width="50" height="40" fill="url(#bodyGradient)" stroke="#1e293b" stroke-width="1"/>
  <ellipse cx="35" cy="60" rx="25" ry="6" fill="${darkenColor(baseColor, 10)}" stroke="#1e293b" stroke-width="1"/>
  
  <!-- 电机接线盒 -->
  <rect x="15" y="25" width="15" height="12" rx="2" fill="${darkenColor(baseColor, 10)}" stroke="#1e293b" stroke-width="1"/>
  
  <!-- 后端风扇罩 -->
  <path d="M 10 25 L 5 20 L 5 60 L 10 55 Z" fill="#64748b" stroke="#1e293b" stroke-width="1"/>
  
  <!-- 风扇叶片 - 使用 transform 移动坐标系 -->
  <g transform="translate(55, 40)" class="${props.isRunning ? 'fan-blade' : ''}">
    <ellipse cx="0" cy="0" rx="2" ry="12" fill="#94a3b8" opacity="0.8"/>
    <ellipse cx="0" cy="0" rx="12" ry="2" fill="#94a3b8" opacity="0.8"/>
  </g>
  
  <!-- 风扇罩网格 -->
  <circle cx="55" cy="40" r="16" fill="none" stroke="#64748b" stroke-width="1.5"/>
  <line x1="55" y1="24" x2="55" y2="56" stroke="#64748b" stroke-width="1"/>
  <line x1="39" y1="40" x2="71" y2="40" stroke="#64748b" stroke-width="1"/>
  
  <!-- 底座 -->
  <rect x="20" y="65" width="30" height="6" fill="#64748b" stroke="#1e293b" stroke-width="1"/>
  <rect x="15" y="71" width="40" height="4" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1"/>
  
  <!-- 轴端 -->
  <rect x="58" y="36" width="6" height="8" fill="#94a3b8" stroke="#1e293b" stroke-width="1"/>
  
  <!-- 故障闪烁 -->
  ${props.hasError ? `
  <rect x="10" y="20" width="50" height="40" fill="none" stroke="#ff4d4f" stroke-width="2" opacity="0.6">
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
