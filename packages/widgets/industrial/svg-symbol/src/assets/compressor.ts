export const FAN_SVG = `<svg width="100%" height="100%" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="fanHousing" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="0" y="22" width="16" height="16" fill="#475569"/>
  <rect x="84" y="22" width="16" height="16" fill="#475569"/>
  <rect x="16" y="14" width="68" height="32" rx="4" fill="url(#fanHousing)" stroke="#1e293b" stroke-width="2"/>
  <circle cx="50" cy="30" r="12" fill="none" stroke="#64748b" stroke-width="1.5"/>
  <path d="M 50 30 L 50 20 Q 56 24 50 30" fill="#0ea5e9" opacity="0.9"/>
  <path d="M 50 30 L 60 30 Q 56 36 50 30" fill="#0ea5e9" opacity="0.8"/>
  <path d="M 50 30 L 50 40 Q 44 36 50 30" fill="#0ea5e9" opacity="0.9"/>
  <path d="M 50 30 L 40 30 Q 44 24 50 30" fill="#0ea5e9" opacity="0.8"/>
  <circle cx="50" cy="30" r="3" fill="#1e293b"/>
  <line x1="22" y1="18" x2="78" y2="18" stroke="#1e293b" stroke-width="1" opacity="0.3"/>
  <line x1="22" y1="42" x2="78" y2="42" stroke="#1e293b" stroke-width="1" opacity="0.3"/>
</svg>`;

export const AIR_COMPRESSOR_SVG = `<svg width="100%" height="100%" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="acTankGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="acMotorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="0" y="22" width="16" height="16" fill="#475569"/>
  <rect x="84" y="22" width="16" height="16" fill="#475569"/>
  <rect x="16" y="18" width="48" height="24" rx="4" fill="url(#acTankGrad)" stroke="#1e293b" stroke-width="2"/>
  <rect x="34" y="8" width="28" height="18" rx="2" fill="url(#acMotorGrad)" stroke="#1e293b" stroke-width="2"/>
  <circle cx="44" cy="17" r="2" fill="#0ea5e9"/>
  <rect x="66" y="24" width="12" height="12" rx="1" fill="#64748b" stroke="#1e293b" stroke-width="1.5"/>
  <line x1="72" y1="24" x2="72" y2="36" stroke="#1e293b" stroke-width="1"/>
</svg>`;
