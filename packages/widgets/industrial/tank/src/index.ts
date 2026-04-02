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

  // Layout constants — wider viewBox gives the tank room to breathe
  // Tank occupies centre; scale ticks sit to the right with generous spacing
  const vw = 90;   // viewBox width
  const vh = 120;  // viewBox height

  const tankX = 14;
  const tankW = 44;
  const tankCx = tankX + tankW / 2;   // 36
  const bodyTop = 16;
  const bodyH = 88;
  const bodyBot = bodyTop + bodyH;     // 104 (clamped by vh below)

  // Connector (top/bottom pipe stub)
  const connW = 16;
  const connH = 9;
  const connX = tankCx - connW / 2;

  // Liquid fill — inner body (inside rounded rect)
  const innerTop = bodyTop + 4;
  const innerH = bodyH - 8;
  const innerBot = innerTop + innerH;  // liquid fill 100% = innerBot

  const liquidHeight = (level / 100) * innerH;
  const liquidY = innerBot - liquidHeight;
  const prevLiquidHeight = (previousLevel / 100) * innerH;
  const prevLiquidY = innerBot - prevLiquidHeight;

  // Scale ticks (right side of tank)
  const tickX0 = tankX + tankW + 6;   // start of tick line
  const tickX1 = tickX0 + 8;          // end of tick line
  const labelX = tickX1 + 2;

  const actualValueLabel = `${Math.round(level)}%`;
  const valueColor = props.hasError ? '#fecaca' : '#e2e8f0';
  const tickColor = props.hasError ? '#fca5a5' : '#94a3b8';

  // Viewport window y (shows level %) — placed in upper third of body
  const winY = bodyTop + 6;

  element.innerHTML = `
<svg width="100%" height="100%" viewBox="0 0 ${vw} ${vh}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" style="display:block">
  <defs>
    <linearGradient id="tankGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   style="stop-color:${darkenColor(tankColor, 14)};stop-opacity:1" />
      <stop offset="28%"  style="stop-color:${lightenColor(tankColor, 20)};stop-opacity:1" />
      <stop offset="52%"  style="stop-color:${lightenColor(tankColor, 28)};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${darkenColor(tankColor, 12)};stop-opacity:1" />
    </linearGradient>
    <radialGradient id="tankCapGrad" cx="38%" cy="35%" r="62%">
      <stop offset="0%"   style="stop-color:${lightenColor(tankColor, 36)};stop-opacity:1" />
      <stop offset="55%"  style="stop-color:${lightenColor(tankColor, 10)};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${darkenColor(tankColor, 24)};stop-opacity:1" />
    </radialGradient>
    <linearGradient id="tankConnGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   style="stop-color:${darkenColor(tankColor, 12)};stop-opacity:1" />
      <stop offset="45%"  style="stop-color:${lightenColor(tankColor, 22)};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${darkenColor(tankColor, 12)};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="liquidGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   style="stop-color:${darkenColor(liquidColor, 10)};stop-opacity:0.95" />
      <stop offset="45%"  style="stop-color:${lightenColor(liquidColor, 28)};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${darkenColor(liquidColor, 8)};stop-opacity:0.95" />
    </linearGradient>
    <linearGradient id="surfaceGlow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   style="stop-color:${lightenColor(liquidColor, 40)};stop-opacity:0.1" />
      <stop offset="50%"  style="stop-color:${lightenColor(liquidColor, 55)};stop-opacity:0.65" />
      <stop offset="100%" style="stop-color:${lightenColor(liquidColor, 40)};stop-opacity:0.1" />
    </linearGradient>
    <clipPath id="tankClip">
      <rect x="${tankX}" y="${bodyTop}" width="${tankW}" height="${bodyH}" rx="8" ry="8"/>
    </clipPath>
  </defs>

  <!-- Top connector pipe -->
  <rect x="${connX}" y="${bodyTop - connH - 3}" width="${connW}" height="${connH}" rx="1.5"
        fill="url(#tankConnGrad)" stroke="#1e293b" stroke-width="1"/>
  <!-- Top flange ring -->
  <rect x="${connX - 3}" y="${bodyTop - connH - 6}" width="${connW + 6}" height="4" rx="1.5"
        fill="url(#tankConnGrad)" stroke="#1e293b" stroke-width="1"/>
  <line x1="${connX + 1}" y1="${bodyTop - connH - 5.5}" x2="${connX + connW - 1}" y2="${bodyTop - connH - 5.5}"
        stroke="${lightenColor(tankColor, 30)}" stroke-width="0.7" opacity="0.55"/>

  <!-- Tank body shadow -->
  <rect x="${tankX}" y="${bodyTop + 2}" width="${tankW}" height="${bodyH}" rx="8" ry="8"
        fill="${darkenColor(tankColor, 30)}" opacity="0.22"/>
  <!-- Tank body -->
  <rect x="${tankX}" y="${bodyTop}" width="${tankW}" height="${bodyH}" rx="8" ry="8"
        fill="url(#tankGradient)" stroke="#1e293b" stroke-width="1.5"/>
  <!-- Top dome cap -->
  <ellipse cx="${tankCx}" cy="${bodyTop + 1}" rx="${tankW / 2 - 1}" ry="6"
           fill="url(#tankCapGrad)" stroke="#1e293b" stroke-width="1"/>
  <!-- Bottom dome cap -->
  <ellipse cx="${tankCx}" cy="${bodyBot - 1}" rx="${tankW / 2 - 1}" ry="6"
           fill="${darkenColor(tankColor, 18)}" stroke="#1e293b" stroke-width="1"/>
  <!-- Body left-edge highlight -->
  <line x1="${tankX + 3}" y1="${bodyTop + 12}" x2="${tankX + 3}" y2="${bodyBot - 12}"
        stroke="${lightenColor(tankColor, 36)}" stroke-width="1.2" opacity="0.35" stroke-linecap="round"/>

  <!-- Liquid fill (clipped) -->
  <g clip-path="url(#tankClip)">
    <rect x="${tankX}" y="${liquidY}" width="${tankW}" height="${liquidHeight}" fill="url(#liquidGradient)">
      <animate attributeName="y"      from="${prevLiquidY}"      to="${liquidY}"      dur="0.5s" fill="freeze" calcMode="spline" keySplines="0.2 0 0.2 1" keyTimes="0;1"/>
      <animate attributeName="height" from="${prevLiquidHeight}" to="${liquidHeight}" dur="0.5s" fill="freeze" calcMode="spline" keySplines="0.2 0 0.2 1" keyTimes="0;1"/>
    </rect>
    <!-- Liquid surface shimmer -->
    <rect x="${tankX}" y="${liquidY}" width="${tankW}" height="4" fill="url(#surfaceGlow)" opacity="0.55">
      <animate attributeName="y"      from="${prevLiquidY}"      to="${liquidY}"      dur="0.5s" fill="freeze" calcMode="spline" keySplines="0.2 0 0.2 1" keyTimes="0;1"/>
      <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2.6s" repeatCount="indefinite"/>
    </rect>
  </g>

  <!-- Glass window frame -->
  <rect x="${tankX + 6}" y="${winY}" width="${tankW - 12}" height="14" rx="4"
        fill="#0a1628" fill-opacity="0.7" stroke="#475569" stroke-width="1"/>
  <line x1="${tankX + 7}" y1="${winY + 1}" x2="${tankX + tankW - 7}" y2="${winY + 1}"
        stroke="#64748b" stroke-width="0.7" opacity="0.5"/>
  <!-- Level % text -->
  <text x="${tankCx}" y="${winY + 9.5}" text-anchor="middle"
        fill="${valueColor}" font-size="7.5" font-family="monospace" font-weight="bold" letter-spacing="0.5">${actualValueLabel}</text>

  <!-- Scale track line -->
  <line x1="${tickX0 - 1}" y1="${innerTop}" x2="${tickX0 - 1}" y2="${innerBot}"
        stroke="${tickColor}" stroke-width="0.6" opacity="0.4"/>
  <!-- Scale ticks + labels (100 / 50 / 0) -->
  <line x1="${tickX0 - 1}" y1="${innerTop}"           x2="${tickX1}" y2="${innerTop}"           stroke="${tickColor}" stroke-width="1.2"/>
  <line x1="${tickX0 - 1}" y1="${(innerTop + innerBot) / 2}" x2="${tickX1}" y2="${(innerTop + innerBot) / 2}" stroke="${tickColor}" stroke-width="1.2"/>
  <line x1="${tickX0 - 1}" y1="${innerBot}"           x2="${tickX1}" y2="${innerBot}"           stroke="${tickColor}" stroke-width="1.2"/>
  <!-- Minor ticks -->
  <line x1="${tickX0 - 1}" y1="${innerTop + innerH * 0.25}" x2="${tickX0 + 4}" y2="${innerTop + innerH * 0.25}" stroke="${tickColor}" stroke-width="0.7" opacity="0.55"/>
  <line x1="${tickX0 - 1}" y1="${innerTop + innerH * 0.75}" x2="${tickX0 + 4}" y2="${innerTop + innerH * 0.75}" stroke="${tickColor}" stroke-width="0.7" opacity="0.55"/>
  <text x="${labelX}" y="${innerTop + 3}"                  fill="${tickColor}" font-size="6" font-family="sans-serif">100</text>
  <text x="${labelX}" y="${(innerTop + innerBot) / 2 + 2}" fill="${tickColor}" font-size="6" font-family="sans-serif">50</text>
  <text x="${labelX}" y="${innerBot + 2}"                  fill="${tickColor}" font-size="6" font-family="sans-serif">0</text>

  <!-- Active level indicator arrow -->
  <line x1="${tickX0 - 4}" y1="${liquidY}" x2="${tickX0 - 1}" y2="${liquidY}"
        stroke="${liquidColor}" stroke-width="1.5" opacity="0.8">
    <animate attributeName="y1" from="${prevLiquidY}" to="${liquidY}" dur="0.5s" fill="freeze" calcMode="spline" keySplines="0.2 0 0.2 1" keyTimes="0;1"/>
    <animate attributeName="y2" from="${prevLiquidY}" to="${liquidY}" dur="0.5s" fill="freeze" calcMode="spline" keySplines="0.2 0 0.2 1" keyTimes="0;1"/>
  </line>
  <circle cx="${tickX0 - 5.5}" cy="${liquidY}" r="2.5" fill="${liquidColor}" opacity="0.85">
    <animate attributeName="cy" from="${prevLiquidY}" to="${liquidY}" dur="0.5s" fill="freeze" calcMode="spline" keySplines="0.2 0 0.2 1" keyTimes="0;1"/>
  </circle>

  <!-- Bottom connector pipe -->
  <!-- Bottom flange ring -->
  <rect x="${connX - 3}" y="${bodyBot + 2}" width="${connW + 6}" height="4" rx="1.5"
        fill="url(#tankConnGrad)" stroke="#1e293b" stroke-width="1"/>
  <line x1="${connX + 1}" y1="${bodyBot + 3.5}" x2="${connX + connW - 1}" y2="${bodyBot + 3.5}"
        stroke="${lightenColor(tankColor, 30)}" stroke-width="0.7" opacity="0.55"/>
  <rect x="${connX}" y="${bodyBot + 6}" width="${connW}" height="${connH}" rx="1.5"
        fill="url(#tankConnGrad)" stroke="#1e293b" stroke-width="1"/>

  ${props.hasError ? `
  <rect x="${tankX}" y="${bodyTop}" width="${tankW}" height="${bodyH}" rx="8" ry="8"
        fill="none" stroke="#ff4d4f" stroke-width="2.5" opacity="0.6">
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
