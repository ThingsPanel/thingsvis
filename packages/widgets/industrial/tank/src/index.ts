import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import { defineWidget } from '@thingsvis/widget-sdk';
import zh from './locales/zh.json';
import en from './locales/en.json';

const LEGACY_PERCENT_MAX = 100;

/**
 * Saved projects used 0–100 (%). New props are meters.
 * If both thresholds look like percentages (e.g. 20 / 80), interpret level and thresholds as % of maxMeters.
 */
function levelsInMeters(props: Props): { maxM: number; level: number; low: number; high: number } {
  const maxM = Math.max(0.001, props.maxMeters);
  let level = props.level;
  let low = props.lowThreshold;
  let high = props.highThreshold;

  const thresholdsLookLikePercent =
    low > maxM && high > maxM && low <= LEGACY_PERCENT_MAX && high <= LEGACY_PERCENT_MAX;

  const looksLegacyPercent =
    thresholdsLookLikePercent && level <= LEGACY_PERCENT_MAX;

  if (looksLegacyPercent) {
    level = (level / LEGACY_PERCENT_MAX) * maxM;
    low = (low / LEGACY_PERCENT_MAX) * maxM;
    high = (high / LEGACY_PERCENT_MAX) * maxM;
  }

  return {
    maxM,
    level: Math.max(0, Math.min(maxM, level)),
    low: Math.max(0, Math.min(maxM, low)),
    high: Math.max(0, Math.min(maxM, high)),
  };
}

function migrateTankProps(props: unknown, fromVersion: string): unknown {
  if (fromVersion !== '1.0.0' || typeof props !== 'object' || props === null) {
    return props;
  }
  const p = props as Record<string, unknown>;
  const maxM = typeof p.maxMeters === 'number' && p.maxMeters > 0 ? p.maxMeters : 3;
  const toM = (v: unknown) =>
    typeof v === 'number' ? (v / LEGACY_PERCENT_MAX) * maxM : v;
  return {
    ...p,
    maxMeters: maxM,
    level: toM(p.level),
    lowThreshold: toM(p.lowThreshold),
    highThreshold: toM(p.highThreshold),
  };
}

