export const THERMOMETER_SVG = `<svg width="100%" height="100%" viewBox="0 0 60 60" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="thermoCaseGrad" cx="36%" cy="32%" r="64%">
      <stop offset="0%" style="stop-color:#7a94b0;stop-opacity:1" />
      <stop offset="55%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
    </radialGradient>
  </defs>
  <circle cx="30" cy="27" r="24" fill="#0f172a" opacity="0.2"/>
  <circle cx="30" cy="26" r="24" fill="url(#thermoCaseGrad)" stroke="#1e293b" stroke-width="1.5"/>
  <path d="M 15 15 A 24 24 0 0 1 38 4" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
  <circle cx="30" cy="26" r="17" fill="#f8fafc" stroke="#94a3b8" stroke-width="1"/>
  <line x1="30" y1="11" x2="30" y2="15" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="30" y1="37" x2="30" y2="41" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="15" y1="26" x2="19" y2="26" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="41" y1="26" x2="45" y2="26" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="19" y1="15" x2="22" y2="18" stroke="#1e293b" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
  <line x1="41" y1="15" x2="38" y2="18" stroke="#1e293b" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
  <line x1="19" y1="37" x2="22" y2="34" stroke="#1e293b" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
  <line x1="41" y1="37" x2="38" y2="34" stroke="#1e293b" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
  <line x1="30" y1="26" x2="30" y2="10" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="30" cy="27" r="3.5" fill="#ef4444"/>
  <circle cx="29" cy="26" r="1" fill="#fca5a5" opacity="0.7"/>
  <rect x="24" y="50" width="12" height="7" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1.5"/>
  <line x1="25" y1="51.5" x2="25" y2="55.5" stroke="#64748b" stroke-width="0.8" opacity="0.5"/>
</svg>`;

export const LEVEL_GAUGE_SVG = `<svg width="100%" height="100%" viewBox="0 0 60 60" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="lgCaseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#1e293b;stop-opacity:1" />
      <stop offset="35%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="58%" style="stop-color:#7a94b0;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="lgLiquidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#38bdf8;stop-opacity:0.9" />
      <stop offset="100%" style="stop-color:#0ea5e9;stop-opacity:0.95" />
    </linearGradient>
  </defs>
  <rect x="14" y="6" width="32" height="48" rx="3" fill="url(#lgCaseGrad)" stroke="#1e293b" stroke-width="1.5"/>
  <path d="M 16 8 L 38 8" fill="none" stroke="#94a3b8" stroke-width="1" opacity="0.4" stroke-linecap="round"/>
  <rect x="18" y="10" width="24" height="40" rx="1" fill="#f8fafc" stroke="#94a3b8" stroke-width="1"/>
  <rect x="20" y="23" width="20" height="25" fill="url(#lgLiquidGrad)" opacity="0.9"/>
  <rect x="20" y="23" width="20" height="2" fill="#7dd3fc" opacity="0.7"/>
  <line x1="20" y1="16" x2="40" y2="16" stroke="#cbd5e1" stroke-width="1"/>
  <line x1="20" y1="22" x2="40" y2="22" stroke="#cbd5e1" stroke-width="1"/>
  <line x1="20" y1="28" x2="40" y2="28" stroke="#cbd5e1" stroke-width="1"/>
  <line x1="20" y1="34" x2="40" y2="34" stroke="#cbd5e1" stroke-width="1"/>
  <line x1="20" y1="40" x2="40" y2="40" stroke="#cbd5e1" stroke-width="1"/>
  <rect x="22" y="2" width="16" height="4" fill="#64748b" stroke="#1e293b" stroke-width="1"/>
  <rect x="22" y="54" width="16" height="4" fill="#64748b" stroke="#1e293b" stroke-width="1"/>
</svg>`;
