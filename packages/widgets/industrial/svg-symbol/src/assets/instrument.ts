export const THERMOMETER_SVG = `<svg width="100%" height="100%" viewBox="0 0 60 60" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="thermoCase" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#334155;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="30" cy="28" r="23" fill="url(#thermoCase)" stroke="#1e293b" stroke-width="2"/>
  <circle cx="30" cy="28" r="17" fill="#f8fafc" stroke="#94a3b8" stroke-width="1"/>
  <line x1="30" y1="13" x2="30" y2="17" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="30" y1="39" x2="30" y2="43" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="15" y1="28" x2="19" y2="28" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="41" y1="28" x2="45" y2="28" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="19" y1="17" x2="22" y2="20" stroke="#1e293b" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
  <line x1="41" y1="17" x2="38" y2="20" stroke="#1e293b" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
  <line x1="19" y1="39" x2="22" y2="36" stroke="#1e293b" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
  <line x1="41" y1="39" x2="38" y2="36" stroke="#1e293b" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
  <line x1="30" y1="28" x2="30" y2="12" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="30" cy="28" r="3" fill="#ef4444"/>
  <rect x="24" y="50" width="12" height="7" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1.5"/>
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
  <rect x="14" y="6" width="32" height="48" rx="3" fill="url(#lgCase)" stroke="#1e293b" stroke-width="2"/>
  <rect x="18" y="10" width="24" height="40" rx="1" fill="#f8fafc" stroke="#94a3b8" stroke-width="1"/>
  <rect x="20" y="24" width="20" height="24" fill="url(#lgLiquid)" opacity="0.9"/>
  <line x1="20" y1="16" x2="40" y2="16" stroke="#cbd5e1" stroke-width="1"/>
  <line x1="20" y1="22" x2="40" y2="22" stroke="#cbd5e1" stroke-width="1"/>
  <line x1="20" y1="28" x2="40" y2="28" stroke="#cbd5e1" stroke-width="1"/>
  <line x1="20" y1="34" x2="40" y2="34" stroke="#cbd5e1" stroke-width="1"/>
  <line x1="20" y1="40" x2="40" y2="40" stroke="#cbd5e1" stroke-width="1"/>
  <rect x="22" y="2" width="16" height="4" fill="#64748b"/>
  <rect x="22" y="54" width="16" height="4" fill="#64748b"/>
</svg>`;
