/**
 * 区域标题栏变体渲染
 *
 * 从 decoration-preview-v3.html 中提取 R1-R14 变体实现
 * 所有 SVG 使用 viewBox 自然尺寸 + preserveAspectRatio="none" 拉伸填充
 * 由 CSS 容器负责实际尺寸
 */

import type { Props } from '../schema';

interface RenderContext {
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  title: string;
  animated: boolean;
  animationSpeed: number;
  showDecoration: boolean;
  showTitle: boolean;
}

// ===================== R1: 竖条标题 =====================
function renderBar(ctx: RenderContext): string {
  const { primaryColor, title, showTitle } = ctx;
  return `<svg width="100%" height="100%" viewBox="0 0 500 36" preserveAspectRatio="none">
  <defs>
    <linearGradient id="r1-l" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${primaryColor}"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect x="0" y="4" width="4" height="22" rx="2" fill="${primaryColor}"/>
  ${showTitle ? `<text x="16" y="22" fill="${primaryColor}" font-size="15" letter-spacing="2" font-weight="bold">${title}</text>` : ''}
  <line x1="16" y1="32" x2="500" y2="32" stroke="url(#r1-l)" stroke-width="1.5"/>
</svg>`;
}

// ===================== R2: 双箭头标题 =====================
function renderChevron(ctx: RenderContext): string {
  const { primaryColor, title, showTitle } = ctx;
  return `<svg width="100%" height="100%" viewBox="0 0 500 32" preserveAspectRatio="none">
  <polyline stroke="${primaryColor}" stroke-width="3" fill="none" points="168,1 178,16 168,31"/>
  <polyline stroke="${primaryColor}" stroke-width="1.5" fill="none" opacity="0.5" points="160,1 170,16 160,31"/>
  <polyline stroke="${primaryColor}" stroke-width="3" fill="none" points="332,1 322,16 332,31"/>
  <polyline stroke="${primaryColor}" stroke-width="1.5" fill="none" opacity="0.5" points="340,1 330,16 340,31"/>
  ${showTitle ? `<text x="250" y="21" text-anchor="middle" fill="${primaryColor}" font-size="14" letter-spacing="3">${title}</text>` : ''}
</svg>`;
}

// ===================== R3: 斜切标题栏 =====================
function renderSlash(ctx: RenderContext): string {
  const { primaryColor, title, showTitle } = ctx;
  return `<svg width="100%" height="100%" viewBox="0 0 500 36" preserveAspectRatio="none">
  <defs>
    <linearGradient id="r3-l" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${primaryColor}"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <polyline fill="none" stroke="${primaryColor}" stroke-width="1.5" points="0,2 24,18"/>
  <polyline fill="none" stroke="${primaryColor}" stroke-width="1.5" points="16,2 40,18 500,18"/>
  ${showTitle ? `<text x="52" y="16" fill="${primaryColor}" font-size="13" letter-spacing="2">${title}</text>` : ''}
  <line x1="0" y1="33" x2="180" y2="33" stroke="url(#r3-l)" stroke-width="2.5"/>
</svg>`;
}

// ===================== R4: 梯形标签 =====================
function renderTrapezoid(ctx: RenderContext): string {
  const { primaryColor, title, showTitle } = ctx;
  return `<svg width="100%" height="100%" viewBox="0 0 500 38" preserveAspectRatio="none">
  <defs>
    <linearGradient id="r4-bg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#0a3858"/>
      <stop offset="100%" stop-color="#0e5a8a"/>
    </linearGradient>
    <linearGradient id="r4-l" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <polygon points="0,6 140,6 155,32 0,32" fill="url(#r4-bg)"/>
  <polyline fill="none" stroke="${primaryColor}" stroke-width="1" opacity="0.6" points="0,6 140,6 155,32"/>
  ${showTitle ? `<text x="12" y="24" fill="${primaryColor}" font-size="14" letter-spacing="2">${title}</text>` : ''}
  <line x1="160" y1="14" x2="500" y2="14" stroke="url(#r4-l)" stroke-width="0.6"/>
  <line x1="155" y1="32" x2="500" y2="32" stroke="url(#r4-l)" stroke-width="1.5"/>
  <polygon points="162,32 167,27 172,32 167,37" fill="${primaryColor}" opacity="0.5"/>
</svg>`;
}

