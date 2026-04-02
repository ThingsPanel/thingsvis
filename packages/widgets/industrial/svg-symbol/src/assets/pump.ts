export const CENTRIFUGAL_PUMP_SVG = `<svg width="100%" height="100%" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="pumpGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="0" y="18" width="20" height="24" fill="#64748b"/>
  <rect x="80" y="18" width="20" height="24" fill="#64748b"/>
  <circle cx="50" cy="30" r="26" fill="url(#pumpGrad)" stroke="#1e293b" stroke-width="2"/>
  <path d="M 50 30 L 50 10 Q 62 20 50 30" fill="#0ea5e9" opacity="0.9"/>
  <path d="M 50 30 L 70 30 Q 60 45 50 30" fill="#0ea5e9" opacity="0.8"/>
  <path d="M 50 30 L 50 50 Q 38 40 50 30" fill="#0ea5e9" opacity="0.9"/>
  <path d="M 50 30 L 30 30 Q 40 15 50 30" fill="#0ea5e9" opacity="0.8"/>
  <circle cx="50" cy="30" r="5" fill="#1e293b"/>
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
  <rect x="0" y="18" width="20" height="24" fill="#64748b"/>
  <rect x="80" y="18" width="20" height="24" fill="#64748b"/>
  <rect x="18" y="10" width="64" height="40" rx="4" fill="url(#inlineBodyGrad)" stroke="#1e293b" stroke-width="2"/>
  <rect x="36" y="4" width="28" height="52" rx="3" fill="url(#inlineMotorGrad)" stroke="#1e293b" stroke-width="2"/>
  <rect x="42" y="0" width="16" height="6" rx="1" fill="#64748b" stroke="#1e293b" stroke-width="1"/>
  <circle cx="50" cy="30" r="4" fill="#0ea5e9"/>
</svg>`;
