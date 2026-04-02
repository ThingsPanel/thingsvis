export const THERMOMETER_SVG = `<svg width="100%" height="100%" viewBox="0 0 60 60" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="thermoCase" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#334155;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="30" cy="30" r="22" fill="url(#thermoCase)" stroke="#1e293b" stroke-width="2"/>
  <circle cx="30" cy="30" r="16" fill="#f8fafc" stroke="#94a3b8" stroke-width="1"/>
  <line x1="30" y1="18" x2="30" y2="24" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="30" y1="36" x2="30" y2="42" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="18" y1="30" x2="24" y2="30" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="36" y1="30" x2="42" y2="30" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="22" y1="22" x2="26" y2="26" stroke="#1e293b" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
  <line x1="38" y1="22" x2="34" y2="26" stroke="#1e293b" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
  <line x1="22" y1="38" x2="26" y2="34" stroke="#1e293b" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
  <line x1="38" y1="38" x2="34" y2="34" stroke="#1e293b" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
  <line x1="30" y1="30" x2="30" y2="20" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
  <circle cx="30" cy="30" r="3" fill="#ef4444"/>
  <rect x="24" y="52" width="12" height="8" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1.5"/>
</svg>`;

export const LEVEL_GAUGE_SVG = `<svg width="100%" height="100%" viewBox="0 0 60 60" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="lgCase" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#334155;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="lgLiquid" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#38bdf8;stop-opacity:0.9" />
      <stop offset="100%" style="stop-color:#0ea5e9;stop-opacity:0.95" />
    </linearGradient>
  </defs>
  <rect x="18" y="8" width="24" height="44" rx="3" fill="url(#lgCase)" stroke="#1e293b" stroke-width="2"/>
  <rect x="22" y="12" width="16" height="36" rx="1" fill="#f8fafc" stroke="#94a3b8" stroke-width="1"/>
  <rect x="24" y="28" width="12" height="18" fill="url(#lgLiquid)" opacity="0.9"/>
  <line x1="24" y1="18" x2="36" y2="18" stroke="#cbd5e1" stroke-width="1"/>
  <line x1="24" y1="24" x2="36" y2="24" stroke="#cbd5e1" stroke-width="1"/>
  <line x1="24" y1="30" x2="36" y2="30" stroke="#cbd5e1" stroke-width="1"/>
  <line x1="24" y1="36" x2="36" y2="36" stroke="#cbd5e1" stroke-width="1"/>
  <line x1="24" y1="42" x2="36" y2="42" stroke="#cbd5e1" stroke-width="1"/>
  <rect x="22" y="0" width="16" height="8" fill="#475569"/>
  <rect x="22" y="52" width="16" height="8" fill="#475569"/>
</svg>`;
