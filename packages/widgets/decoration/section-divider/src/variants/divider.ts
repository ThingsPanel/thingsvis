/**
 * 纯装饰变体渲染
 *
 * 所有 SVG 使用 width="100%" height="100%" 填满容器
 * 通过 viewBox + preserveAspectRatio="none" 实现拉伸缩放
 */

import type { Props } from '../schema';

interface RenderContext {
  primaryColor: string;
  secondaryColor: string;
  animated: boolean;
  animationSpeed: number;
}

function svgShell(vw: number, vh: number, content: string): string {
  return `<svg width="100%" height="100%" viewBox="0 0 ${vw} ${vh}" preserveAspectRatio="none">${content}</svg>`;
}

// ===================== D1: 扫描渐变条 =====================
function renderScanLine(ctx: RenderContext): string {
  const vw = 500, vh = 8;
  const speed = ctx.animationSpeed;
  return svgShell(vw, vh, `
  <rect x="0" y="3" width="${vw}" height="2" fill="${ctx.primaryColor}" rx="1">
    ${ctx.animated ? `<animate attributeName="width" from="0" to="${vw}" dur="${speed * 2}s" calcMode="spline" keyTimes="0;1" keySplines="0.42,0,0.58,1" repeatCount="indefinite"/>` : ''}
  </rect>
  <rect x="0" y="3" width="1" height="2" fill="#fff" rx="0.5">
    ${ctx.animated ? `<animate attributeName="x" from="0" to="${vw}" dur="${speed * 2}s" calcMode="spline" keyTimes="0;1" keySplines="0.42,0,0.58,1" repeatCount="indefinite"/>` : ''}
  </rect>`);
}

// ===================== D2: 竖线滑动 =====================
function renderSlideBar(ctx: RenderContext): string {
  const vw = 500, vh = 10;
  const speed = ctx.animationSpeed;
  return svgShell(vw, vh, `
  <polyline stroke="${ctx.primaryColor}" stroke-opacity="0.1" stroke-width="1" points="0,5 ${vw},5"/>
  <polyline stroke="${ctx.primaryColor}" stroke-opacity="0.25" stroke-width="3" stroke-dasharray="20,80" stroke-dashoffset="-30" points="0,5 ${vw},5">
    ${ctx.animated ? `<animate attributeName="stroke-dashoffset" from="0" to="-${vw}" dur="${speed}s" repeatCount="indefinite"/>` : ''}
  </polyline>`);
}

// ===================== D3: 六边形链 =====================
function renderHexChain(ctx: RenderContext): string {
  const vw = 500, vh = 36;
  const id = 'd3';
  return svgShell(vw, vh, `
  <defs><filter id="${id}-g"><feGaussianBlur stdDeviation="1"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
  <line x1="30" y1="18" x2="470" y2="18" stroke="${ctx.primaryColor}" stroke-opacity="0.15" stroke-width="1"/>
  <g filter="url(#${id}-g)">
    <polygon points="55,18 59,13 67,13 71,18 67,23 59,23" fill="none" stroke="${ctx.primaryColor}" stroke-width="0.7" opacity="0.2"/>
    <polygon points="110,18 116,11 126,11 132,18 126,25 116,25" fill="none" stroke="${ctx.primaryColor}" stroke-width="0.8" opacity="0.35"/>
    <polygon points="170,18 177,10 189,10 196,18 189,26 177,26" fill="${ctx.primaryColor}" stroke-opacity="0.04" stroke-width="0.8" opacity="0.55"/>
    <polygon points="230,18 238,8 254,8 262,18 254,28 238,28" fill="${ctx.primaryColor}" stroke-opacity="0.08" stroke-width="1.2" opacity="0.8"/>
    <polygon points="235,18 241,11 249,11 255,18 249,25 241,25" fill="none" stroke="${ctx.primaryColor}" stroke-width="0.4" opacity="0.4"/>
    <polygon points="305,18 313,8 329,8 337,18 329,28 313,28" fill="${ctx.primaryColor}" stroke-opacity="0.04" stroke-width="0.8" opacity="0.55"/>
    <polygon points="370,18 376,11 386,11 392,18 386,25 376,25" fill="none" stroke="${ctx.primaryColor}" stroke-width="0.8" opacity="0.35"/>
    <polygon points="430,18 434,13 442,13 446,18 442,23 434,23" fill="none" stroke="${ctx.primaryColor}" stroke-width="0.7" opacity="0.2"/>
  </g>`);
}