// ===================== R5: 光柱标题 =====================
function renderGlowBeam(ctx: RenderContext): string {
  const { primaryColor, title, showTitle } = ctx;
  return `<svg width="100%" height="100%" viewBox="0 0 500 32" preserveAspectRatio="none">
  <defs>
    <linearGradient id="r5-b" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0.9"/>
      <stop offset="30%" stop-color="${primaryColor}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="r5-line" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0"/>
    </linearGradient>
    <filter id="r5-g"><feGaussianBlur stdDeviation="4"/></filter>
  </defs>
  <rect x="0" y="6" width="320" height="20" fill="url(#r5-b)" filter="url(#r5-g)"/>
  <rect x="0" y="10" width="280" height="12" fill="url(#r5-b)" rx="1"/>
  <line x1="0" y1="8" x2="450" y2="8" stroke="url(#r5-line)" stroke-width="0.7"/>
  <line x1="0" y1="24" x2="450" y2="24" stroke="url(#r5-line)" stroke-width="0.7"/>
  <rect x="0" y="5" width="3" height="22" fill="${primaryColor}" rx="1"/>
  ${showTitle ? `<text x="16" y="22" fill="${primaryColor}" font-size="13" letter-spacing="2" font-weight="bold">${title}</text>` : ''}
</svg>`;
}

// ===================== R6: 凹陷弧线 =====================
function renderArcDip(ctx: RenderContext): string {
  const { primaryColor } = ctx;
  return `<svg width="100%" height="100%" viewBox="0 0 500 36" preserveAspectRatio="none">
  <defs>
    <linearGradient id="r6-f" x1="0.5" y1="0" x2="0.5" y2="1">
      <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#060e28" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="r6-h" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0"/>
      <stop offset="20%" stop-color="${primaryColor}" stop-opacity="0.35"/>
      <stop offset="80%" stop-color="${primaryColor}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <line x1="10" y1="4" x2="490" y2="4" stroke="url(#r6-h)" stroke-width="1"/>
  <path d="M10,4 L170,4 Q250,32 330,4 L490,4 L490,36 L10,36 Z" fill="url(#r6-f)"/>
  <path d="M170,4 Q250,32 330,4" fill="none" stroke="${primaryColor}" stroke-opacity="0.45" stroke-width="1.2"/>
  <circle cx="250" cy="20" r="1.5" fill="${primaryColor}" opacity="0.4"/>
</svg>`;
}

// ===================== R7: 电路装饰线 =====================
function renderCircuitLine(ctx: RenderContext): string {
  const { primaryColor, animated, animationSpeed } = ctx;
  const speed = animationSpeed;
  return `<svg width="100%" height="100%" viewBox="0 0 500 36" preserveAspectRatio="none">
  <defs>
    <filter id="r7-g"><feGaussianBlur stdDeviation="1.5"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <line x1="0" y1="11" x2="500" y2="11" stroke="${primaryColor}" stroke-opacity="0.1" stroke-width="0.5" stroke-dasharray="2,4"/>
  <line x1="0" y1="25" x2="500" y2="25" stroke="${primaryColor}" stroke-opacity="0.1" stroke-width="0.5" stroke-dasharray="2,4"/>
  <polyline points="0,18 35,18 48,7 90,7 100,18 170,18 183,29 230,29 243,18 330,18 343,7 385,7 395,18 465,18 500,18" fill="none" stroke="rgba(34,85,170,1)" stroke-width="1.2"/>
  <polyline points="0,18 35,18 48,7 90,7 100,18 170,18 183,29 230,29 243,18 330,18 343,7 385,7 395,18 465,18 500,18" fill="none" stroke="${primaryColor}" stroke-width="0.8" filter="url(#r7-g)" opacity="0.6"/>
  ${animated ? `<polyline points="0,18 35,18 48,7 90,7 100,18 170,18 183,29 230,29 243,18 330,18 343,7 385,7 395,18 465,18 500,18" fill="none" stroke="#00ffff" stroke-width="1.5" filter="url(#r7-g)" stroke-dasharray="0 300 0 300">
    <animate attributeName="stroke-dasharray" values="0,300,0,300;0,0,600,0" dur="${speed}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines="0.4,1,0.49,0.98"/>
  </polyline>` : ''}
  <g fill="${primaryColor}"><circle cx="48" cy="7" r="2"/><circle cx="100" cy="18" r="2"/><circle cx="183" cy="29" r="2"/><circle cx="243" cy="18" r="2"/><circle cx="343" cy="7" r="2"/><circle cx="395" cy="18" r="2"/></g>
</svg>`;
}

