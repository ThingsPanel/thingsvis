import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import { defineWidget } from '@thingsvis/widget-sdk';
import zh from './locales/zh.json';
import en from './locales/en.json';

function renderGauge(element: HTMLElement, props: Props): void {
  element.style.width = '100%';
  element.style.height = '100%';

  const percentage = Math.min(100, Math.max(0, ((props.value - props.min) / (props.max - props.min)) * 100));
  const angle = -135 + (percentage / 100) * 270;
  
  const dialColor = props.hasError ? '#7f1d1d' : props.dialColor;
  const pointerColor = props.hasError ? '#ff4d4f' : props.pointerColor;
  const scaleColor = props.hasError ? '#fca5a5' : '#94a3b8';

  element.innerHTML = `
<svg width="100%" height="100%" viewBox="0 0 80 80" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="dialGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${lightenColor(dialColor, 10)};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${dialColor};stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- 表盘外圈 -->
  <circle cx="40" cy="40" r="36" fill="url(#dialGradient)" stroke="${scaleColor}" stroke-width="2"/>
  
  <!-- 刻度圈 -->
  <circle cx="40" cy="40" r="30" fill="none" stroke="${scaleColor}" stroke-width="1" opacity="0.5"/>
  
  <!-- 刻度线 - 0, 50, 100 -->
  ${generateScaleTicks(scaleColor)}
  
  <!-- 指针旋转组 -->
  <g transform="rotate(${angle}, 40, 40)">
    <!-- 指针 -->
    <path d="M 40 40 L 40 12 L 43 20 L 40 40 Z" fill="${pointerColor}" />
    <path d="M 40 40 L 40 12 L 37 20 L 40 40 Z" fill="${darkenColor(pointerColor, 20)}" />
  </g>
  
  <!-- 中心圆点 -->
  <circle cx="40" cy="40" r="5" fill="#475569" stroke="${scaleColor}" stroke-width="1"/>
  <circle cx="40" cy="40" r="3" fill="${pointerColor}"/>
  
  <!-- 底部连接管 -->
  <rect x="35" y="74" width="10" height="6" fill="#64748b" stroke="#1e293b" stroke-width="1"/>
  
  <!-- 故障闪烁 -->
  ${props.hasError ? `
  <circle cx="40" cy="40" r="36" fill="none" stroke="#ff4d4f" stroke-width="3" opacity="0.6">
    <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1s" repeatCount="indefinite"/>
  </circle>
  ` : ''}
</svg>
`;
}

function generateScaleTicks(color: string): string {
  const ticks: string[] = [];
  const positions = [0, 50, 100];
  
  for (const pos of positions) {
    const angle = -135 + (pos / 100) * 270;
    const rad = (angle * Math.PI) / 180;
    
    const x1 = 40 + 26 * Math.cos(rad);
    const y1 = 40 + 26 * Math.sin(rad);
    const x2 = 40 + 30 * Math.cos(rad);
    const y2 = 40 + 30 * Math.sin(rad);
    
    ticks.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`);
  }
  
  return ticks.join('\n');
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
    renderGauge(element, props);
    return {
      update: (nextProps: Props) => renderGauge(element, nextProps),
      destroy: () => { element.innerHTML = ''; },
    };
  },
});

export default Main;
