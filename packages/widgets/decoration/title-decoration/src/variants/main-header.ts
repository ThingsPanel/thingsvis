/**
 * 大屏主标题变体渲染
 *
 * 从 decoration-preview-v3.html 中提取 M1-M10 变体实现
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

// ===================== M1: 顶部凸起标题框 =====================
function renderDiamondBar(ctx: RenderContext): string {
  const { primaryColor, glowColor, title, showTitle, animated, animationSpeed } = ctx;
  const speed = animationSpeed;
  return `<svg width="100%" height="100%" viewBox="0 0 900 60" preserveAspectRatio="none">
  <defs>
    <filter id="m1-glow"><feGaussianBlur stdDeviation="2"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <line x1="30" y1="48" x2="870" y2="48" stroke="${primaryColor}" stroke-opacity="0.25" stroke-width="1"/>
  <polygon points="350,48 370,8 530,8 550,48" fill="${primaryColor}" stroke-opacity="0.3" stroke-width="1" filter="url(#m1-glow)"/>
  <polygon points="360,44 376,14 524,14 540,44" fill="none" stroke="${primaryColor}" stroke-opacity="0.3" stroke-width="0.5"/>
  <polygon points="380,8 390,2 420,2 430,8" fill="${glowColor}" stroke-opacity="0.15" stroke-width="0.8"/>
  <polygon points="470,8 480,2 510,2 520,8" fill="${glowColor}" stroke-opacity="0.15" stroke-width="0.8"/>
  ${showTitle ? `<text x="450" y="35" text-anchor="middle" fill="${primaryColor}" font-size="18" letter-spacing="8" font-weight="bold">${title}</text>` : ''}
  <line x1="30" y1="48" x2="350" y2="48" stroke="${primaryColor}" stroke-width="1" filter="url(#m1-glow)"/>
  <line x1="870" y1="48" x2="550" y2="48" stroke="${primaryColor}" stroke-width="1" filter="url(#m1-glow)"/>
  ${animated ? `<polygon points="300,42 280,42 286,51 306,51" fill="${primaryColor}" filter="url(#m1-glow)"><animate attributeName="opacity" values="1;0.3;1" dur="${speed}s" repeatCount="indefinite"/></polygon>
  <polygon points="268,42 248,42 254,51 274,51" fill="${primaryColor}" opacity="0.5" filter="url(#m1-glow)"><animate attributeName="opacity" values="0.5;0.15;0.5" dur="${speed}s" repeatCount="indefinite"/></polygon>
  <polygon points="236,42 216,42 222,51 242,51" fill="${primaryColor}" opacity="0.25" filter="url(#m1-glow)"><animate attributeName="opacity" values="0.25;0.08;0.25" dur="${speed}s" repeatCount="indefinite"/></polygon>
  <polygon points="600,42 620,42 614,51 594,51" fill="${primaryColor}" filter="url(#m1-glow)"><animate attributeName="opacity" values="1;0.3;1" dur="${speed}s" repeatCount="indefinite"/></polygon>
  <polygon points="632,42 652,42 646,51 626,51" fill="${primaryColor}" opacity="0.5" filter="url(#m1-glow)"><animate attributeName="opacity" values="0.5;0.15;0.5" dur="${speed}s" repeatCount="indefinite"/></polygon>
  <polygon points="664,42 684,42 678,51 658,51" fill="${primaryColor}" opacity="0.25" filter="url(#m1-glow)"><animate attributeName="opacity" values="0.25;0.08;0.25" dur="${speed}s" repeatCount="indefinite"/></polygon>` : `<polygon points="300,42 280,42 286,51 306,51" fill="${primaryColor}" filter="url(#m1-glow)"/><polygon points="600,42 620,42 614,51 594,51" fill="${primaryColor}" filter="url(#m1-glow)"/>`}
  <circle cx="30" cy="48" r="2" fill="${primaryColor}"/>
  <circle cx="870" cy="48" r="2" fill="${primaryColor}"/>
</svg>`;
}

// ===================== M2: 简约科技主标题 =====================
function renderSleek(ctx: RenderContext): string {
  const { primaryColor, title, showTitle } = ctx;
  return `<svg width="100%" height="100%" viewBox="0 0 900 50" preserveAspectRatio="none">
  <defs>
    <linearGradient id="m2-g1" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0"/>
      <stop offset="50%" stop-color="${primaryColor}" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="m2-g2" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0"/>
      <stop offset="15%" stop-color="${primaryColor}" stop-opacity="0.4"/>
      <stop offset="85%" stop-color="${primaryColor}" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0"/>
    </linearGradient>
    <filter id="m2-glow"><feGaussianBlur stdDeviation="3"/></filter>
  </defs>
  <rect x="200" y="0" width="500" height="3" fill="url(#m2-g1)" filter="url(#m2-glow)"/>
  <polyline points="40,42 320,42 340,10" fill="none" stroke="${primaryColor}" stroke-width="1.5" opacity="0.6"/>
  <polyline points="40,46 340,46 360,14" fill="none" stroke="${primaryColor}" stroke-width="0.6" opacity="0.3"/>
  <polyline points="860,42 580,42 560,10" fill="none" stroke="${primaryColor}" stroke-width="1.5" opacity="0.6"/>
  <polyline points="860,46 560,46 540,14" fill="none" stroke="${primaryColor}" stroke-width="0.6" opacity="0.3"/>
  <line x1="350" y1="12" x2="550" y2="12" stroke="url(#m2-g2)" stroke-width="0.5"/>
  ${showTitle ? `<text x="450" y="36" text-anchor="middle" fill="${primaryColor}" font-size="20" letter-spacing="10" font-weight="bold">${title}</text>` : ''}
  <circle cx="40" cy="44" r="2" fill="${primaryColor}" opacity="0.5"/>
  <circle cx="860" cy="44" r="2" fill="${primaryColor}" opacity="0.5"/>
</svg>`;
}

// ===================== M3: 宝石冠形主标题 =====================
function renderDiamondCrown(ctx: RenderContext): string {
  const { primaryColor, glowColor, title, showTitle } = ctx;
  return `<svg width="100%" height="100%" viewBox="0 0 900 56" preserveAspectRatio="none">
  <defs>
    <filter id="m3-g"><feGaussianBlur stdDeviation="2"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <polygon fill="${primaryColor}" stroke-opacity="0.06" stroke-width="1" points="300,12 285,28 300,44 600,44 615,28 600,12"/>
  <polyline fill="none" stroke="${primaryColor}" stroke-opacity="0.4" points="305,18 293,28 305,38"/>
  <polyline fill="none" stroke="${primaryColor}" stroke-opacity="0.4" points="595,18 607,28 595,38"/>
  <polygon fill="${glowColor}" stroke-opacity="0.12" stroke-width="0.8" points="310,12 316,4 346,4 352,12"/>
  <polygon fill="${glowColor}" stroke-opacity="0.12" stroke-width="0.8" points="548,12 554,4 584,4 590,12"/>
  <polygon fill="${glowColor}" stroke-opacity="0.12" stroke-width="0.8" points="310,44 316,52 346,52 352,44"/>
  <polygon fill="${glowColor}" stroke-opacity="0.12" stroke-width="0.8" points="548,44 554,52 584,52 590,44"/>
  <polyline fill="none" stroke="${primaryColor}" stroke-width="1" opacity="0.5" points="295,28 100,28"/>
  <polyline fill="none" stroke="${primaryColor}" stroke-width="0.5" opacity="0.3" points="295,24 120,24"/>
  <polyline fill="none" stroke="${primaryColor}" stroke-width="0.5" opacity="0.3" points="295,32 120,32"/>
  <polygon fill="${primaryColor}" opacity="0.4" points="105,26 95,26 92,28 95,30 105,30"/>
  <polyline fill="none" stroke="${primaryColor}" stroke-width="1" opacity="0.5" points="605,28 800,28"/>
  <polyline fill="none" stroke="${primaryColor}" stroke-width="0.5" opacity="0.3" points="605,24 780,24"/>
  <polyline fill="none" stroke="${primaryColor}" stroke-width="0.5" opacity="0.3" points="605,32 780,32"/>
  <polygon fill="${primaryColor}" opacity="0.4" points="795,26 805,26 808,28 805,30 795,30"/>
  ${showTitle ? `<text x="450" y="33" text-anchor="middle" fill="${primaryColor}" font-size="17" letter-spacing="6" font-weight="bold">${title}</text>` : ''}
</svg>`;
}

// ===================== M4: 电路板主标题 =====================
function renderCircuit(ctx: RenderContext): string {
  const { primaryColor, title, showTitle, animated, animationSpeed } = ctx;
  const speed = animationSpeed;
  return `<svg width="100%" height="100%" viewBox="0 0 900 50" preserveAspectRatio="none">
  <defs>
    <filter id="m4-g"><feGaussianBlur stdDeviation="1.5"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <polyline fill="none" stroke="${primaryColor}" stroke-opacity="0.3" stroke-width="1.5" points="20,25 80,25 95,12 180,12 195,25 320,25"/>
  <polyline fill="none" stroke="${primaryColor}" stroke-opacity="0.2" stroke-width="1" points="20,38 100,38 115,25 200,25" opacity="0.5"/>
  <polyline fill="none" stroke="${primaryColor}" stroke-opacity="0.3" stroke-width="1.5" points="880,25 820,25 805,12 720,12 705,25 580,25"/>
  <polyline fill="none" stroke="${primaryColor}" stroke-opacity="0.2" stroke-width="1" points="880,38 800,38 785,25 700,25" opacity="0.5"/>
  <rect x="325" y="6" width="250" height="38" fill="${primaryColor}" stroke-opacity="0.04" stroke-width="1" rx="2"/>
  ${showTitle ? `<text x="450" y="30" text-anchor="middle" fill="${primaryColor}" font-size="16" letter-spacing="6">${title}</text>` : ''}
  <g fill="${primaryColor}" opacity="0.8"><circle cx="95" cy="12" r="2"/><circle cx="195" cy="25" r="2"/><circle cx="805" cy="12" r="2"/><circle cx="705" cy="25" r="2"/><circle cx="325" cy="25" r="2.5"/><circle cx="575" cy="25" r="2.5"/></g>
  ${animated ? `<polyline fill="none" stroke="#00ffff" stroke-width="2" filter="url(#m4-g)" stroke-dasharray="0 200 0 200" points="20,25 80,25 95,12 180,12 195,25 320,25"><animate attributeName="stroke-dasharray" values="0,200,0,200;0,0,400,0" dur="${speed}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines="0.4,1,0.49,0.98"/></polyline>
  <polyline fill="none" stroke="#00ffff" stroke-width="2" filter="url(#m4-g)" stroke-dasharray="0 200 0 200" points="880,25 820,25 805,12 720,12 705,25 580,25"><animate attributeName="stroke-dasharray" values="0,200,0,200;0,0,400,0" dur="${speed}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines="0.4,1,0.49,0.98"/></polyline>` : ''}
</svg>`;
}

// ===================== M5: 紫金极光渐变主标题 =====================
function renderAurora(ctx: RenderContext): string {
  const { primaryColor, secondaryColor, glowColor, title, showTitle, animated, animationSpeed } = ctx;
  const speed = animationSpeed;
  return `<svg width="100%" height="100%" viewBox="0 0 900 56" preserveAspectRatio="none">
  <defs>
    <linearGradient id="m5-bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0"/>
      <stop offset="15%" stop-color="${primaryColor}" stop-opacity="0.8"/>
      <stop offset="35%" stop-color="${secondaryColor}"/>
      <stop offset="50%" stop-color="${glowColor}"/>
      <stop offset="65%" stop-color="${secondaryColor}"/>
      <stop offset="85%" stop-color="${primaryColor}" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="m5-gold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#f9a825" stop-opacity="0"/>
      <stop offset="30%" stop-color="#f9a825" stop-opacity="0.6"/>
      <stop offset="50%" stop-color="#fdd835"/>
      <stop offset="70%" stop-color="#f9a825" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#f9a825" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="m5-glow" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${glowColor}" stop-opacity="0"/>
      <stop offset="50%" stop-color="${glowColor}" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="${glowColor}" stop-opacity="0"/>
    </linearGradient>
    <filter id="m5-f"><feGaussianBlur stdDeviation="3"/></filter>
    <filter id="m5-f2"><feGaussianBlur stdDeviation="6"/></filter>
  </defs>
  <rect x="100" y="20" width="700" height="28" fill="url(#m5-bar)" filter="url(#m5-f2)" opacity="0.5"/>
  <rect x="120" y="22" width="660" height="24" fill="url(#m5-bar)" rx="2"/>
  <line x1="180" y1="22" x2="720" y2="22" stroke="url(#m5-gold)" stroke-width="1.5"/>
  <line x1="200" y1="46" x2="700" y2="46" stroke="url(#m5-gold)" stroke-width="1"/>
  <polygon points="120,34 60,30 50,34 60,38" fill="${primaryColor}" opacity="0.4"/>
  <polygon points="780,34 840,30 850,34 840,38" fill="${primaryColor}" opacity="0.4"/>
  <line x1="50" y1="34" x2="120" y2="34" stroke="${primaryColor}" stroke-width="1" opacity="0.5"/>
  <line x1="780" y1="34" x2="850" y2="34" stroke="${primaryColor}" stroke-width="1" opacity="0.5"/>
  ${animated ? `<rect x="0" y="22" width="60" height="24" fill="url(#m5-glow)" opacity="0.3"><animate attributeName="x" values="100;780;100" dur="${speed}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.42,0,0.58,1;0.42,0,0.58,1"/></rect>` : ''}
  ${showTitle ? `<text x="450" y="40" text-anchor="middle" fill="${primaryColor}" font-size="18" letter-spacing="8" font-weight="bold">${title}</text>` : ''}
</svg>`;
}

// ===================== M6: 翼箭主标题 =====================
function renderWingArrow(ctx: RenderContext): string {
  const { primaryColor, glowColor, title, showTitle } = ctx;
  return `<svg width="100%" height="100%" viewBox="0 0 900 58" preserveAspectRatio="none">
  <defs>
    <linearGradient id="m6-bg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0"/>
      <stop offset="20%" stop-color="${primaryColor}" stop-opacity="0.3"/>
      <stop offset="50%" stop-color="${primaryColor}"/>
      <stop offset="80%" stop-color="${primaryColor}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="m6-line" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${glowColor}" stop-opacity="0"/>
      <stop offset="30%" stop-color="${glowColor}" stop-opacity="0.8"/>
      <stop offset="70%" stop-color="${glowColor}" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="${glowColor}" stop-opacity="0"/>
    </linearGradient>
    <filter id="m6-g"><feGaussianBlur stdDeviation="2"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect x="150" y="14" width="600" height="30" fill="url(#m6-bg)" rx="1"/>
  <line x1="100" y1="14" x2="800" y2="14" stroke="url(#m6-line)" stroke-width="1"/>
  <line x1="100" y1="44" x2="800" y2="44" stroke="url(#m6-line)" stroke-width="1.5"/>
  <polygon points="150,29 80,20 50,20 40,29 50,38 80,38" fill="${glowColor}" stroke-opacity="0.3" stroke-width="0.8"/>
  <polygon points="40,29 20,24 10,29 20,34" fill="none" stroke="${glowColor}" stroke-width="0.8" opacity="0.5"/>
  <polygon points="750,29 820,20 850,20 860,29 850,38 820,38" fill="${glowColor}" stroke-opacity="0.3" stroke-width="0.8"/>
  <polygon points="860,29 880,24 890,29 880,34" fill="none" stroke="${glowColor}" stroke-width="0.8" opacity="0.5"/>
  <line x1="200" y1="18" x2="260" y2="18" stroke="${glowColor}" stroke-width="0.5" opacity="0.4"/>
  <line x1="640" y1="18" x2="700" y2="18" stroke="${glowColor}" stroke-width="0.5" opacity="0.4"/>
  <rect x="196" y="12" width="4" height="4" fill="${glowColor}" opacity="0.6"/>
  <rect x="700" y="12" width="4" height="4" fill="${glowColor}" opacity="0.6"/>
  <rect x="196" y="42" width="4" height="4" fill="${glowColor}" opacity="0.6"/>
  <rect x="700" y="42" width="4" height="4" fill="${glowColor}" opacity="0.6"/>
  ${showTitle ? `<text x="450" y="35" text-anchor="middle" fill="${primaryColor}" font-size="18" letter-spacing="8" font-weight="bold">${title}</text>` : ''}
</svg>`;
}

// ===================== M7: 粗线盾形主标题 =====================
function renderBoldShield(ctx: RenderContext): string {
  const { primaryColor, secondaryColor, glowColor, title, showTitle, animated, animationSpeed } = ctx;
  const speed = animationSpeed;
  return `<svg width="100%" height="100%" viewBox="0 0 900 50" preserveAspectRatio="none">
  <defs>
    <linearGradient id="m7-left" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${primaryColor}"/>
    </linearGradient>
    <linearGradient id="m7-right" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${primaryColor}"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="m7-center" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${secondaryColor}"/>
      <stop offset="50%" stop-color="${primaryColor}"/>
      <stop offset="100%" stop-color="${secondaryColor}"/>
    </linearGradient>
    <linearGradient id="m7-highlight" x1="0.5" y1="0" x2="0.5" y2="1">
      <stop offset="0%" stop-color="${glowColor}" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="${glowColor}" stop-opacity="0"/>
    </linearGradient>
    <filter id="m7-g"><feGaussianBlur stdDeviation="2"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <polygon points="60,15 300,15 300,35 60,35 40,25" fill="url(#m7-left)"/>
  <polygon points="840,15 600,15 600,35 840,35 860,25" fill="url(#m7-right)"/>
  <rect x="300" y="12" width="300" height="26" fill="url(#m7-center)" rx="1"/>
  <rect x="300" y="12" width="300" height="13" fill="url(#m7-highlight)"/>
  <polygon points="300,12 600,12 600,38 300,38" fill="none" stroke="${glowColor}" stroke-width="1"/>
  ${animated ? `<rect x="310" y="14" width="280" height="22" fill="none" stroke="${glowColor}" stroke-width="0.5" opacity="0.6" filter="url(#m7-g)"><animate attributeName="opacity" values="0.2;0.8;0.2" dur="${speed}s" repeatCount="indefinite"/></rect>` : ''}
  <polygon points="295,10 305,10 305,40 295,40 285,25" fill="${primaryColor}" stroke="${glowColor}" stroke-width="0.5"/>
  <polygon points="605,10 595,10 595,40 605,40 615,25" fill="${primaryColor}" stroke="${glowColor}" stroke-width="0.5"/>
  ${showTitle ? `<text x="450" y="31" text-anchor="middle" fill="${primaryColor}" font-size="17" letter-spacing="6" font-weight="bold">${title}</text>` : ''}
</svg>`;
}

// ===================== M8: 双括号主标题 =====================
function renderBracketFrame(ctx: RenderContext): string {
  const { primaryColor, title, showTitle, animated, animationSpeed } = ctx;
  const speed = animationSpeed;
  return `<svg width="100%" height="100%" viewBox="0 0 900 54" preserveAspectRatio="none">
  <defs>
    <linearGradient id="m8-line" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0"/>
      <stop offset="50%" stop-color="${primaryColor}" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0"/>
    </linearGradient>
    <filter id="m8-g"><feGaussianBlur stdDeviation="2"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <line x1="60" y1="42" x2="840" y2="42" stroke="url(#m8-line)" stroke-width="1"/>
  <polyline points="290,8 270,27 290,46" fill="none" stroke="${primaryColor}" stroke-width="2.5" stroke-linejoin="round" filter="url(#m8-g)"/>
  <polyline points="278,8 258,27 278,46" fill="none" stroke="${primaryColor}" stroke-width="1.5" stroke-linejoin="round" opacity="0.5"/>
  <polyline points="610,8 630,27 610,46" fill="none" stroke="${primaryColor}" stroke-width="2.5" stroke-linejoin="round" filter="url(#m8-g)"/>
  <polyline points="622,8 642,27 622,46" fill="none" stroke="${primaryColor}" stroke-width="1.5" stroke-linejoin="round" opacity="0.5"/>
  <line x1="255" y1="27" x2="60" y2="27" stroke="${primaryColor}" stroke-width="1" opacity="0.4"/>
  <line x1="270" y1="42" x2="60" y2="42" stroke="${primaryColor}" stroke-width="1.5" opacity="0.3"/>
  <polygon points="65,27 55,24 52,27 55,30" fill="${primaryColor}" opacity="0.5"/>
  <line x1="645" y1="27" x2="840" y2="27" stroke="${primaryColor}" stroke-width="1" opacity="0.4"/>
  <line x1="630" y1="42" x2="840" y2="42" stroke="${primaryColor}" stroke-width="1.5" opacity="0.3"/>
  <polygon points="835,27 845,24 848,27 845,30" fill="${primaryColor}" opacity="0.5"/>
  ${showTitle ? `<text x="450" y="32" text-anchor="middle" fill="${primaryColor}" font-size="20" letter-spacing="10" font-weight="bold">${title}</text>` : ''}
  ${animated ? `<line x1="0" y1="42" x2="60" y2="42" stroke="#00e5ff" stroke-width="2" filter="url(#m8-g)"><animate attributeName="x1" values="60;780;60" dur="${speed}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.42,0,0.58,1;0.42,0,0.58,1"/><animate attributeName="x2" values="120;840;120" dur="${speed}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.42,0,0.58,1;0.42,0,0.58,1"/></line>` : ''}
</svg>`;
}

// ===================== M9: 导航标签主标题 =====================
function renderNavTab(ctx: RenderContext): string {
  const { primaryColor, glowColor, title, showTitle } = ctx;
  return `<svg width="100%" height="100%" viewBox="0 0 900 66" preserveAspectRatio="none">
  <defs>
    <linearGradient id="m9-bg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0"/>
      <stop offset="20%" stop-color="${primaryColor}" stop-opacity="0.25"/>
      <stop offset="50%" stop-color="${primaryColor}" stop-opacity="0.4"/>
      <stop offset="80%" stop-color="${primaryColor}" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="m9-tab" x1="0.5" y1="0" x2="0.5" y2="1">
      <stop offset="0%" stop-color="${glowColor}" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0.1"/>
    </linearGradient>
    <linearGradient id="m9-line" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${glowColor}" stop-opacity="0"/>
      <stop offset="50%" stop-color="${glowColor}"/>
      <stop offset="100%" stop-color="${glowColor}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <polygon points="300,0 310,6 590,6 600,0 620,30 280,30" fill="url(#m9-bg)"/>
  <polygon points="300,0 310,6 590,6 600,0" fill="none" stroke="${glowColor}" stroke-width="1"/>
  <line x1="280" y1="30" x2="620" y2="30" stroke="${glowColor}" stroke-width="1"/>
  <polyline points="280,30 200,30 180,22" fill="none" stroke="${glowColor}" stroke-width="1.2" opacity="0.6"/>
  <polyline points="180,22 80,22" fill="none" stroke="${glowColor}" stroke-width="0.6" opacity="0.3"/>
  <polyline points="620,30 700,30 720,22" fill="none" stroke="${glowColor}" stroke-width="1.2" opacity="0.6"/>
  <polyline points="720,22 820,22" fill="none" stroke="${glowColor}" stroke-width="0.6" opacity="0.3"/>
  ${showTitle ? `<text x="450" y="22" text-anchor="middle" fill="${primaryColor}" font-size="16" letter-spacing="6" font-weight="bold">${title}</text>` : ''}
</svg>`;
}

// ===================== M10: 赛博矩阵主标题 =====================
function renderCyberMatrix(ctx: RenderContext): string {
  const { primaryColor, glowColor, title, showTitle, animated, animationSpeed } = ctx;
  const speed = animationSpeed;
  return `<svg width="100%" height="100%" viewBox="0 0 900 60" preserveAspectRatio="none">
  <defs>
    <linearGradient id="m10-bg" x1="0.5" y1="0" x2="0.5" y2="1">
      <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0.025"/>
    </linearGradient>
    <linearGradient id="m10-scan" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${glowColor}" stop-opacity="0"/>
      <stop offset="50%" stop-color="${glowColor}" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="${glowColor}" stop-opacity="0"/>
    </linearGradient>
    <filter id="m10-g"><feGaussianBlur stdDeviation="1.5"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect x="20" y="4" width="860" height="50" fill="url(#m10-bg)" stroke="${glowColor}" stroke-opacity="0.15" stroke-width="1" rx="2"/>
  <polyline points="20,16 20,4 36,4" fill="none" stroke="${glowColor}" stroke-width="2"/>
  <polyline points="864,4 880,4 880,16" fill="none" stroke="${glowColor}" stroke-width="2"/>
  <polyline points="20,42 20,54 36,54" fill="none" stroke="${glowColor}" stroke-width="2"/>
  <polyline points="864,54 880,54 880,42" fill="none" stroke="${glowColor}" stroke-width="2"/>
  <line x1="40" y1="4" x2="340" y2="4" stroke="${glowColor}" stroke-width="0.5" opacity="0.3"/>
  <line x1="560" y1="4" x2="860" y2="4" stroke="${glowColor}" stroke-width="0.5" opacity="0.3"/>
  <polygon points="340,2 360,0 540,0 560,2 560,14 540,18 360,18 340,14" fill="${primaryColor}" stroke-opacity="0.25" stroke-width="0.8"/>
  ${showTitle ? `<text x="450" y="18" text-anchor="middle" fill="${primaryColor}" font-size="14" letter-spacing="5" font-weight="bold">${title}</text>` : ''}
  ${animated ? `<g opacity="0.4">
    <circle cy="52" r="1" fill="${glowColor}"><animate attributeName="cx" values="40;860" dur="${speed}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;1;0" dur="${speed}s" repeatCount="indefinite"/></circle>
    <circle cy="52" r="1" fill="${glowColor}"><animate attributeName="cx" values="40;860" dur="${speed}s" begin="1s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;1;0" dur="${speed}s" begin="1s" repeatCount="indefinite"/></circle>
    <circle cy="52" r="1" fill="${glowColor}"><animate attributeName="cx" values="40;860" dur="${speed}s" begin="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;1;0" dur="${speed}s" begin="2s" repeatCount="indefinite"/></circle>
  </g>
  <rect x="20" y="4" width="2" height="50" fill="url(#m10-scan)"><animate attributeName="x" values="20;878;20" dur="${speed * 1.5}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.42,0,0.58,1;0.42,0,0.58,1"/></rect>` : ''}
</svg>`;
}

// ===================== 统一入口 =====================
export function renderMainHeader(
  variant: string,
  _props: Props,
  ctx: RenderContext,
): string {
  switch (variant) {
    case 'diamond-bar':    return renderDiamondBar(ctx);
    case 'sleek':         return renderSleek(ctx);
    case 'diamond-crown': return renderDiamondCrown(ctx);
    case 'circuit':       return renderCircuit(ctx);
    case 'aurora':        return renderAurora(ctx);
    case 'wing-arrow':    return renderWingArrow(ctx);
    case 'bold-shield':   return renderBoldShield(ctx);
    case 'bracket-frame': return renderBracketFrame(ctx);
    case 'nav-tab':       return renderNavTab(ctx);
    case 'cyber-matrix':  return renderCyberMatrix(ctx);
    default:              return renderDiamondBar(ctx);
  }
}
