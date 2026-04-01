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
  <rect x="26" y="0" width="8" height="10" fill="#475569"/>
  <rect x="15" y="10" width="30" height="80" rx="15" ry="15" fill="url(#hxBody)" stroke="#1e293b" stroke-width="2"/>
  <ellipse cx="30" cy="10" rx="15" ry="4" fill="#475569" stroke="#1e293b" stroke-width="1"/>
  <path d="M 20 22 Q 30 27 40 22" fill="none" stroke="url(#hxHot)" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M 20 32 Q 30 37 40 32" fill="none" stroke="url(#hxHot)" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M 20 62 Q 30 67 40 62" fill="none" stroke="url(#hxCold)" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M 20 72 Q 30 77 40 72" fill="none" stroke="url(#hxCold)" stroke-width="2.5" stroke-linecap="round"/>
  <rect x="26" y="90" width="8" height="10" fill="#475569"/>
  <ellipse cx="30" cy="90" rx="15" ry="4" fill="#334155" stroke="#1e293b" stroke-width="1"/>
</svg>`;

export const BOILER_SVG = `<svg width="100%" height="100%" viewBox="0 0 60 100" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="boilerBody" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#334155;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="26" y="0" width="8" height="10" fill="#475569"/>
  <rect x="12" y="10" width="36" height="68" rx="6" fill="url(#boilerBody)" stroke="#1e293b" stroke-width="2"/>
  <ellipse cx="30" cy="10" rx="18" ry="5" fill="#475569" stroke="#1e293b" stroke-width="1"/>
  <rect x="18" y="18" width="24" height="10" rx="2" fill="#0f172a" fill-opacity="0.4" stroke="#475569" stroke-width="0.8"/>
  <line x1="18" y1="22" x2="42" y2="22" stroke="#64748b" stroke-width="1"/>
  <circle cx="30" cy="45" r="6" fill="#0f172a" fill-opacity="0.5" stroke="#475569" stroke-width="1"/>
  <circle cx="30" cy="45" r="2.5" fill="#0ea5e9"/>
  <rect x="18" y="78" width="24" height="6" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1.5"/>
  <rect x="24" y="84" width="12" height="6" fill="#475569"/>
  <rect x="26" y="90" width="8" height="10" fill="#475569"/>
  <ellipse cx="30" cy="90" rx="8" ry="3" fill="#334155" stroke="#1e293b" stroke-width="1"/>
</svg>`;
