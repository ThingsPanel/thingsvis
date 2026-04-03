export const ELBOW_PIPE_SVG = `<svg width="100%" height="100%" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="elbowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#64748b;stop-opacity:1" />
      <stop offset="45%" style="stop-color:#7a94b0;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="elbowHPipeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#64748b;stop-opacity:1" />
      <stop offset="42%" style="stop-color:#94a3b8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="elbowVPipeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#334155;stop-opacity:1" />
      <stop offset="42%" style="stop-color:#94a3b8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#64748b;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="0" y="24" width="16" height="12" fill="url(#elbowHPipeGrad)"/>
  <line x1="0" y1="24" x2="16" y2="24" stroke="#94a3b8" stroke-width="1"/>
  <line x1="0" y1="36" x2="16" y2="36" stroke="#1e293b" stroke-width="1"/>
  <rect x="15" y="19" width="6" height="22" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1"/>
  <rect x="48" y="42" width="12" height="18" fill="url(#elbowVPipeGrad)"/>
  <line x1="48" y1="42" x2="48" y2="60" stroke="#334155" stroke-width="1"/>
  <line x1="60" y1="42" x2="60" y2="60" stroke="#94a3b8" stroke-width="1"/>
  <rect x="44" y="41" width="20" height="6" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1"/>
  <path d="M 21 18 L 54 18 A 30 30 0 0 1 72 42 L 72 42 L 21 42 Z" fill="url(#elbowGrad)" stroke="#1e293b" stroke-width="1.5"/>
  <path d="M 22 20 L 48 20" fill="none" stroke="#94a3b8" stroke-width="1" opacity="0.45" stroke-linecap="round"/>
</svg>`;

export const TEE_PIPE_SVG = `<svg width="100%" height="100%" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="teeBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#64748b;stop-opacity:1" />
      <stop offset="45%" style="stop-color:#7a94b0;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="teePipeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#64748b;stop-opacity:1" />
      <stop offset="42%" style="stop-color:#94a3b8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="teeVPipeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#334155;stop-opacity:1" />
      <stop offset="42%" style="stop-color:#94a3b8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#64748b;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="0" y="24" width="16" height="12" fill="url(#teePipeGrad)"/>
  <line x1="0" y1="24" x2="16" y2="24" stroke="#94a3b8" stroke-width="1"/>
  <line x1="0" y1="36" x2="16" y2="36" stroke="#1e293b" stroke-width="1"/>
  <rect x="15" y="19" width="6" height="22" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1"/>
  <rect x="84" y="24" width="16" height="12" fill="url(#teePipeGrad)"/>
  <line x1="84" y1="24" x2="100" y2="24" stroke="#94a3b8" stroke-width="1"/>
  <line x1="84" y1="36" x2="100" y2="36" stroke="#1e293b" stroke-width="1"/>
  <rect x="79" y="19" width="6" height="22" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1"/>
  <rect x="38" y="44" width="24" height="16" fill="url(#teeVPipeGrad)"/>
  <line x1="38" y1="44" x2="38" y2="60" stroke="#334155" stroke-width="1"/>
  <line x1="62" y1="44" x2="62" y2="60" stroke="#94a3b8" stroke-width="1"/>
  <rect x="34" y="43" width="32" height="6" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1"/>
  <path d="M 21 18 L 79 18 L 79 42 L 62 42 Q 50 47 38 42 L 21 42 Z" fill="url(#teeBodyGrad)" stroke="#1e293b" stroke-width="1.5"/>
  <line x1="22" y1="20" x2="78" y2="20" stroke="#94a3b8" stroke-width="1" opacity="0.4"/>
</svg>`;
