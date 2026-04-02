export const HORIZONTAL_TANK_SVG = `<svg width="100%" height="100%" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="hTankGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="hTankCapGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#334155;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#475569;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="0" y="22" width="16" height="16" fill="#475569"/>
  <rect x="84" y="22" width="16" height="16" fill="#475569"/>
  <rect x="16" y="14" width="68" height="32" rx="4" fill="url(#hTankGrad)" stroke="#1e293b" stroke-width="2"/>
  <ellipse cx="16" cy="30" rx="6" ry="14" fill="url(#hTankCapGrad)" stroke="#1e293b" stroke-width="2"/>
  <ellipse cx="84" cy="30" rx="6" ry="14" fill="url(#hTankCapGrad)" stroke="#1e293b" stroke-width="2"/>
  <rect x="20" y="20" width="60" height="8" rx="2" fill="#0f172a" fill-opacity="0.4" stroke="#475569" stroke-width="0.8"/>
</svg>`;

export const VERTICAL_TANK_SVG = `<svg width="100%" height="100%" viewBox="0 0 60 100" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="vTankGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#334155;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="22" y="0" width="16" height="8" fill="#475569"/>
  <rect x="12" y="8" width="36" height="84" rx="6" fill="url(#vTankGrad)" stroke="#1e293b" stroke-width="2"/>
  <ellipse cx="30" cy="8" rx="18" ry="5" fill="#475569" stroke="#1e293b" stroke-width="1"/>
  <rect x="18" y="16" width="24" height="8" rx="2" fill="#0f172a" fill-opacity="0.4" stroke="#475569" stroke-width="0.8"/>
  <rect x="22" y="92" width="16" height="8" fill="#475569"/>
  <ellipse cx="30" cy="92" rx="18" ry="5" fill="#334155" stroke="#1e293b" stroke-width="1"/>
</svg>`;

export const PRESSURE_VESSEL_SVG = `<svg width="100%" height="100%" viewBox="0 0 60 100" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="pvBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#334155;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="22" y="0" width="16" height="8" fill="#475569"/>
  <rect x="10" y="8" width="40" height="72" rx="20" ry="20" fill="url(#pvBodyGrad)" stroke="#1e293b" stroke-width="2"/>
  <ellipse cx="30" cy="8" rx="20" ry="6" fill="#475569" stroke="#1e293b" stroke-width="1"/>
  <rect x="24" y="18" width="12" height="6" rx="1" fill="#64748b" stroke="#1e293b" stroke-width="1"/>
  <rect x="14" y="80" width="32" height="6" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1.5"/>
  <rect x="18" y="86" width="24" height="4" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1"/>
  <rect x="22" y="92" width="16" height="8" fill="#475569"/>
  <ellipse cx="30" cy="92" rx="20" ry="6" fill="#334155" stroke="#1e293b" stroke-width="1"/>
</svg>`;
