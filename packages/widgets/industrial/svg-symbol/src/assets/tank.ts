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
  <rect x="2" y="18" width="18" height="24" fill="#64748b"/>
  <rect x="80" y="18" width="18" height="24" fill="#64748b"/>
  <rect x="18" y="6" width="62" height="48" rx="2" fill="url(#hTankGrad)" stroke="#1e293b" stroke-width="2"/>
  <ellipse cx="18" cy="30" rx="8" ry="22" fill="url(#hTankCapGrad)" stroke="#1e293b" stroke-width="2"/>
  <ellipse cx="80" cy="30" rx="8" ry="22" fill="url(#hTankCapGrad)" stroke="#1e293b" stroke-width="2"/>
  <rect x="30" y="10" width="40" height="10" rx="2" fill="#0f172a" fill-opacity="0.4" stroke="#475569" stroke-width="0.8"/>
</svg>`;

export const VERTICAL_TANK_SVG = `<svg width="100%" height="100%" viewBox="0 0 60 100" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="vTankGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#334155;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="18" y="2" width="24" height="6" fill="#64748b"/>
  <rect x="2" y="8" width="56" height="84" rx="6" fill="url(#vTankGrad)" stroke="#1e293b" stroke-width="2"/>
  <ellipse cx="30" cy="8" rx="28" ry="5" fill="#64748b" stroke="#1e293b" stroke-width="1"/>
  <rect x="14" y="16" width="32" height="10" rx="2" fill="#0f172a" fill-opacity="0.4" stroke="#475569" stroke-width="0.8"/>
  <rect x="18" y="92" width="24" height="6" fill="#64748b"/>
  <ellipse cx="30" cy="92" rx="28" ry="5" fill="#334155" stroke="#1e293b" stroke-width="1"/>
</svg>`;

export const PRESSURE_VESSEL_SVG = `<svg width="100%" height="100%" viewBox="0 0 60 100" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="pvBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#334155;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="18" y="2" width="24" height="6" fill="#64748b"/>
  <rect x="2" y="8" width="56" height="72" rx="26" ry="26" fill="url(#pvBodyGrad)" stroke="#1e293b" stroke-width="2"/>
  <ellipse cx="30" cy="8" rx="28" ry="6" fill="#64748b" stroke="#1e293b" stroke-width="1"/>
  <rect x="22" y="18" width="16" height="6" rx="1" fill="#64748b" stroke="#1e293b" stroke-width="1"/>
  <rect x="6" y="80" width="48" height="6" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1.5"/>
  <rect x="18" y="86" width="24" height="6" fill="#475569"/>
  <rect x="18" y="92" width="24" height="6" fill="#64748b"/>
</svg>`;