// ===================== R8: 折线流光 =====================
function renderZigzagFlow(ctx: RenderContext): string {
  const { primaryColor, animated, animationSpeed } = ctx;
  const speed = animationSpeed;
  return `<svg width="100%" height="100%" viewBox="0 0 500 32" preserveAspectRatio="none">
  <defs><filter id="r9-g"><feGaussianBlur stdDeviation="1"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
  <polyline fill="none" stroke="rgba(26,92,122,1)" stroke-width="2" points="0,6 90,6 100,13 125,13 135,22 365,22 375,13 400,13 410,6 500,6"/>
  <polyline fill="none" stroke="${primaryColor}" stroke-opacity="0.2" stroke-width="1.5" points="150,29 350,29"/>
  ${animated ? `<polyline fill="none" stroke="${primaryColor}" stroke-width="2" filter="url(#r9-g)" points="0,6 90,6 100,13 125,13 135,22 365,22 375,13 400,13 410,6 500,6" stroke-dasharray="0 260 0 260">
    <animate attributeName="stroke-dasharray" values="0,260,0,260;0,0,520,0" dur="${speed}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines="0.4,1,0.49,0.98"/>
  </polyline>` : `<polyline fill="none" stroke="${primaryColor}" stroke-width="2" filter="url(#r9-g)" points="0,6 90,6 100,13 125,13 135,22 365,22 375,13 400,13 410,6 500,6"/>`}
</svg>`;
}

// ===================== R10: 闪烁点阵 =====================
function renderSparkleDots(ctx: RenderContext): string {
  const { primaryColor, animated } = ctx;
  const id = 'r10';
  // 嵌入 JS 渲染闪烁点阵
  return `<div style="width:100%;height:100%;position:relative;overflow:hidden">
  <svg width="100%" height="100%" viewBox="0 0 500 26" preserveAspectRatio="none" id="${id}-svg"></svg>
</div>
<script>
(function(){
  var svg=document.getElementById('${id}-svg');
  if(!svg||svg.dataset.rendered)return;
  svg.dataset.rendered='1';
  var ns='http://www.w3.org/2000/svg';
  var cols=46,rows=2,g=10.5,sz=2.5,ox=4,oy=6,c1='${primaryColor}',c2='rgba(0,194,255,0.15)';
  for(var r=0;r<rows;r++)for(var c=0;c<cols;c++){
    var rc=document.createElementNS(ns,'rect');
    rc.setAttribute('x',ox+c*g);rc.setAttribute('y',oy+r*g);
    rc.setAttribute('width',sz);rc.setAttribute('height',sz);
    rc.setAttribute('fill',Math.random()>0.6?c1:c2);
    if(Math.random()>0.6 && ${animated}){
      var a=document.createElementNS(ns,'animate');
      a.setAttribute('attributeName','fill');
      a.setAttribute('values',c2+';'+c1+';'+c2);
      a.setAttribute('dur',(1+Math.random()*2).toFixed(1)+'s');
      a.setAttribute('begin',(Math.random()*2).toFixed(1)+'s');
      a.setAttribute('repeatCount','indefinite');
      rc.appendChild(a);
    }
    svg.appendChild(rc);
  }
})();
</script>`;
}

// ===================== R11: 三段递进 =====================
function renderTripleSegment(ctx: RenderContext): string {
  const { primaryColor, animated } = ctx;
  const id = 'r12';
  if (animated) {
    return `<svg width="100%" height="100%" viewBox="0 0 500 14" preserveAspectRatio="none">
  <defs><filter id="${id}-g"><feGaussianBlur stdDeviation="1"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
  <line x1="0" y1="7" x2="500" y2="7" stroke="${primaryColor}" stroke-opacity="0.15" stroke-width="2"/>
  <line x1="4" y1="7" x2="96" y2="7" stroke="${primaryColor}" stroke-width="2" stroke-dasharray="0 100" filter="url(#${id}-g)"><animate id="${id}a" attributeName="stroke-dasharray" values="0,100;100,0" dur="0.6s" begin="0s;${id}g.end" fill="freeze"/></line>
  <line x1="104" y1="7" x2="396" y2="7" stroke="${primaryColor}" stroke-width="2" stroke-dasharray="0 300" filter="url(#${id}-g)"><animate id="${id}c" attributeName="stroke-dasharray" values="0,300;300,0" dur="1s" begin="${id}b.end+0.2s" fill="freeze"/></line>
  <line x1="404" y1="7" x2="496" y2="7" stroke="${primaryColor}" stroke-width="2" stroke-dasharray="0 100" filter="url(#${id}-g)"><animate id="${id}e" attributeName="stroke-dasharray" values="0,100;100,0" dur="0.6s" begin="${id}d.end+0.2s" fill="freeze"/></line>
  <circle cx="2" cy="7" r="2.5" fill="${primaryColor}" opacity="0.25"><animate id="${id}z" attributeName="fill" values="${primaryColor};${primaryColor}ff" dur="0.15s" begin="0s;${id}g.end" fill="freeze"/></circle>
  <circle cx="100" cy="7" r="2.5" fill="${primaryColor}" opacity="0.25"><animate id="${id}b" attributeName="fill" values="${primaryColor};${primaryColor}ff" dur="0.15s" begin="${id}a.end" fill="freeze"/></circle>
  <circle cx="400" cy="7" r="2.5" fill="${primaryColor}" opacity="0.25"><animate id="${id}d" attributeName="fill" values="${primaryColor};${primaryColor}ff" dur="0.15s" begin="${id}c.end" fill="freeze"/></circle>
  <circle cx="498" cy="7" r="2.5" fill="${primaryColor}" opacity="0.25"><animate id="${id}f" attributeName="fill" values="${primaryColor};${primaryColor}ff" dur="0.15s" begin="${id}e.end" fill="freeze"/><animate id="${id}g" attributeName="fill" values="${primaryColor}ff;${primaryColor}" dur="1.2s" begin="${id}f.end+0.8s" fill="freeze"/></circle>
</svg>`;
  }
  return `<svg width="100%" height="100%" viewBox="0 0 500 14" preserveAspectRatio="none">
  <defs><filter id="${id}-g"><feGaussianBlur stdDeviation="1"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
  <line x1="0" y1="7" x2="500" y2="7" stroke="${primaryColor}" stroke-opacity="0.15" stroke-width="2"/>
  <line x1="4" y1="7" x2="96" y2="7" stroke="${primaryColor}" stroke-width="2" filter="url(#${id}-g)"/>
  <line x1="104" y1="7" x2="396" y2="7" stroke="${primaryColor}" stroke-width="2" filter="url(#${id}-g)"/>
  <line x1="404" y1="7" x2="496" y2="7" stroke="${primaryColor}" stroke-width="2" filter="url(#${id}-g)"/>
  <circle cx="2" cy="7" r="2.5" fill="${primaryColor}" opacity="0.25"/>
  <circle cx="100" cy="7" r="2.5" fill="${primaryColor}" opacity="0.25"/>
  <circle cx="400" cy="7" r="2.5" fill="${primaryColor}" opacity="0.25"/>
  <circle cx="498" cy="7" r="2.5" fill="${primaryColor}" opacity="0.25"/>
</svg>`;
}

