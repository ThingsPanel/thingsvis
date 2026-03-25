import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import { defineWidget } from '@thingsvis/widget-sdk';
import zh from './locales/zh.json';
import en from './locales/en.json';

function renderTank(element: HTMLElement, props: Props): void {
  element.style.width = '100%';
  element.style.height = '100%';

  let liquidColor = props.liquidColor;
  if (props.hasError) {
    liquidColor = '#ff4d4f';
  } else if (props.level <= props.lowThreshold) {
    liquidColor = props.lowColor;
  } else if (props.level >= props.highThreshold) {
    liquidColor = props.highColor;
  }

  const tankColor = props.hasError ? '#ff4d4f' : props.tankColor;
  const liquidHeight = (props.level / 100) * 80;
  const liquidY = 90 - liquidHeight;

  element.innerHTML = `
<svg width="100%" height="100%" viewBox="0 0 100 120" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="tankGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${tankColor};stop-opacity:1" />
      <stop offset="50%" style="stop-color:${lightenColor(tankColor, 20)};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${tankColor};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="liquidGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${lightenColor(liquidColor, 20)};stop-opacity:0.9" />
      <stop offset="100%" style="stop-color:${liquidColor};stop-opacity:0.95" />
    </linearGradient>
    <clipPath id="tankClip">
      <rect x="15" y="10" width="70" height="90" rx="8" ry="8"/>
    </clipPath>
  </defs>
  
  <!-- 罐体背景 -->
  <rect x="15" y="10" width="70" height="90" rx="8" ry="8" fill="url(#tankGradient)" stroke="#1e293b" stroke-width="2"/>
  
  <!-- 液体 -->
  <g clip-path="url(#tankClip)">
    <rect x="15" y="${liquidY}" width="70" height="${liquidHeight}" fill="url(#liquidGradient)"/>
  </g>
  
  <!-- 刻度线 -->
  <line x1="85" y1="90" x2="90" y2="90" stroke="#94a3b8" stroke-width="1"/>
  <line x1="85" y1="50" x2="90" y2="50" stroke="#94a3b8" stroke-width="1"/>
  <line x1="85" y1="10" x2="90" y2="10" stroke="#94a3b8" stroke-width="1"/>
  
  <!-- 顶部入口 -->
  <rect x="42" y="5" width="16" height="8" fill="#64748b" stroke="#1e293b" stroke-width="1" rx="2"/>
  
  <!-- 底部出口 -->
  <rect x="42" y="105" width="16" height="8" fill="#64748b" stroke="#1e293b" stroke-width="1" rx="2"/>
  
  <!-- 故障闪烁 -->
  ${props.hasError ? `
  <rect x="15" y="10" width="70" height="90" rx="8" ry="8" fill="none" stroke="#ff4d4f" stroke-width="3" opacity="0.6">
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
    renderTank(element, props);
    return {
      update: (nextProps: Props) => renderTank(element, nextProps),
      destroy: () => { element.innerHTML = ''; },
    };
  },
});

export default Main;
