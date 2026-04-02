export const CENTRIFUGAL_PUMP_SVG = `<svg width="100%" height="100%" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="pumpGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="0" y="26" width="10" height="8" fill="#475569"/>
  <rect x="90" y="26" width="10" height="8" fill="#475569"/>
  <circle cx="50" cy="30" r="20" fill="url(#pumpGrad)" stroke="#1e293b" stroke-width="2"/>
  <path d="M 50 30 L 50 15 Q 60 22 50 30" fill="#0ea5e9" opacity="0.9"/>
  <path d="M 50 30 L 65 30 Q 58 42 50 30" fill="#0ea5e9" opacity="0.8"/>
  <path d="M 50 30 L 50 45 Q 40 38 50 30" fill="#0ea5e9" opacity="0.9"/>
  <path d="M 50 30 L 35 30 Q 42 18 50 30" fill="#0ea5e9" opacity="0.8"/>
  <circle cx="50" cy="30" r="4" fill="#1e293b"/>
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
  <rect x="0" y="26" width="10" height="8" fill="#475569"/>
  <rect x="90" y="26" width="10" height="8" fill="#475569"/>
  <rect x="10" y="18" width="80" height="24" rx="4" fill="url(#inlineBodyGrad)" stroke="#1e293b" stroke-width="2"/>
  <rect x="38" y="10" width="24" height="40" rx="3" fill="url(#inlineMotorGrad)" stroke="#1e293b" stroke-width="2"/>
  <circle cx="50" cy="22" r="3" fill="#0ea5e9"/>
</svg>`;