// ===================== D4: 信号波形 =====================
function renderSignalWave(ctx: RenderContext): string {
  const vw = 500, vh = 36;
  const id = 'd4';
  return svgShell(vw, vh, `
  <defs>
    <linearGradient id="${id}-l" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${ctx.primaryColor}" stop-opacity="0"/>
      <stop offset="35%" stop-color="${ctx.primaryColor}" stop-opacity="0.7"/>
      <stop offset="65%" stop-color="${ctx.primaryColor}" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="${ctx.primaryColor}" stop-opacity="0"/>
    </linearGradient>
    <filter id="${id}-g"><feGaussianBlur stdDeviation="1.5"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <line x1="0" y1="18" x2="${vw}" y2="18" stroke="${ctx.primaryColor}" stroke-opacity="0.08" stroke-width="0.5"/>
  <polyline points="0,18 25,18 45,17 65,19 85,16 105,20 120,14 135,22 150,11 165,25 180,8 195,28 210,5 225,32 240,3 255,33 270,3 285,32 300,5 315,28 330,8 345,25 360,11 375,22 390,14 405,20 420,16 440,19 460,17 480,18 ${vw},18"
    fill="none" stroke="url(#${id}-l)" stroke-width="1.2" filter="url(#${id}-g)" stroke-linejoin="round"/>
  <circle cx="240" cy="3" r="1.5" fill="#fff" opacity="0.7"/>
  <circle cx="270" cy="3" r="1.5" fill="#fff" opacity="0.7"/>`);
}

// ===================== D5: 发光点链 =====================
function renderDotChain(ctx: RenderContext): string {
  const vw = 500, vh = 36;
  const id = 'd5';
  return svgShell(vw, vh, `
  <defs>
    <filter id="${id}-g"><feGaussianBlur stdDeviation="1.5"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <line x1="50" y1="18" x2="450" y2="18" stroke="${ctx.primaryColor}" stroke-opacity="0.15" stroke-width="0.8"/>
  <circle cx="50" cy="18" r="2.5" fill="${ctx.primaryColor}" opacity="0.2"/>
  <circle cx="100" cy="18" r="3.5" fill="${ctx.primaryColor}" opacity="0.35" filter="url(#${id}-g)"/>
  <circle cx="150" cy="18" r="4.5" fill="${ctx.primaryColor}" opacity="0.55" filter="url(#${id}-g)"/>
  <circle cx="200" cy="18" r="5.5" fill="${ctx.primaryColor}" opacity="0.8" filter="url(#${id}-g)"/>
  <circle cx="250" cy="18" r="7" fill="${ctx.primaryColor}" opacity="1" filter="url(#${id}-g)"/>
  <circle cx="300" cy="18" r="5.5" fill="${ctx.primaryColor}" opacity="0.8" filter="url(#${id}-g)"/>
  <circle cx="350" cy="18" r="4.5" fill="${ctx.primaryColor}" opacity="0.55" filter="url(#${id}-g)"/>
  <circle cx="400" cy="18" r="3.5" fill="${ctx.primaryColor}" opacity="0.35" filter="url(#${id}-g)"/>
  <circle cx="450" cy="18" r="2.5" fill="${ctx.primaryColor}" opacity="0.2"/>`);
}

