/**
 * 区域标题栏变体渲染
 *
 * 从 decoration-preview-v3.html 中提取区域标题变体（竖条 / 双箭头已移除）
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

// ===================== S1: 左缘高光条 + 标题下短渐变线 + 右侧淡出线（对齐 HTML .s1） =====================
function renderLineBar1(ctx: RenderContext): string {
  const { primaryColor, secondaryColor, title, showTitle } = ctx;
  const tc = secondaryColor || primaryColor;
  return `<svg width="100%" height="100%" viewBox="0 0 500 36" preserveAspectRatio="none">
  <defs>
    <linearGradient id="lb1-accent" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${tc}"/>
      <stop offset="55%" stop-color="${primaryColor}"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0.25"/>
    </linearGradient>
    <linearGradient id="lb1-underline" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${primaryColor}"/>
      <stop offset="70%" stop-color="${primaryColor}" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="lb1-trail" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0.18"/>
      <stop offset="92%" stop-color="${primaryColor}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0"/>
    </linearGradient>
    <filter id="lb1-g"><feGaussianBlur stdDeviation="2.5"/></filter>
  </defs>
  <rect x="0" y="7" width="3" height="22" rx="1" fill="url(#lb1-accent)" filter="url(#lb1-g)"/>
  ${showTitle ? `<text x="16" y="15" fill="${tc}" font-size="14" letter-spacing="2" font-weight="bold">${title}</text>` : ''}
  <line x1="16" y1="22" x2="220" y2="22" stroke="url(#lb1-underline)" stroke-width="2" stroke-linecap="round"/>
  <line x1="268" y1="18" x2="498" y2="18" stroke="url(#lb1-trail)" stroke-width="1"/>
</svg>`;
}

// ===================== S2: 斜切填充标签（135° 渐变 + 仅顶/左边线 + 底边渐隐 trail，对齐 HTML .s2） =====================
function renderLineBar2(ctx: RenderContext): string {
  const { primaryColor, secondaryColor, title, showTitle } = ctx;
  const tc = secondaryColor || primaryColor;
  const cut = 14;
  return `<svg width="100%" height="100%" viewBox="0 0 500 36" preserveAspectRatio="none">
  <defs>
    <linearGradient id="lb2-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0.08"/>
    </linearGradient>
    <linearGradient id="lb2-trail" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <path d="M0,2 L${500 - cut},2 L500,34 L0,34 Z" fill="url(#lb2-bg)"/>
  <path d="M0,2 L${500 - cut},2" stroke="${primaryColor}" stroke-width="1" stroke-opacity="0.6" fill="none"/>
  <path d="M0,2 L0,34" stroke="${primaryColor}" stroke-width="1" stroke-opacity="0.4" fill="none"/>
  <line x1="0" y1="34" x2="500" y2="34" stroke="url(#lb2-trail)" stroke-width="1"/>
  ${showTitle ? `<text x="18" y="23" fill="${tc}" font-size="14" letter-spacing="2" font-weight="bold">${title}</text>` : ''}
</svg>`;
}

// ===================== S3: 横线中点光晕（左段线 | 菱形 | 标题 | 右段线+尾菱形，对齐 HTML .s3 flex） =====================
function renderLineBar3(ctx: RenderContext): string {
  const { primaryColor, secondaryColor, title, showTitle } = ctx;
  const tc = secondaryColor || primaryColor;
  const y = 20;
  return `<svg width="100%" height="100%" viewBox="0 0 500 40" preserveAspectRatio="none">
  <defs>
    <linearGradient id="lb3-segL" gradientUnits="userSpaceOnUse" x1="0" y1="${y}" x2="205" y2="${y}">
      <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0.45"/>
    </linearGradient>
    <linearGradient id="lb3-segR" gradientUnits="userSpaceOnUse" x1="335" y1="${y}" x2="498" y2="${y}">
      <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0"/>
    </linearGradient>
    <filter id="lb3-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <line x1="0" y1="${y}" x2="205" y2="${y}" stroke="url(#lb3-segL)" stroke-width="1"/>
  <polygon points="215,${y} 220,${y - 5} 225,${y} 220,${y + 5}" fill="${primaryColor}" filter="url(#lb3-glow)"/>
  <polygon points="216.5,${y} 220,${y - 3.2} 223.5,${y} 220,${y + 3.2}" fill="${primaryColor}" opacity="0.85"/>
  ${showTitle ? `<text x="236" y="${y + 5}" fill="${tc}" font-size="14" letter-spacing="2" font-weight="bold">${title}</text>` : ''}
  <line x1="335" y1="${y}" x2="488" y2="${y}" stroke="url(#lb3-segR)" stroke-width="1"/>
  <polygon points="492,${y - 3.5} 497,${y} 492,${y + 3.5} 487,${y}" fill="${primaryColor}" opacity="0.9" filter="url(#lb3-glow)"/>
</svg>`;
}

// ===================== S4: 扫描线标签（rgba 底板 + 上下轨道线 + 2.8s 扫描，对齐 HTML .s4） =====================
function renderLineBar4(ctx: RenderContext): string {
  const { primaryColor, secondaryColor, title, showTitle, animated } = ctx;
  const tc = secondaryColor || primaryColor;
  const scanDur = animated ? '2.8s' : '0s';
  return `<svg width="100%" height="100%" viewBox="0 0 500 36" preserveAspectRatio="none">
  <defs>
    <linearGradient id="lb4-track" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0.6"/>
      <stop offset="20%" stop-color="${primaryColor}" stop-opacity="0.2"/>
      <stop offset="80%" stop-color="${primaryColor}" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0.6"/>
    </linearGradient>
    <linearGradient id="lb4-scan" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0"/>
      <stop offset="40%" stop-color="${primaryColor}" stop-opacity="0.9"/>
      <stop offset="60%" stop-color="${primaryColor}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0"/>
    </linearGradient>
    <filter id="lb4-scan-f"><feGaussianBlur stdDeviation="1.2"/></filter>
  </defs>
  <rect x="8" y="8" width="484" height="20" rx="1" fill="rgba(0,30,60,0.45)"/>
  <rect x="8" y="8" width="484" height="20" rx="1" fill="none" stroke="${primaryColor}" stroke-opacity="0.2" stroke-width="1"/>
  <line x1="8" y1="11" x2="492" y2="11" stroke="url(#lb4-track)" stroke-width="1" opacity="0.5"/>
  <line x1="8" y1="25" x2="492" y2="25" stroke="url(#lb4-track)" stroke-width="1" opacity="0.5"/>
  ${animated ? `<rect x="8" y="8" width="2" height="20" fill="url(#lb4-scan)" opacity="0.25" filter="url(#lb4-scan-f)">
    <animate attributeName="x" values="8;490;8" dur="${scanDur}" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.8;1" keySplines="0.4,0;0.2,1;0.4,0"/>
    <animate attributeName="opacity" values="0.3;0.3;0" dur="${scanDur}" repeatCount="indefinite" keyTimes="0;0.8;1"/>
  </rect>` : ''}
  ${showTitle ? `<text x="250" y="23" text-anchor="middle" fill="${tc}" font-size="13" letter-spacing="3" font-weight="bold">${title}</text>` : ''}
</svg>`;
}

// ===================== S5: 左实右透通栏渐变 + 斜切右缘 + 顶内高光 + 投影（对齐 HTML .s5__bar） =====================
function renderLineBar5(ctx: RenderContext): string {
  const { primaryColor, secondaryColor, title, showTitle } = ctx;
  const glow = secondaryColor || primaryColor;
  return `<svg width="100%" height="100%" viewBox="0 0 500 40" preserveAspectRatio="none">
  <defs>
    <linearGradient id="lb5-bg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="rgb(0,72,120)" stop-opacity="0.65"/>
      <stop offset="38%" stop-color="rgb(0,140,200)" stop-opacity="0.22"/>
      <stop offset="72%" stop-color="${primaryColor}" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="lb5-inset" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#7fdbff" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="#7fdbff" stop-opacity="0"/>
    </linearGradient>
    <filter id="lb5-drop" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="rgb(0,40,80)" flood-opacity="0.25"/>
    </filter>
    <filter id="lb5-txt" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="${glow}" flood-opacity="0.35"/>
    </filter>
  </defs>
  <path d="M0,2 L${500 - 18},2 L500,38 L0,38 Z" fill="url(#lb5-bg)" filter="url(#lb5-drop)"/>
  <path d="M1,3 L${500 - 19},3" stroke="url(#lb5-inset)" stroke-width="1" fill="none"/>
  <path d="M0,2 L${500 - 18},2" stroke="${primaryColor}" stroke-width="2" stroke-opacity="0.55" fill="none"/>
  <path d="M0,2 L0,38" stroke="${primaryColor}" stroke-width="2" stroke-opacity="0.55" fill="none"/>
  ${showTitle ? `<text x="14" y="25" fill="#f0f9ff" font-size="14" letter-spacing="2" font-weight="bold" filter="url(#lb5-txt)">${title}</text>` : ''}
</svg>`;
}

// ===================== S6: 标题 + 渐变轨 + 末端三角（线从标题右侧起，对齐 HTML .s6） =====================
function renderLineBar6(ctx: RenderContext): string {
  const { primaryColor, secondaryColor, title, showTitle } = ctx;
  const tc = secondaryColor || primaryColor;
  const tw = showTitle ? Math.min(24 + title.length * 13, 220) : 0;
  const x0 = tw + 12;
  return `<svg width="100%" height="100%" viewBox="0 0 500 34" preserveAspectRatio="none">
  <defs>
    <linearGradient id="lb6-line" gradientUnits="userSpaceOnUse" x1="${x0}" y1="17" x2="470" y2="17">
      <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0.45"/>
      <stop offset="45%" stop-color="${primaryColor}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0.08"/>
    </linearGradient>
    <linearGradient id="lb6-tail" gradientUnits="userSpaceOnUse" x1="442" y1="17" x2="470" y2="17">
      <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0"/>
    </linearGradient>
    <filter id="lb6-g"><feGaussianBlur stdDeviation="2"/></filter>
  </defs>
  ${showTitle ? `<text x="0" y="22" fill="${tc}" font-size="14" letter-spacing="2" font-weight="bold">${title}</text>` : ''}
  <line x1="${x0}" y1="17" x2="442" y2="17" stroke="url(#lb6-line)" stroke-width="1"/>
  <line x1="442" y1="17" x2="470" y2="17" stroke="url(#lb6-tail)" stroke-width="1"/>
  <polygon points="473,13 480,17 473,21" fill="${primaryColor}" stroke="${primaryColor}" stroke-opacity="0.45" stroke-width="0.5" opacity="0.85" filter="url(#lb6-g)"/>
</svg>`;
}

// ===================== S8: 「//」前缀 + 标题 + 底细线（对齐 HTML .s8 顺序与颜色） =====================
function renderLineBar8(ctx: RenderContext): string {
  const { primaryColor, secondaryColor, title, showTitle } = ctx;
  const tc = secondaryColor || primaryColor;
  const tx = 26;
  return `<svg width="100%" height="100%" viewBox="0 0 500 34" preserveAspectRatio="none">
  <defs>
    <linearGradient id="lb8-trail" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0.18"/>
      <stop offset="88%" stop-color="${primaryColor}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <text x="0" y="21" fill="${tc}" font-size="13" font-family="ui-monospace,Consolas,monospace" opacity="0.45">//</text>
  ${showTitle ? `<text x="${tx}" y="21" fill="${tc}" font-size="14" letter-spacing="2" font-weight="bold">${title}</text>` : ''}
  <line x1="${tx}" y1="27" x2="498" y2="27" stroke="url(#lb8-trail)" stroke-width="1"/>
  <rect x="494" y="19.5" width="3" height="3" fill="${primaryColor}" opacity="0.65" rx="0.5"/>
</svg>`;
}

// ===================== S9: 三点节奏 + 渐隐线 =====================
function renderLineBar9(ctx: RenderContext): string {
  const { primaryColor, title, showTitle } = ctx;
  return `<svg width="100%" height="100%" viewBox="0 0 500 34" preserveAspectRatio="none">
  <defs>
    <linearGradient id="lb9-line" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0.45"/>
      <stop offset="72%" stop-color="${primaryColor}" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0"/>
    </linearGradient>
    <filter id="lb9-g"><feGaussianBlur stdDeviation="2"/></filter>
  </defs>
  <circle cx="6" cy="17" r="3.5" fill="${primaryColor}" opacity="0.3" filter="url(#lb9-g)"/>
  <circle cx="19" cy="17" r="3.5" fill="${primaryColor}" opacity="0.5" filter="url(#lb9-g)"/>
  <circle cx="32" cy="17" r="3.5" fill="${primaryColor}" opacity="0.8"/>
  ${showTitle ? `<text x="46" y="22" fill="${primaryColor}" font-size="14" letter-spacing="2" font-weight="bold">${title}</text>` : ''}
  <line x1="46" y1="28" x2="500" y2="28" stroke="url(#lb9-line)" stroke-width="1.2"/>
</svg>`;
}

// ===================== S10: 半透明竖渐变 + 底部整条青线发光 =====================
function renderLineBar10(ctx: RenderContext): string {
  const { primaryColor, title, showTitle } = ctx;
  return `<svg width="100%" height="100%" viewBox="0 0 500 38" preserveAspectRatio="none">
  <defs>
    <linearGradient id="lb10-panel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0.42"/>
      <stop offset="55%" stop-color="${primaryColor}" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0.2"/>
    </linearGradient>
    <linearGradient id="lb10-glow" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0"/>
      <stop offset="18%" stop-color="${primaryColor}" stop-opacity="0.35"/>
      <stop offset="48%" stop-color="${primaryColor}" stop-opacity="1"/>
      <stop offset="52%" stop-color="${primaryColor}" stop-opacity="1"/>
      <stop offset="82%" stop-color="${primaryColor}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0"/>
    </linearGradient>
    <filter id="lb10-fg"><feGaussianBlur stdDeviation="4"/></filter>
  </defs>
  <rect x="0" y="0" width="500" height="32" rx="2" fill="url(#lb10-panel)"/>
  <rect x="0" y="0" width="500" height="32" rx="2" fill="none" stroke="${primaryColor}" stroke-opacity="0.14" stroke-width="1"/>
  ${showTitle ? `<text x="16" y="22" fill="${primaryColor}" font-size="14" letter-spacing="2" font-weight="bold">${title}</text>` : ''}
  <rect x="0" y="33" width="500" height="2" fill="url(#lb10-glow)" filter="url(#lb10-fg)" opacity="0.8"/>
  <rect x="0" y="33" width="500" height="2" fill="${primaryColor}" opacity="0.6"/>
</svg>`;
}

// ===================== S11: 渐变背景梯形 =====================
function renderLineBar11(ctx: RenderContext): string {
  const { primaryColor, title, showTitle } = ctx;
  return `<svg width="100%" height="100%" viewBox="0 0 500 38" preserveAspectRatio="none">
  <defs>
    <linearGradient id="lb11-bg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0.1"/>
    </linearGradient>
    <linearGradient id="lb11-trail" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <path d="M0,4 L${500 - 16},4 L500,34 L0,34 Z" fill="url(#lb11-bg)"/>
  <path d="M0,4 L${500 - 16},4 L500,34" fill="none" stroke="${primaryColor}" stroke-opacity="0.55" stroke-width="1"/>
  ${showTitle ? `<text x="16" y="24" fill="${primaryColor}" font-size="14" letter-spacing="2" font-weight="bold">${title}</text>` : ''}
  <line x1="16" y1="34" x2="500" y2="34" stroke="url(#lb11-trail)" stroke-width="1.5"/>
</svg>`;
}

// ===================== S12: 居中标题 + 左实线(--c-line) + 右渐变(dim→透明) + 两侧 45° 角标（对齐 HTML .s12） =====================
function renderLineBar12(ctx: RenderContext): string {
  const { primaryColor, secondaryColor, title, showTitle } = ctx;
  const tc = secondaryColor || primaryColor;
  const y = 19;
  return `<svg width="100%" height="100%" viewBox="0 0 500 38" preserveAspectRatio="none">
  <defs>
    <linearGradient id="lb12-r" gradientUnits="userSpaceOnUse" x1="292" y1="${y}" x2="500" y2="${y}">
      <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0.45"/>
      <stop offset="60%" stop-color="${primaryColor}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0.18"/>
    </linearGradient>
  </defs>
  <line x1="0" y1="${y}" x2="206" y2="${y}" stroke="${primaryColor}" stroke-opacity="0.18" stroke-width="1"/>
  <path d="M 206 ${y - 3} L 211 ${y - 3} L 211 ${y + 2}" fill="none" stroke="${primaryColor}" stroke-width="1"/>
  ${showTitle ? `<text x="250" y="${y + 5}" text-anchor="middle" fill="${tc}" font-size="13" letter-spacing="3" font-weight="bold">${title}</text>` : ''}
  <path d="M 289 ${y - 3} L 289 ${y + 2} L 294 ${y + 2}" fill="none" stroke="${primaryColor}" stroke-width="1"/>
  <line x1="294" y1="${y}" x2="500" y2="${y}" stroke="url(#lb12-r)" stroke-width="1"/>
</svg>`;
}

// ===================== S13: 半透明渐变条 + 左上 / 右下 L 角标 =====================
function renderLineBar13(ctx: RenderContext): string {
  const { primaryColor, title, showTitle } = ctx;
  return `<svg width="100%" height="100%" viewBox="0 0 500 36" preserveAspectRatio="none">
  <defs>
    <linearGradient id="lb13-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0.4"/>
      <stop offset="55%" stop-color="${primaryColor}" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0.12"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="500" height="36" rx="1" fill="url(#lb13-bg)"/>
  <rect x="0" y="0" width="500" height="36" rx="1" fill="none" stroke="${primaryColor}" stroke-opacity="0.12" stroke-width="1"/>
  <path d="M0,0 L20,0" stroke="${primaryColor}" stroke-opacity="0.45" stroke-width="2" fill="none"/>
  <path d="M0,0 L0,20" stroke="${primaryColor}" stroke-opacity="0.45" stroke-width="2" fill="none"/>
  <path d="M480,36 L500,36" stroke="${primaryColor}" stroke-opacity="0.45" stroke-width="2" fill="none"/>
  <path d="M500,36 L500,16" stroke="${primaryColor}" stroke-opacity="0.45" stroke-width="2" fill="none"/>
  ${showTitle ? `<text x="14" y="24" fill="${primaryColor}" font-size="14" letter-spacing="2" font-weight="bold">${title}</text>` : ''}
</svg>`;
}

// ===================== S14: 平行四边形渐变条 + 右侧三道斜线 =====================
function renderLineBar14(ctx: RenderContext): string {
  const { primaryColor, title, showTitle } = ctx;
  return `<svg width="100%" height="100%" viewBox="0 0 500 40" preserveAspectRatio="none">
  <defs>
    <linearGradient id="lb14-skew" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0.45"/>
      <stop offset="70%" stop-color="${primaryColor}" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <polygon points="6,2 490,2 494,38 8,38" fill="url(#lb14-skew)"/>
  <line x1="6" y1="2" x2="8" y2="38" stroke="${primaryColor}" stroke-opacity="0.5" stroke-width="2"/>
  ${showTitle ? `<text x="22" y="25" fill="#eaf8ff" font-size="14" letter-spacing="2" font-weight="bold">${title}</text>` : ''}
  <line x1="455" y1="2" x2="458" y2="38" stroke="${primaryColor}" stroke-opacity="0.55" stroke-width="3"/>
  <line x1="467" y1="2" x2="470" y2="38" stroke="${primaryColor}" stroke-opacity="0.4" stroke-width="3"/>
  <line x1="479" y1="2" x2="482" y2="38" stroke="${primaryColor}" stroke-opacity="0.25" stroke-width="3"/>
</svg>`;
}

// ===================== S15: 中间亮、两侧暗（对齐 HTML .s15 多段 rgba） =====================
function renderLineBar15(ctx: RenderContext): string {
  const { primaryColor, secondaryColor, title, showTitle } = ctx;
  const tc = secondaryColor || primaryColor;
  return `<svg width="100%" height="100%" viewBox="0 0 500 36" preserveAspectRatio="none">
  <defs>
    <linearGradient id="lb15-bg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="rgb(0,30,60)" stop-opacity="0.35"/>
      <stop offset="42%" stop-color="rgb(0,100,160)" stop-opacity="0.35"/>
      <stop offset="58%" stop-color="rgb(0,100,160)" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="rgb(0,30,60)" stop-opacity="0.2"/>
    </linearGradient>
    <filter id="lb15-tg" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="${primaryColor}" flood-opacity="0.25"/>
    </filter>
  </defs>
  <rect x="0" y="0" width="500" height="36" rx="2" fill="url(#lb15-bg)"/>
  <rect x="0" y="0" width="500" height="36" rx="2" fill="none" stroke="${primaryColor}" stroke-opacity="0.1" stroke-width="1"/>
  ${showTitle ? `<text x="250" y="24" text-anchor="middle" fill="${tc}" font-size="14" letter-spacing="3" font-weight="bold" filter="url(#lb15-tg)">${title}</text>` : ''}
</svg>`;
}

// ===================== S16: 小方标 + 渐变带底板 + 顶边线 + 标题（对齐 HTML .s16） =====================
function renderLineBar16(ctx: RenderContext): string {
  const { primaryColor, secondaryColor, title, showTitle } = ctx;
  const tc = secondaryColor || primaryColor;
  return `<svg width="100%" height="100%" viewBox="0 0 500 38" preserveAspectRatio="none">
  <defs>
    <linearGradient id="lb16-band" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="rgb(0,80,130)" stop-opacity="0.5"/>
      <stop offset="40%" stop-color="rgb(0,120,170)" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0"/>
    </linearGradient>
    <filter id="lb16-ig" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="2" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect x="0" y="14" width="10" height="10" rx="1" fill="${primaryColor}" filter="url(#lb16-ig)"/>
  <rect x="0" y="14" width="10" height="10" rx="1" fill="${primaryColor}" opacity="0.95"/>
  <rect x="18" y="8" width="482" height="22" fill="url(#lb16-band)"/>
  <line x1="18" y1="8" x2="500" y2="8" stroke="${primaryColor}" stroke-opacity="0.25" stroke-width="1"/>
  ${showTitle ? `<text x="26" y="23" fill="${tc}" font-size="14" letter-spacing="2" font-weight="bold">${title}</text>` : ''}
</svg>`;
}

// ===================== S17: 斜纹叠层 + 半透明底 =====================
function renderLineBar17(ctx: RenderContext): string {
  const { primaryColor, title, showTitle } = ctx;
  return `<svg width="100%" height="100%" viewBox="0 0 500 36" preserveAspectRatio="none">
  <defs>
    <linearGradient id="lb17-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0.25"/>
    </linearGradient>
    <pattern id="lb17-stripes" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-55)">
      <rect width="8" height="8" fill="transparent"/>
      <line x1="0" y1="0" x2="0" y2="8" stroke="${primaryColor}" stroke-opacity="0.12" stroke-width="1"/>
    </pattern>
  </defs>
  <rect x="0" y="0" width="500" height="36" rx="2" fill="url(#lb17-bg)"/>
  <rect x="0" y="0" width="500" height="36" rx="2" fill="url(#lb17-stripes)"/>
  <rect x="0" y="0" width="500" height="36" rx="2" fill="none" stroke="${primaryColor}" stroke-opacity="0.14" stroke-width="1"/>
  ${showTitle ? `<text x="14" y="24" fill="${primaryColor}" font-size="14" letter-spacing="2" font-weight="bold">${title}</text>` : ''}
</svg>`;
}

// ===================== 统一入口 =====================
export function renderSectionTitle(
  variant: string,
  _props: Props,
  ctx: RenderContext,
): string {
  switch (variant) {
    case 'line-bar-1':  return renderLineBar1(ctx);
    case 'line-bar-2':  return renderLineBar2(ctx);
    case 'line-bar-3':  return renderLineBar3(ctx);
    case 'line-bar-4':  return renderLineBar4(ctx);
    case 'line-bar-5':  return renderLineBar5(ctx);
    case 'line-bar-6':  return renderLineBar6(ctx);
    case 'line-bar-8':  return renderLineBar8(ctx);
    case 'line-bar-9':  return renderLineBar9(ctx);
    case 'line-bar-10': return renderLineBar10(ctx);
    case 'line-bar-11': return renderLineBar11(ctx);
    case 'line-bar-12': return renderLineBar12(ctx);
    case 'line-bar-13': return renderLineBar13(ctx);
    case 'line-bar-16': return renderLineBar16(ctx);
    case 'skew-bar':    return renderLineBar14(ctx);
    case 'center-band': return renderLineBar15(ctx);
    case 'stripe-overlay': return renderLineBar17(ctx);
    // 保留原有变体（trapezoid / glow-beam / arc-dip 等）
    case 'trapezoid':     return renderTrapezoid(ctx);
    case 'glow-beam':     return renderGlowBeam(ctx);
    case 'arc-dip':       return renderArcDip(ctx);
    case 'circuit-line':  return renderCircuitLine(ctx);
    case 'zigzag-flow':   return renderZigzagFlow(ctx);
    case 'sparkle-dots':  return renderSparkleDots(ctx);
    case 'triple-segment':return renderTripleSegment(ctx);
    case 'corner-mark':   return renderCornerMark();
    case 'center-fade':   return renderCenterFade();
    default:              return renderLineBar1(ctx);
  }
}
