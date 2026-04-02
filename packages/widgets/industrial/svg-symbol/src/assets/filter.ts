export const Y_FILTER_SVG = `<svg width="100%" height="100%" viewBox="0 18 80 46" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="yfPipeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   style="stop-color:#64748b;stop-opacity:1"/>
      <stop offset="42%"  style="stop-color:#94a3b8;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1"/>
    </linearGradient>
    <linearGradient id="yfBranchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   style="stop-color:#64748b;stop-opacity:1"/>
      <stop offset="42%"  style="stop-color:#94a3b8;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1"/>
    </linearGradient>
    <linearGradient id="yfCapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   style="stop-color:#7a94b0;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1"/>
    </linearGradient>
  </defs>

  <!-- Main pipe, shortened to x=0..80 -->
  <rect x="0" y="24" width="80" height="12" fill="url(#yfPipeGrad)"/>
  <line x1="0" y1="24" x2="80" y2="24" stroke="#94a3b8" stroke-width="1"/>

  <!-- Filter housing bulge, centred over pipe -->
  <rect x="23" y="20" width="34" height="18" rx="3"
        fill="url(#yfPipeGrad)" stroke="#1e293b" stroke-width="1"/>
  <line x1="25" y1="21" x2="55" y2="21" stroke="#94a3b8" stroke-width="0.8" opacity="0.5"/>

  <!-- 45° drain branch: parallelogram starting at housing bottom -->
  <path d="M 34 38 L 46 38 L 62 54 L 50 54 Z"
        fill="url(#yfBranchGrad)" stroke="#1e293b" stroke-width="1"/>
  <line x1="35" y1="39" x2="51" y2="55" stroke="#94a3b8" stroke-width="0.8" opacity="0.45"/>

  <!-- Drain cap, rotated 45° at branch end, centre (56,54) -->
  <rect x="50" y="50" width="12" height="8" rx="2"
        fill="url(#yfCapGrad)" stroke="#1e293b" stroke-width="1"
        transform="rotate(45, 56, 54)"/>
</svg>`;