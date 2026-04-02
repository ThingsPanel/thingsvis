export const FAN_SVG = `<svg width="100%" height="100%" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="fanHousing" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="0" y="18" width="20" height="24" fill="#64748b"/>
  <rect x="18" y="6" width="64" height="48" rx="4" fill="url(#fanHousing)" stroke="#1e293b" stroke-width="2"/>
  <circle cx="50" cy="30" r="18" fill="none" stroke="#64748b" stroke-width="1.5"/>
  <path d="M 50 30 L 50 14 Q 56 18 50 30" fill="#0ea5e9" opacity="0.9"/>
  <path d="M 50 30 L 66 30 Q 62 36 50 30" fill="#0ea5e9" opacity="0.8"/>
  <path d="M 50 30 L 50 46 Q 44 42 50 30" fill="#0ea5e9" opacity="0.9"/>
  <path d="M 50 30 L 34 30 Q 38 24 50 30" fill="#0ea5e9" opacity="0.8"/>
  <path d="M 50 30 L 56 18 Q 60 24 50 30" fill="#0ea5e9" opacity="0.85"/>
  <path d="M 50 30 L 62 36 Q 56 40 50 30" fill="#0ea5e9" opacity="0.85"/>
  <path d="M 50 30 L 44 42 Q 40 36 50 30" fill="#0ea5e9" opacity="0.85"/>
  <path d="M 50 30 L 38 24 Q 44 20 50 30" fill="#0ea5e9" opacity="0.85"/>
  <circle cx="50" cy="30" r="4" fill="#1e293b"/>
  <line x1="24" y1="10" x2="76" y2="10" stroke="#1e293b" stroke-width="1" opacity="0.3"/>
  <line x1="24" y1="50" x2="76" y2="50" stroke="#1e293b" stroke-width="1" opacity="0.3"/>
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
  <rect x="0" y="18" width="20" height="24" fill="#64748b"/>
  <rect x="80" y="18" width="20" height="24" fill="#64748b"/>
  <rect x="18" y="10" width="40" height="40" rx="4" fill="url(#acTankGrad)" stroke="#1e293b" stroke-width="2"/>
  <rect x="50" y="4" width="30" height="52" rx="2" fill="url(#acMotorGrad)" stroke="#1e293b" stroke-width="2"/>
  <circle cx="34" cy="22" r="5" fill="#f8fafc" stroke="#94a3b8" stroke-width="1"/>
  <line x1="34" y1="22" x2="34" y2="16" stroke="#0ea5e9" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="34" cy="22" r="1.5" fill="#0ea5e9"/>
  <rect x="56" y="26" width="10" height="14" rx="1" fill="#64748b" stroke="#1e293b" stroke-width="1.5"/>
  <line x1="61" y1="26" x2="61" y2="40" stroke="#1e293b" stroke-width="1"/>
</svg>`;
