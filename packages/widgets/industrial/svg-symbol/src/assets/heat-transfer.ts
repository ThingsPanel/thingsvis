export const HEAT_EXCHANGER_SVG = `<svg width="100%" height="100%" viewBox="0 0 60 100" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="hxBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#1e293b;stop-opacity:1" />
      <stop offset="30%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="55%" style="stop-color:#7a94b0;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
    <radialGradient id="hxCapGrad" cx="38%" cy="35%" r="62%">
      <stop offset="0%" style="stop-color:#7a94b0;stop-opacity:1" />
      <stop offset="55%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
    </radialGradient>
    <linearGradient id="hxHot" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#fb923c;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ea580c;stop-opacity:0.7" />
    </linearGradient>
    <linearGradient id="hxCold" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#22d3ee;stop-opacity:0.7" />
      <stop offset="100%" style="stop-color:#0891b2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="18" y="2" width="24" height="6" fill="#64748b"/>
  <rect x="2" y="8.5" width="56" height="84" rx="28" ry="28" fill="#0f172a" opacity="0.2"/>
  <rect x="2" y="8" width="56" height="84" rx="28" ry="28" fill="url(#hxBodyGrad)" stroke="#1e293b" stroke-width="1.5"/>
  <ellipse cx="30" cy="8" rx="28" ry="5" fill="url(#hxCapGrad)" stroke="#1e293b" stroke-width="1"/>
  <path d="M 5 24 L 5 72" fill="none" stroke="#94a3b8" stroke-width="0.8" opacity="0.3" stroke-linecap="round"/>
  <path d="M 10 24 Q 30 32 50 24" fill="none" stroke="url(#hxHot)" stroke-width="3" stroke-linecap="round"/>
  <path d="M 10 36 Q 30 44 50 36" fill="none" stroke="url(#hxHot)" stroke-width="3" stroke-linecap="round"/>
  <path d="M 10 62 Q 30 70 50 62" fill="none" stroke="url(#hxCold)" stroke-width="3" stroke-linecap="round"/>
  <path d="M 10 74 Q 30 82 50 74" fill="none" stroke="url(#hxCold)" stroke-width="3" stroke-linecap="round"/>
  <rect x="18" y="92" width="24" height="6" fill="#64748b"/>
  <ellipse cx="30" cy="92" rx="28" ry="5" fill="#334155" stroke="#1e293b" stroke-width="1"/>
</svg>`;

export const BOILER_SVG = `<svg width="100%" height="100%" viewBox="0 0 60 100" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="boilerBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#1e293b;stop-opacity:1" />
      <stop offset="30%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="55%" style="stop-color:#7a94b0;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
    <radialGradient id="boilerCapGrad" cx="38%" cy="35%" r="62%">
      <stop offset="0%" style="stop-color:#7a94b0;stop-opacity:1" />
      <stop offset="55%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
    </radialGradient>
  </defs>
  <rect x="18" y="2" width="24" height="6" fill="#64748b"/>
  <rect x="2" y="8.5" width="56" height="72" rx="4" fill="#0f172a" opacity="0.2"/>
  <rect x="2" y="8" width="56" height="72" rx="4" fill="url(#boilerBodyGrad)" stroke="#1e293b" stroke-width="1.5"/>
  <ellipse cx="30" cy="8" rx="28" ry="5" fill="url(#boilerCapGrad)" stroke="#1e293b" stroke-width="1"/>
  <path d="M 5 22 L 5 70" fill="none" stroke="#94a3b8" stroke-width="0.8" opacity="0.3" stroke-linecap="round"/>
  <rect x="10" y="18" width="40" height="12" rx="2" fill="#0f172a" fill-opacity="0.5" stroke="#475569" stroke-width="1"/>
  <line x1="10" y1="24" x2="50" y2="24" stroke="#64748b" stroke-width="1"/>
  <circle cx="30" cy="50" r="9" fill="#0f172a" fill-opacity="0.5" stroke="#475569" stroke-width="1.2"/>
  <circle cx="28.5" cy="48.5" r="2.5" fill="#475569" opacity="0.4"/>
  <line x1="30" y1="50" x2="30" y2="43" stroke="#0ea5e9" stroke-width="2" stroke-linecap="round"/>
  <circle cx="30" cy="50" r="2.5" fill="#0ea5e9"/>
  <line x1="8" y1="38" x2="52" y2="38" stroke="#1e293b" stroke-width="0.8" opacity="0.3"/>
  <rect x="6" y="80" width="48" height="6" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1.5"/>
  <rect x="18" y="86" width="24" height="6" fill="#475569"/>
  <rect x="18" y="92" width="24" height="6" fill="#64748b"/>
</svg>`;
