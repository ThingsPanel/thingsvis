export const CENTRIFUGAL_PUMP_SVG = `<svg width="100%" height="100%" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="pumpGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="2" y="18" width="26" height="24" fill="#64748b"/>
  <rect x="72" y="18" width="26" height="24" fill="#64748b"/>
  <circle cx="50" cy="30" r="24" fill="url(#pumpGrad)" stroke="#1e293b" stroke-width="2"/>
  <g id="tv-rotor">
    <path d="M 50 30 L 50 12 Q 61 20 50 30" fill="#0ea5e9" opacity="0.9"/>
    <path d="M 50 30 L 68 30 Q 60 43 50 30" fill="#0ea5e9" opacity="0.8"/>
    <path d="M 50 30 L 50 48 Q 39 40 50 30" fill="#0ea5e9" opacity="0.9"/>
    <path d="M 50 30 L 32 30 Q 40 17 50 30" fill="#0ea5e9" opacity="0.8"/>
    <circle cx="50" cy="30" r="5" fill="#1e293b"/>
  </g>
</svg>`;

export const INLINE_PUMP_SVG = `<svg width="100%" height="100%" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="inlineBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="inlineMotorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="2" y="18" width="18" height="24" fill="#64748b"/>
  <rect x="80" y="18" width="18" height="24" fill="#64748b"/>
  <rect x="18" y="10" width="62" height="40" rx="4" fill="url(#inlineBodyGrad)" stroke="#1e293b" stroke-width="2"/>
  <rect x="36" y="6" width="28" height="48" rx="3" fill="url(#inlineMotorGrad)" stroke="#1e293b" stroke-width="2"/>
  <rect x="42" y="2" width="16" height="6" rx="1" fill="#64748b" stroke="#1e293b" stroke-width="1"/>
  <circle cx="50" cy="30" r="4" fill="#0ea5e9"/>
</svg>`;
