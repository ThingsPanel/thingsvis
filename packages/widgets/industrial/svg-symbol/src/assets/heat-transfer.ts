export const HEAT_EXCHANGER_SVG = `<svg width="100%" height="100%" viewBox="0 0 60 100" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="hxBody" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#334155;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="hxHot" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#f97316;stop-opacity:0.9" />
      <stop offset="100%" style="stop-color:#ea580c;stop-opacity:0.6" />
    </linearGradient>
    <linearGradient id="hxCold" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#06b6d4;stop-opacity:0.6" />
      <stop offset="100%" style="stop-color:#0891b2;stop-opacity:0.9" />
    </linearGradient>
  </defs>
  <rect x="18" y="0" width="24" height="8" fill="#64748b"/>
  <rect x="2" y="8" width="56" height="84" rx="28" ry="28" fill="url(#hxBody)" stroke="#1e293b" stroke-width="2"/>
  <ellipse cx="30" cy="8" rx="28" ry="5" fill="#64748b" stroke="#1e293b" stroke-width="1"/>
  <path d="M 10 24 Q 30 32 50 24" fill="none" stroke="url(#hxHot)" stroke-width="3" stroke-linecap="round"/>
  <path d="M 10 36 Q 30 44 50 36" fill="none" stroke="url(#hxHot)" stroke-width="3" stroke-linecap="round"/>
  <path d="M 10 64 Q 30 72 50 64" fill="none" stroke="url(#hxCold)" stroke-width="3" stroke-linecap="round"/>
  <path d="M 10 76 Q 30 84 50 76" fill="none" stroke="url(#hxCold)" stroke-width="3" stroke-linecap="round"/>
  <rect x="18" y="92" width="24" height="8" fill="#64748b"/>
  <ellipse cx="30" cy="92" rx="28" ry="5" fill="#334155" stroke="#1e293b" stroke-width="1"/>
</svg>`;

export const BOILER_SVG = `<svg width="100%" height="100%" viewBox="0 0 60 100" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="boilerBody" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#334155;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="18" y="0" width="24" height="8" fill="#64748b"/>
  <rect x="2" y="8" width="56" height="72" rx="4" fill="url(#boilerBody)" stroke="#1e293b" stroke-width="2"/>
  <ellipse cx="30" cy="8" rx="28" ry="5" fill="#64748b" stroke="#1e293b" stroke-width="1"/>
  <rect x="10" y="18" width="40" height="12" rx="2" fill="#0f172a" fill-opacity="0.5" stroke="#475569" stroke-width="1"/>
  <line x1="10" y1="24" x2="50" y2="24" stroke="#64748b" stroke-width="1"/>
  <circle cx="30" cy="50" r="8" fill="#0f172a" fill-opacity="0.5" stroke="#475569" stroke-width="1"/>
  <line x1="30" y1="50" x2="30" y2="44" stroke="#0ea5e9" stroke-width="2" stroke-linecap="round"/>
  <circle cx="30" cy="50" r="2.5" fill="#0ea5e9"/>
  <rect x="6" y="80" width="48" height="6" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1.5"/>
  <rect x="18" y="86" width="24" height="6" fill="#475569"/>
  <rect x="18" y="92" width="24" height="8" fill="#64748b"/>
</svg>`;
