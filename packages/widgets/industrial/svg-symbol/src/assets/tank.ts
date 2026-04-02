export const HORIZONTAL_TANK_SVG = `<svg width="100%" height="100%" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="hTankGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#64748b;stop-opacity:1" />
      <stop offset="38%" style="stop-color:#7a94b0;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
    </linearGradient>
    <radialGradient id="hTankCapGrad" cx="35%" cy="35%" r="65%">
      <stop offset="0%" style="stop-color:#7a94b0;stop-opacity:1" />
      <stop offset="55%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
    </radialGradient>
    <linearGradient id="hTankPipeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#64748b;stop-opacity:1" />
      <stop offset="42%" style="stop-color:#94a3b8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="0" y="24" width="16" height="12" fill="url(#hTankPipeGrad)"/>
  <line x1="0" y1="24" x2="16" y2="24" stroke="#94a3b8" stroke-width="1"/>
  <line x1="0" y1="36" x2="16" y2="36" stroke="#1e293b" stroke-width="1"/>
  <rect x="15" y="19" width="5" height="22" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1"/>
  <rect x="84" y="24" width="16" height="12" fill="url(#hTankPipeGrad)"/>
  <line x1="84" y1="24" x2="100" y2="24" stroke="#94a3b8" stroke-width="1"/>
  <line x1="84" y1="36" x2="100" y2="36" stroke="#1e293b" stroke-width="1"/>
  <rect x="80" y="19" width="5" height="22" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1"/>
  <rect x="20" y="7.5" width="60" height="46" rx="2" fill="#0f172a" opacity="0.2"/>
  <rect x="20" y="6" width="60" height="46" rx="2" fill="url(#hTankGrad)" stroke="#1e293b" stroke-width="1.5"/>
  <ellipse cx="20" cy="29" rx="8" ry="21" fill="url(#hTankCapGrad)" stroke="#1e293b" stroke-width="1.5"/>
  <ellipse cx="80" cy="29" rx="8" ry="21" fill="url(#hTankCapGrad)" stroke="#1e293b" stroke-width="1.5"/>
  <path d="M 22 9 L 68 9" fill="none" stroke="#94a3b8" stroke-width="1" opacity="0.4" stroke-linecap="round"/>
  <rect x="30" y="10" width="40" height="9" rx="2" fill="#0f172a" fill-opacity="0.45" stroke="#475569" stroke-width="0.8"/>
  <line x1="50" y1="6" x2="50" y2="52" stroke="#1e293b" stroke-width="0.8" opacity="0.25"/>
</svg>`;

export const VERTICAL_TANK_SVG = `<svg width="100%" height="100%" viewBox="0 0 60 100" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="vTankGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#1e293b;stop-opacity:1" />
      <stop offset="30%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="55%" style="stop-color:#7a94b0;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
    <radialGradient id="vTankCapGrad" cx="38%" cy="35%" r="62%">
      <stop offset="0%" style="stop-color:#7a94b0;stop-opacity:1" />
      <stop offset="55%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
    </radialGradient>
  </defs>
  <rect x="18" y="2" width="24" height="6" fill="#64748b"/>
  <rect x="2" y="8.5" width="56" height="84" rx="6" fill="#0f172a" opacity="0.2"/>
  <rect x="2" y="8" width="56" height="84" rx="6" fill="url(#vTankGrad)" stroke="#1e293b" stroke-width="1.5"/>
  <ellipse cx="30" cy="8" rx="28" ry="5" fill="url(#vTankCapGrad)" stroke="#1e293b" stroke-width="1"/>
  <path d="M 5 18 L 5 82" fill="none" stroke="#94a3b8" stroke-width="0.8" opacity="0.3" stroke-linecap="round"/>
  <line x1="8" y1="30" x2="52" y2="30" stroke="#1e293b" stroke-width="0.8" opacity="0.3"/>
  <line x1="8" y1="50" x2="52" y2="50" stroke="#1e293b" stroke-width="0.8" opacity="0.3"/>
  <line x1="8" y1="70" x2="52" y2="70" stroke="#1e293b" stroke-width="0.8" opacity="0.3"/>
  <rect x="14" y="16" width="32" height="10" rx="2" fill="#0f172a" fill-opacity="0.45" stroke="#475569" stroke-width="0.8"/>
  <rect x="18" y="92" width="24" height="6" fill="#64748b"/>
  <ellipse cx="30" cy="92" rx="28" ry="5" fill="#334155" stroke="#1e293b" stroke-width="1"/>
</svg>`;

export const PRESSURE_VESSEL_SVG = `<svg width="100%" height="100%" viewBox="0 0 60 100" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="pvBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#1e293b;stop-opacity:1" />
      <stop offset="30%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="55%" style="stop-color:#7a94b0;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
    <radialGradient id="pvCapGrad" cx="38%" cy="35%" r="62%">
      <stop offset="0%" style="stop-color:#7a94b0;stop-opacity:1" />
      <stop offset="55%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
    </radialGradient>
  </defs>
  <rect x="18" y="2" width="24" height="6" fill="#64748b"/>
  <rect x="2" y="8.5" width="56" height="72" rx="26" ry="26" fill="#0f172a" opacity="0.2"/>
  <rect x="2" y="8" width="56" height="72" rx="26" ry="26" fill="url(#pvBodyGrad)" stroke="#1e293b" stroke-width="1.5"/>
  <ellipse cx="30" cy="8" rx="28" ry="6" fill="url(#pvCapGrad)" stroke="#1e293b" stroke-width="1"/>
  <path d="M 5 22 L 5 66" fill="none" stroke="#94a3b8" stroke-width="0.8" opacity="0.3" stroke-linecap="round"/>
  <rect x="22" y="18" width="16" height="6" rx="1" fill="#64748b" stroke="#1e293b" stroke-width="1"/>
  <line x1="8" y1="44" x2="52" y2="44" stroke="#1e293b" stroke-width="0.8" opacity="0.3"/>
  <rect x="6" y="80" width="48" height="6" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1.5"/>
  <rect x="18" y="86" width="24" height="6" fill="#475569"/>
  <rect x="18" y="92" width="24" height="6" fill="#64748b"/>
</svg>`;