// ===================== R13: 角标标题框 =====================
function renderCornerMark(): string {
  // 纯装饰无文字
  return `<svg width="100%" height="100%" viewBox="0 0 500 36" preserveAspectRatio="none">
  <defs>
    <linearGradient id="r13-h" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="currentColor" stop-opacity="0.5"/>
      <stop offset="50%" stop-color="currentColor" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="currentColor" stop-opacity="0.5"/>
    </linearGradient>
  </defs>
  <polyline points="0,10 0,0 14,0" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <polyline points="486,0 500,0 500,10" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <polyline points="0,26 0,36 14,36" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <polyline points="486,36 500,36 500,26" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <line x1="18" y1="0" x2="482" y2="0" stroke="url(#r13-h)" stroke-width="0.5"/>
  <line x1="18" y1="36" x2="482" y2="36" stroke="url(#r13-h)" stroke-width="0.5"/>
  <rect x="1" y="1" width="498" height="34" fill="currentColor" opacity="0.015" rx="1"/>
</svg>`;
}

// ===================== R14: 居中渐隐线 =====================
function renderCenterFade(): string {
  // 纯装饰无文字
  return `<svg width="100%" height="100%" viewBox="0 0 500 16" preserveAspectRatio="none">
  <defs>
    <linearGradient id="r14-l" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="currentColor" stop-opacity="0"/>
      <stop offset="40%" stop-color="currentColor" stop-opacity="0.7"/>
      <stop offset="50%" stop-color="currentColor" stop-opacity="1"/>
      <stop offset="60%" stop-color="currentColor" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <line x1="20" y1="8" x2="480" y2="8" stroke="url(#r14-l)" stroke-width="1"/>
  <polygon points="250,8 255,2 260,8 255,14" fill="currentColor" opacity="0.8"/>
  <polygon points="250,8 253,4 256,8 253,12" fill="#fff" opacity="0.3"/>
</svg>`;
}

// ===================== 统一入口 =====================
export function renderSectionTitle(
  variant: string,
  _props: Props,
  ctx: RenderContext,
): string {
  switch (variant) {
    case 'bar':           return renderBar(ctx);
    case 'chevron':       return renderChevron(ctx);
    case 'slash':         return renderSlash(ctx);
    case 'trapezoid':     return renderTrapezoid(ctx);
    case 'glow-beam':     return renderGlowBeam(ctx);
    case 'arc-dip':       return renderArcDip(ctx);
    case 'circuit-line':  return renderCircuitLine(ctx);
    case 'zigzag-flow':   return renderZigzagFlow(ctx);
    case 'sparkle-dots':  return renderSparkleDots(ctx);
    case 'triple-segment':return renderTripleSegment(ctx);
    case 'corner-mark':   return renderCornerMark();
    case 'center-fade':    return renderCenterFade();
    default:              return renderBar(ctx);
  }
}
