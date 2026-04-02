import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import { defineWidget } from '@thingsvis/widget-sdk';
import zh from './locales/zh.json';
import en from './locales/en.json';

function renderGauge(element: HTMLElement, props: Props): void {
  element.style.width = '100%';
  element.style.height = '100%';
  element.style.display = 'block';
  element.style.lineHeight = '0';

  const range = props.max - props.min;
  const percentage = range === 0
    ? 0
    : Math.min(100, Math.max(0, ((props.value - props.min) / range) * 100));
  const angle = -135 + (percentage / 100) * 270;

  const dialColor = props.hasError ? '#7f1d1d' : (props.dialColor || '#334155');
  const pointerColor = props.hasError ? '#ff4d4f' : (props.pointerColor || '#0ea5e9');
  const scaleColor = props.hasError ? '#fca5a5' : '#94a3b8';
  const connectorWidth = 15;
  const connectorHeight = 9;
  const connectorX = (80 - connectorWidth) / 2;
  const connectorY = 70;

  element.innerHTML = `
<svg width="100%" height="100%" viewBox="0 0 80 80" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" style="display:block">
  <defs>
    <radialGradient id="gaugeRimGrad" cx="36%" cy="32%" r="64%">
      <stop offset="0%" style="stop-color:${lightenColor(dialColor, 28)};stop-opacity:1" />
      <stop offset="55%" style="stop-color:${lightenColor(dialColor, 6)};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${darkenColor(dialColor, 22)};stop-opacity:1" />
    </radialGradient>
    <radialGradient id="gaugeDialGrad" cx="38%" cy="34%" r="62%">
      <stop offset="0%" style="stop-color:${lightenColor(dialColor, 18)};stop-opacity:1" />
      <stop offset="60%" style="stop-color:${dialColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${darkenColor(dialColor, 18)};stop-opacity:1" />
    </radialGradient>
    <linearGradient id="gaugeConnGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${darkenColor(dialColor, 8)};stop-opacity:1" />
      <stop offset="40%" style="stop-color:${lightenColor(dialColor, 18)};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${darkenColor(dialColor, 8)};stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- 表盘外圈阴影 -->
  <circle cx="40" cy="37" r="34" fill="${darkenColor(dialColor, 30)}" opacity="0.25"/>
  <!-- 表盘外圈（金属框架） -->
  <circle cx="40" cy="36" r="34" fill="url(#gaugeRimGrad)" stroke="#1e293b" stroke-width="1.5"/>
  <!-- 外圈高光弧 -->
  <path d="M 20 21 A 34 34 0 0 1 55 8" fill="none" stroke="${lightenColor(dialColor, 40)}" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>

  <!-- 表盘面（白色圆） -->
  <circle cx="40" cy="36" r="27" fill="#f1f5f9" stroke="${lightenColor(dialColor, 6)}" stroke-width="1"/>

  <!-- 刻度圈 -->
  <circle cx="40" cy="36" r="23" fill="none" stroke="${scaleColor}" stroke-width="0.8" opacity="0.4"/>

  <!-- 刻度线 -->
  ${generateScaleTicks(scaleColor, 40, 36)}

  <!-- 指针旋转组 -->
  <g transform="rotate(${angle}, 40, 36)">
    <path d="M 40 36 L 40 14 L 42.5 22 L 40 36 Z" fill="${pointerColor}" />
    <path d="M 40 36 L 40 14 L 37.5 22 L 40 36 Z" fill="${darkenColor(pointerColor, 22)}" />
  </g>

  <!-- 中心轴斟外圈 -->
  <circle cx="40" cy="36" r="6" fill="${darkenColor(dialColor, 12)}" stroke="${scaleColor}" stroke-width="1"/>
  <!-- 中心轴斟内圈 -->
  <circle cx="40" cy="36" r="4" fill="${lightenColor(dialColor, 6)}"/>
  <!-- 中心点 -->
  <circle cx="40" cy="36" r="2.5" fill="${pointerColor}"/>
  <!-- 中心高光 -->
  <circle cx="39.2" cy="35.2" r="1" fill="white" opacity="0.5"/>

  <!-- 表接头阴影 -->
  <rect x="${connectorX}" y="${connectorY + 1}" width="${connectorWidth}" height="${connectorHeight}" rx="1" fill="${darkenColor(dialColor, 30)}" opacity="0.25"/>
  <!-- 表接头 -->
  <rect x="${connectorX}" y="${connectorY}" width="${connectorWidth}" height="${connectorHeight}" rx="1" fill="url(#gaugeConnGrad)" stroke="#1e293b" stroke-width="1"/>
  <line x1="${connectorX + 1}" y1="${connectorY + 1.5}" x2="${connectorX + connectorWidth - 1}" y2="${connectorY + 1.5}" stroke="${lightenColor(dialColor, 26)}" stroke-width="0.8" opacity="0.5"/>

  <!-- 故障闪烁 -->
  ${props.hasError ? `
  <circle cx="40" cy="36" r="34" fill="none" stroke="#ff4d4f" stroke-width="2.5" opacity="0.6">
    <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1s" repeatCount="indefinite"/>
  </circle>
  ` : ''}
</svg>
`;
}

function generateScaleTicks(color: string, cx: number, cy: number): string {
  const ticks: string[] = [];
  const positions = [0, 50, 100];

  for (const pos of positions) {
    const angle = -135 + (pos / 100) * 270;
    const rad = (angle * Math.PI) / 180;

    const x1 = cx + 24 * Math.cos(rad);
    const y1 = cy + 24 * Math.sin(rad);
    const x2 = cx + 28 * Math.cos(rad);
    const y2 = cy + 28 * Math.sin(rad);

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
  ...metadata,
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
