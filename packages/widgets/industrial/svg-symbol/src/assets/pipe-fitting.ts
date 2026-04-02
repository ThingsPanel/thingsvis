export const ELBOW_PIPE_SVG = `<svg width="100%" height="100%" viewBox="0 0 60 60" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Top-to-bottom: cylindrical highlight for horizontal arm (matches tee pipe style) -->
    <linearGradient id="epHorizGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   style="stop-color:#64748b;stop-opacity:1"/>
      <stop offset="42%"  style="stop-color:#94a3b8;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1"/>
    </linearGradient>
    <!-- Left-to-right: cylindrical highlight for vertical arm (matches tee branch style) -->
    <linearGradient id="epVertGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   style="stop-color:#64748b;stop-opacity:1"/>
      <stop offset="42%"  style="stop-color:#94a3b8;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1"/>
    </linearGradient>
  </defs>

  <!-- Horizontal arm: full rect from left edge to the inner corner, outer bend arc r=12 -->
  <path d="M 0 0 L 48 0 A 12 12 0 0 1 60 12 L 60 20 A 8 8 0 0 1 48 12 L 0 12 Z"
        fill="url(#epHorizGrad)"/>

  <!-- Vertical arm: starts at inner corner, concave arc r=8 for smooth inner junction -->
  <path d="M 48 12 A 8 8 0 0 0 60 20 L 60 60 L 48 60 Z"
        fill="url(#epVertGrad)"/>
</svg>`;

export const TEE_PIPE_SVG = `<svg width="100%" height="100%" viewBox="0 22 64 40" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="tpPipeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   style="stop-color:#64748b;stop-opacity:1"/>
      <stop offset="42%"  style="stop-color:#94a3b8;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1"/>
    </linearGradient>
    <linearGradient id="tpBranchGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   style="stop-color:#64748b;stop-opacity:1"/>
      <stop offset="42%"  style="stop-color:#94a3b8;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1"/>
    </linearGradient>
  </defs>

  <!-- Main pipe: left stub 26px + branch 12px + right stub 26px = 64px total -->
  <rect x="0" y="24" width="64" height="12" fill="url(#tpPipeGrad)"/>

  <!-- Down branch: 26px tall (equal to each stub), horizontal gradient -->
  <rect x="26" y="36" width="12" height="26" fill="url(#tpBranchGrad)"/>
</svg>`;