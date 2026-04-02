import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import { defineWidget } from '@thingsvis/widget-sdk';
import zh from './locales/zh.json';
import en from './locales/en.json';

function renderTank(element: HTMLElement, props: Props): void {
  element.style.width = '100%';
  element.style.height = '100%';
  element.style.display = 'block';
  element.style.lineHeight = '0';

  const level = Math.max(0, Math.min(100, props.level));
  const previousLevel = Number.isFinite(Number(element.dataset.prevLevel))
    ? Math.max(0, Math.min(100, Number(element.dataset.prevLevel)))
    : level;

  let liquidColor = props.liquidColor;
  if (props.hasError) {
    liquidColor = '#ff4d4f';
  } else if (level <= props.lowThreshold) {
    liquidColor = props.lowColor;
  } else if (level >= props.highThreshold) {
    liquidColor = props.highColor;
  }

  const tankColor = props.hasError ? '#ff4d4f' : (props.tankColor || '#334155');
  const previousLiquidHeight = (previousLevel / 100) * 80;
  const previousLiquidY = 90 - previousLiquidHeight;
  const liquidHeight = (level / 100) * 80;
  const liquidY = 90 - liquidHeight;

  const tankX = 4;
  const tankWidth = 40;
  const tankInnerY = 10;
  const tankInnerHeight = 80;
  const connectorWidth = 15;
  const connectorHeight = 7;
  const connectorX = tankX + (tankWidth - connectorWidth) / 2;
  const scaleLineStartX = 48;
  const scaleLineEndX = 55;
  const scaleLabelX = 64;
  const actualValueLabel = `${Math.round(level)}%`;
  const valueColor = props.hasError ? '#fecaca' : '#e2e8f0';
  const tickColor = props.hasError ? '#fca5a5' : '#94a3b8';

  element.innerHTML = `
<svg width="100%" height="100%" viewBox="0 0 72 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style="display:block">
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
    <linearGradient id="surfaceGlow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${lightenColor(liquidColor, 35)};stop-opacity:0.15" />
      <stop offset="50%" style="stop-color:${lightenColor(liquidColor, 45)};stop-opacity:0.55" />
      <stop offset="100%" style="stop-color:${lightenColor(liquidColor, 35)};stop-opacity:0.15" />
    </linearGradient>
    <clipPath id="tankClip">
      <rect x="${tankX}" y="${tankInnerY}" width="${tankWidth}" height="${tankInnerHeight}" rx="6" ry="6"/>
    </clipPath>
    <radialGradient id="tankCapGrad" cx="38%" cy="35%" r="62%">
      <stop offset="0%" style="stop-color:${lightenColor(tankColor, 32)};stop-opacity:1" />
      <stop offset="55%" style="stop-color:${lightenColor(tankColor, 8)};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${darkenColor(tankColor, 22)};stop-opacity:1" />
    </radialGradient>
    <linearGradient id="tankConnGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${darkenColor(tankColor, 10)};stop-opacity:1" />
      <stop offset="40%" style="stop-color:${lightenColor(tankColor, 20)};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${darkenColor(tankColor, 10)};stop-opacity:1" />
    </linearGradient>
  </defs>

  <rect x="${connectorX}" y="${8 - connectorHeight}" width="${connectorWidth}" height="${connectorHeight}" rx="1" fill="url(#tankConnGrad)" stroke="#1e293b" stroke-width="0.8"/>

  <rect x="${tankX}" y="8" width="${tankWidth}" height="84" rx="6" ry="6" fill="url(#tankGradient)" stroke="#1e293b" stroke-width="1.5"/>
  <ellipse cx="${tankX + tankWidth / 2}" cy="9" rx="${tankWidth / 2 - 1}" ry="4" fill="url(#tankCapGrad)" stroke="#1e293b" stroke-width="1"/>
  <line x1="${tankX + 2}" y1="18" x2="${tankX + 2}" y2="84" stroke="${lightenColor(tankColor, 32)}" stroke-width="0.8" opacity="0.3" stroke-linecap="round"/>
  <rect x="10" y="14" width="28" height="10" rx="3" fill="#0f172a" fill-opacity="0.55" stroke="#475569" stroke-width="0.8"/>
  <text x="24" y="21" text-anchor="middle" fill="${valueColor}" font-size="6.5" font-family="sans-serif" font-weight="bold">${actualValueLabel}</text>

  <g clip-path="url(#tankClip)">
    <rect x="${tankX}" y="${liquidY}" width="${tankWidth}" height="${liquidHeight}" fill="url(#liquidGradient)">
      <animate attributeName="y" from="${previousLiquidY}" to="${liquidY}" dur="0.45s" fill="freeze" calcMode="spline" keySplines="0.2 0 0.2 1" keyTimes="0;1"/>
      <animate attributeName="height" from="${previousLiquidHeight}" to="${liquidHeight}" dur="0.45s" fill="freeze" calcMode="spline" keySplines="0.2 0 0.2 1" keyTimes="0;1"/>
    </rect>
    <rect x="${tankX}" y="${liquidY}" width="${tankWidth}" height="3" fill="url(#surfaceGlow)" opacity="0.5">
      <animate attributeName="y" from="${previousLiquidY}" to="${liquidY}" dur="0.45s" fill="freeze" calcMode="spline" keySplines="0.2 0 0.2 1" keyTimes="0;1"/>
      <animate attributeName="opacity" values="0.28;0.6;0.28" dur="2.2s" repeatCount="indefinite"/>
    </rect>
  </g>

  <line x1="${scaleLineStartX}" y1="84" x2="${scaleLineEndX}" y2="84" stroke="${tickColor}" stroke-width="1"/>
  <line x1="${scaleLineStartX}" y1="50" x2="${scaleLineEndX}" y2="50" stroke="${tickColor}" stroke-width="1"/>
  <line x1="${scaleLineStartX}" y1="16" x2="${scaleLineEndX}" y2="16" stroke="${tickColor}" stroke-width="1"/>
  <text x="${scaleLabelX}" y="18.5" text-anchor="end" fill="${tickColor}" font-size="5.5" font-family="sans-serif" font-weight="bold">100</text>
  <text x="${scaleLabelX}" y="52.5" text-anchor="end" fill="${tickColor}" font-size="5.5" font-family="sans-serif" font-weight="bold">50</text>
  <text x="${scaleLabelX}" y="86.5" text-anchor="end" fill="${tickColor}" font-size="5.5" font-family="sans-serif" font-weight="bold">0</text>

  <rect x="${connectorX}" y="92" width="${connectorWidth}" height="${connectorHeight}" rx="1" fill="url(#tankConnGrad)" stroke="#1e293b" stroke-width="0.8"/>

  ${props.hasError ? `
  <rect x="${tankX}" y="8" width="${tankWidth}" height="84" rx="6" ry="6" fill="none" stroke="#ff4d4f" stroke-width="2.5" opacity="0.6">
    <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1s" repeatCount="indefinite"/>
  </rect>
  ` : ''}
</svg>
`;

  element.dataset.prevLevel = String(level);
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
    renderTank(element, props);
    return {
      update: (nextProps: Props) => renderTank(element, nextProps),
      destroy: () => { element.innerHTML = ''; },
    };
  },
});

export default Main;