function renderTank(element: HTMLElement, props: Props): void {
  element.style.width = '100%';
  element.style.height = '100%';
  element.style.display = 'block';
  element.style.lineHeight = '0';

  const { maxM: maxMeters, level, low: lowThreshold, high: highThreshold } = levelsInMeters(props);

  const previousLevel = Number.isFinite(Number(element.dataset.prevLevel))
    ? Math.max(0, Math.min(maxMeters, Number(element.dataset.prevLevel)))
    : level;

  let liquidColor = props.liquidColor;
  if (props.hasError) {
    liquidColor = '#ff4d4f';
  } else if (level <= lowThreshold) {
    liquidColor = props.lowColor;
  } else if (level >= highThreshold) {
    liquidColor = props.highColor;
  }

  const tankColor = props.hasError ? '#ff4d4f' : (props.tankColor || '#334155');

  const vw = 120;
  const vh = 90;
  const tankX = 15;
  const tankY = 22;
  const tankW = 76;
  const tankH = 54;
  const tankCx = tankX + tankW / 2;
  const innerX = tankX + 4;
  const innerY = tankY + 5;
  const innerW = tankW - 8;
  const innerH = tankH - 9;
  const innerBot = innerY + innerH;

  const liquidHeight = (level / maxMeters) * innerH;
  const liquidY = innerBot - liquidHeight;
  const prevLiquidHeight = (previousLevel / maxMeters) * innerH;
  const prevLiquidY = innerBot - prevLiquidHeight;
  const levelMeters = level;

  const valueColor = props.hasError ? '#fecaca' : '#e2e8f0';
  const tickColor = props.hasError ? '#fca5a5' : '#94a3b8';
  const scaleX = tankX + tankW + 5;
  const scaleLabelX = scaleX + 7;
  const scaleFor = (meters: number) => innerBot - (meters / maxMeters) * innerH;
  const scaleTickMeters = [0, 1, 2, 3].map((i) => (maxMeters * (3 - i)) / 3);
  const scaleTicks = scaleTickMeters
    .map((meters) => `
  <line x1="${scaleX - 3}" y1="${scaleFor(meters)}" x2="${scaleX + 3}" y2="${scaleFor(meters)}" stroke="${tickColor}" stroke-width="1"/>
  <text x="${scaleLabelX}" y="${scaleFor(meters) + 2.5}" fill="${valueColor}" font-size="6" font-family="sans-serif">${meters.toFixed(1)}m</text>`)
    .join('');

  element.innerHTML = `
<svg width="100%" height="100%" viewBox="0 0 ${vw} ${vh}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" style="display:block">
  <defs>
    <linearGradient id="tankFrameGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${darkenColor(tankColor, 18)};stop-opacity:1" />
      <stop offset="45%" style="stop-color:${lightenColor(tankColor, 34)};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${darkenColor(tankColor, 12)};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="tankGlassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#082f49;stop-opacity:0.48" />
      <stop offset="45%" style="stop-color:#0f172a;stop-opacity:0.2" />
      <stop offset="100%" style="stop-color:#020617;stop-opacity:0.5" />
    </linearGradient>
    <linearGradient id="tankConnGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${darkenColor(tankColor, 12)};stop-opacity:1" />
      <stop offset="45%" style="stop-color:${lightenColor(tankColor, 26)};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${darkenColor(tankColor, 12)};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="tankOutletPipeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${lightenColor(tankColor, 18)};stop-opacity:1" />
      <stop offset="45%" style="stop-color:${lightenColor(tankColor, 28)};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${darkenColor(tankColor, 8)};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="tankOutletFlangeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${lightenColor(tankColor, 22)};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${darkenColor(tankColor, 12)};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="liquidGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${lightenColor(liquidColor, 26)};stop-opacity:0.92" />
      <stop offset="48%" style="stop-color:${liquidColor};stop-opacity:0.94" />
      <stop offset="100%" style="stop-color:${darkenColor(liquidColor, 18)};stop-opacity:0.98" />
    </linearGradient>
    <linearGradient id="surfaceGlow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${lightenColor(liquidColor, 40)};stop-opacity:0.1" />
      <stop offset="50%" style="stop-color:${lightenColor(liquidColor, 55)};stop-opacity:0.75" />
      <stop offset="100%" style="stop-color:${lightenColor(liquidColor, 40)};stop-opacity:0.1" />
    </linearGradient>
    <clipPath id="tankClip">
      <rect x="${innerX}" y="${innerY}" width="${innerW}" height="${innerH}" rx="4" ry="4"/>
    </clipPath>
  </defs>

  <rect x="${tankX - 3}" y="${tankY + 1.5}" width="${tankW + 6}" height="${tankH}" rx="6" fill="#020617" opacity="0.35"/>

  <path d="M ${tankX + 6} ${tankY} V ${tankY - 7} Q ${tankX + 6} ${tankY - 13} ${tankX + 13} ${tankY - 13} H ${tankX + 18}" fill="none" stroke="url(#tankConnGrad)" stroke-width="5" stroke-linecap="round"/>
  <path d="M ${tankX + tankW - 6} ${tankY} V ${tankY - 7} Q ${tankX + tankW - 6} ${tankY - 13} ${tankX + tankW - 13} ${tankY - 13} H ${tankX + tankW - 18}" fill="none" stroke="url(#tankConnGrad)" stroke-width="5" stroke-linecap="round"/>
  <rect x="${tankCx - 6}" y="${tankY - 16}" width="12" height="9" rx="1.5" fill="url(#tankConnGrad)" stroke="#1e293b" stroke-width="1"/>
  <rect x="${tankCx - 10}" y="${tankY - 18}" width="20" height="4" rx="1.5" fill="url(#tankFrameGrad)" stroke="#1e293b" stroke-width="1"/>

  <g clip-path="url(#tankClip)">
    <rect x="${innerX}" y="${liquidY}" width="${innerW}" height="${liquidHeight}" fill="url(#liquidGradient)">
      <animate attributeName="y" from="${prevLiquidY}" to="${liquidY}" dur="0.55s" fill="freeze" calcMode="spline" keySplines="0.2 0 0.2 1" keyTimes="0;1"/>
      <animate attributeName="height" from="${prevLiquidHeight}" to="${liquidHeight}" dur="0.55s" fill="freeze" calcMode="spline" keySplines="0.2 0 0.2 1" keyTimes="0;1"/>
    </rect>
    <rect x="${innerX}" y="${liquidY}" width="${innerW}" height="4" fill="url(#surfaceGlow)" opacity="0.65">
      <animate attributeName="y" from="${prevLiquidY}" to="${liquidY}" dur="0.55s" fill="freeze" calcMode="spline" keySplines="0.2 0 0.2 1" keyTimes="0;1"/>
      <animate attributeName="opacity" values="0.35;0.75;0.35" dur="2.6s" repeatCount="indefinite"/>
    </rect>
    <circle cx="${innerX + innerW * 0.74}" cy="${liquidY + 12}" r="0.8" fill="${lightenColor(liquidColor, 50)}" opacity="0.45">
      <animate attributeName="cy" values="${liquidY + 14};${liquidY + 8};${liquidY + 14}" dur="3s" repeatCount="indefinite"/>
    </circle>
  </g>

  <rect x="${tankX}" y="${tankY}" width="${tankW}" height="${tankH}" rx="5" fill="url(#tankGlassGrad)" stroke="#0f172a" stroke-width="3"/>
  <rect x="${tankX + 2}" y="${tankY + 2}" width="${tankW - 4}" height="${tankH - 4}" rx="4" fill="none" stroke="${lightenColor(tankColor, 36)}" stroke-width="1.2" opacity="0.55"/>
  <path d="M ${tankX + 5} ${tankY + 5} H ${tankX + tankW - 12}" stroke="#7dd3fc" stroke-width="1" stroke-linecap="round" opacity="0.45"/>

  <text x="${tankCx}" y="${tankY + 31}" text-anchor="middle" fill="${valueColor}" font-size="8" font-family="sans-serif" font-weight="bold">&#28082;&#20301;</text>
  <text x="${tankCx}" y="${tankY + 46}" text-anchor="middle" fill="${valueColor}" font-size="11" font-family="monospace" font-weight="bold">${levelMeters.toFixed(2)} m</text>

  <line x1="${scaleX}" y1="${innerY}" x2="${scaleX}" y2="${innerBot}" stroke="${tickColor}" stroke-width="0.8" opacity="0.5"/>
  ${scaleTicks}

  <rect x="${tankX + tankW}" y="${tankY + tankH - 18}" width="16" height="12" fill="url(#tankOutletPipeGrad)"/>
  <line x1="${tankX + tankW}" y1="${tankY + tankH - 18}" x2="${tankX + tankW + 16}" y2="${tankY + tankH - 18}" stroke="${lightenColor(tankColor, 32)}" stroke-width="1"/>
  <line x1="${tankX + tankW}" y1="${tankY + tankH - 6}" x2="${tankX + tankW + 16}" y2="${tankY + tankH - 6}" stroke="${darkenColor(tankColor, 22)}" stroke-width="1"/>
  <rect x="${tankX + tankW - 1}" y="${tankY + tankH - 23}" width="6" height="22" rx="1" fill="url(#tankOutletFlangeGrad)" stroke="#1e293b" stroke-width="1"/>
  <line x1="${tankX + tankW + 3.5}" y1="${tankY + tankH - 20}" x2="${tankX + tankW + 3.5}" y2="${tankY + tankH - 4}" stroke="${lightenColor(tankColor, 28)}" stroke-width="0.8" opacity="0.6"/>

  <rect x="${tankX - 2}" y="${tankY + tankH}" width="7" height="9" rx="1" fill="url(#tankConnGrad)" stroke="#1e293b" stroke-width="1"/>
  <rect x="${tankX + tankW - 5}" y="${tankY + tankH}" width="7" height="9" rx="1" fill="url(#tankConnGrad)" stroke="#1e293b" stroke-width="1"/>
  <rect x="${tankX - 5}" y="${tankY + tankH + 8}" width="14" height="3" rx="1" fill="url(#tankFrameGrad)" stroke="#1e293b" stroke-width="0.8"/>
  <rect x="${tankX + tankW - 9}" y="${tankY + tankH + 8}" width="14" height="3" rx="1" fill="url(#tankFrameGrad)" stroke="#1e293b" stroke-width="0.8"/>

  ${props.hasError ? `
  <rect x="${tankX}" y="${tankY}" width="${tankW}" height="${tankH}" rx="5" fill="none" stroke="#ff4d4f" stroke-width="2.5" opacity="0.6">
    <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1s" repeatCount="indefinite"/>
  </rect>
  ` : ''}
</svg>
`;

  element.dataset.prevLevel = String(levelMeters);
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
  migrate: migrateTankProps,
  render: (element: HTMLElement, props: Props) => {
    renderTank(element, props);
    return {
      update: (nextProps: Props) => renderTank(element, nextProps),
      destroy: () => { element.innerHTML = ''; },
    };
  },
});

export default Main;