// ===================== D6: 方括号收尾 =====================
function renderBracketEnds(ctx: RenderContext): string {
  const vw = 500, vh = 36;
  const id = 'd6';
  return svgShell(vw, vh, `
  <defs>
    <filter id="${id}-g"><feGaussianBlur stdDeviation="1.2"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <linearGradient id="${id}-l" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${ctx.primaryColor}" stop-opacity="0.2"/>
      <stop offset="50%" stop-color="${ctx.primaryColor}" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="${ctx.primaryColor}" stop-opacity="0.2"/>
    </linearGradient>
  </defs>
  <line x1="80" y1="8" x2="80" y2="28" stroke="url(#${id}-l)" stroke-width="2" filter="url(#${id}-g)"/>
  <line x1="80" y1="8" x2="110" y2="8" stroke="url(#${id}-l)" stroke-width="2" filter="url(#${id}-g)"/>
  <line x1="80" y1="28" x2="110" y2="28" stroke="url(#${id}-l)" stroke-width="2" filter="url(#${id}-g)"/>
  <line x1="60" y1="18" x2="440" y2="18" stroke="${ctx.primaryColor}" stroke-opacity="0.08" stroke-width="1"/>
  <line x1="420" y1="8" x2="420" y2="28" stroke="url(#${id}-l)" stroke-width="2" filter="url(#${id}-g)"/>
  <line x1="390" y1="8" x2="420" y2="8" stroke="url(#${id}-l)" stroke-width="2" filter="url(#${id}-g)"/>
  <line x1="390" y1="28" x2="420" y2="28" stroke="url(#${id}-l)" stroke-width="2" filter="url(#${id}-g)"/>
  <circle cx="250" cy="18" r="1.5" fill="${ctx.primaryColor}" opacity="0.5"/>`);
}

// ===================== D7: 菱形拖尾 =====================
function renderDiamondTrail(ctx: RenderContext): string {
  const vw = 500, vh = 36;
  const id = 'd8';
  return svgShell(vw, vh, `
  <defs>
    <filter id="${id}-g"><feGaussianBlur stdDeviation="1.5"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <line x1="40" y1="18" x2="460" y2="18" stroke="${ctx.primaryColor}" stroke-opacity="0.1" stroke-width="0.8"/>
  <polygon points="80,18 88,10 96,18 88,26" fill="none" stroke="${ctx.primaryColor}" stroke-width="0.6" opacity="0.15"/>
  <polygon points="110,18 120,8 130,18 120,28" fill="none" stroke="${ctx.primaryColor}" stroke-width="0.8" opacity="0.25"/>
  <polygon points="145,18 158,5 171,18 158,31" fill="none" stroke="${ctx.primaryColor}" stroke-width="1" opacity="0.4"/>
  <polygon points="185,18 202,2 219,18 202,34" fill="${ctx.primaryColor}" stroke-opacity="0.15" stroke-width="1" filter="url(#${id}-g)"/>
  <polygon points="230,18 250,0 270,18 250,36" fill="${ctx.primaryColor}" stroke-opacity="0.25" stroke-width="1.2" filter="url(#${id}-g)"/>
  <polygon points="275,18 250,0 225,18 250,36" fill="${ctx.primaryColor}" stroke-opacity="0.25" stroke-width="1.2" filter="url(#${id}-g)"/>
  <polygon points="315,18 298,2 281,18 298,34" fill="${ctx.primaryColor}" stroke-opacity="0.15" stroke-width="1" filter="url(#${id}-g)"/>
  <polygon points="355,18 342,5 329,18 342,31" fill="none" stroke="${ctx.primaryColor}" stroke-width="1" opacity="0.4"/>
  <polygon points="390,18 380,8 370,18 380,28" fill="none" stroke="${ctx.primaryColor}" stroke-width="0.8" opacity="0.25"/>
  <polygon points="420,18 412,10 404,18 412,26" fill="none" stroke="${ctx.primaryColor}" stroke-width="0.6" opacity="0.15"/>`);
}

// ===================== 统一入口 =====================
export function renderDivider(
  variant: string,
  _props: Props,
  ctx: RenderContext,
): string {
  switch (variant) {
    case 'scan-line':     return renderScanLine(ctx);
    case 'slide-bar':     return renderSlideBar(ctx);
    case 'hex-chain':     return renderHexChain(ctx);
    case 'signal-wave':   return renderSignalWave(ctx);
    case 'dot-chain':     return renderDotChain(ctx);
    case 'bracket-ends':  return renderBracketEnds(ctx);
    case 'diamond-trail': return renderDiamondTrail(ctx);
    default:              return renderDotChain(ctx);
  }
}
