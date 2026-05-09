export const HEAT_EXCHANGER_SVG = `<svg width="100%" height="100%" viewBox="0 0 110 78" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="hxShellGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#8aa2bd;stop-opacity:1" />
      <stop offset="42%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="hxPlateGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#334155;stop-opacity:1" />
      <stop offset="45%" style="stop-color:#94a3b8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#475569;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="hxPipeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#64748b;stop-opacity:1" />
      <stop offset="42%" style="stop-color:#94a3b8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="hxFlangeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#94a3b8;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#64748b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="hxHotGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#7f1d1d;stop-opacity:0.55" />
      <stop offset="50%" style="stop-color:#f97316;stop-opacity:0.9" />
      <stop offset="100%" style="stop-color:#b91c1c;stop-opacity:0.65" />
    </linearGradient>
    <linearGradient id="hxColdGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#1d4ed8;stop-opacity:0.75" />
      <stop offset="50%" style="stop-color:#38bdf8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0369a1;stop-opacity:0.85" />
    </linearGradient>
  </defs>
  <rect x="0" y="13" width="16" height="12" fill="url(#hxPipeGrad)"/>
  <line x1="0" y1="13" x2="16" y2="13" stroke="#94a3b8" stroke-width="1"/>
  <line x1="0" y1="25" x2="16" y2="25" stroke="#1e293b" stroke-width="1"/>
  <rect x="94" y="13" width="16" height="12" fill="url(#hxPipeGrad)"/>
  <line x1="94" y1="13" x2="110" y2="13" stroke="#94a3b8" stroke-width="1"/>
  <line x1="94" y1="25" x2="110" y2="25" stroke="#1e293b" stroke-width="1"/>
  <rect x="0" y="49" width="16" height="12" fill="url(#hxPipeGrad)"/>
  <line x1="0" y1="49" x2="16" y2="49" stroke="#94a3b8" stroke-width="1"/>
  <line x1="0" y1="61" x2="16" y2="61" stroke="#1e293b" stroke-width="1"/>
  <rect x="94" y="49" width="16" height="12" fill="url(#hxPipeGrad)"/>
  <line x1="94" y1="49" x2="110" y2="49" stroke="#94a3b8" stroke-width="1"/>
  <line x1="94" y1="61" x2="110" y2="61" stroke="#1e293b" stroke-width="1"/>

  <rect x="17" y="8" width="76" height="58" rx="5" fill="#0f172a" opacity="0.25"/>
  <rect x="17" y="6.5" width="76" height="58" rx="5" fill="url(#hxShellGrad)" stroke="#1e293b" stroke-width="1.5"/>
  <path d="M 21 9.5 L 89 9.5" fill="none" stroke="#cbd5e1" stroke-width="1" stroke-linecap="round" opacity="0.4"/>
  <rect x="15" y="5" width="8" height="62" rx="2" fill="url(#hxPlateGrad)" stroke="#1e293b" stroke-width="1.2"/>
  <rect x="87" y="5" width="8" height="62" rx="2" fill="url(#hxPlateGrad)" stroke="#1e293b" stroke-width="1.2"/>
  <line x1="17" y1="11" x2="17" y2="61" stroke="#cbd5e1" stroke-width="0.8" opacity="0.45"/>
  <line x1="89" y1="11" x2="89" y2="61" stroke="#cbd5e1" stroke-width="0.8" opacity="0.45"/>

  <path d="M 24 18 H 86" fill="none" stroke="url(#hxHotGrad)" stroke-width="2.4" stroke-linecap="round" opacity="0.78"/>
  <path d="M 24 30 H 86" fill="none" stroke="#64748b" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M 24 43 H 86" fill="none" stroke="#64748b" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M 24 56 H 86" fill="none" stroke="url(#hxColdGrad)" stroke-width="2.4" stroke-linecap="round" opacity="0.82"/>
  <circle cx="32" cy="18" r="1.1" fill="#fed7aa" opacity="0.6"/>
  <circle cx="64" cy="30" r="1.1" fill="#cbd5e1" opacity="0.45"/>
  <circle cx="47" cy="43" r="1.1" fill="#cbd5e1" opacity="0.45"/>
  <circle cx="76" cy="56" r="1.1" fill="#7dd3fc" opacity="0.65"/>

  <rect x="14" y="8" width="6" height="22" rx="1" fill="url(#hxFlangeGrad)" stroke="#1e293b" stroke-width="1"/>
  <line x1="15.5" y1="11" x2="15.5" y2="27" stroke="#94a3b8" stroke-width="0.8" opacity="0.55"/>
  <rect x="90" y="8" width="6" height="22" rx="1" fill="url(#hxFlangeGrad)" stroke="#1e293b" stroke-width="1"/>
  <line x1="94.5" y1="11" x2="94.5" y2="27" stroke="#94a3b8" stroke-width="0.8" opacity="0.55"/>
  <rect x="14" y="44" width="6" height="22" rx="1" fill="url(#hxFlangeGrad)" stroke="#1e293b" stroke-width="1"/>
  <line x1="15.5" y1="47" x2="15.5" y2="63" stroke="#94a3b8" stroke-width="0.8" opacity="0.55"/>
  <rect x="90" y="44" width="6" height="22" rx="1" fill="url(#hxFlangeGrad)" stroke="#1e293b" stroke-width="1"/>
  <line x1="94.5" y1="47" x2="94.5" y2="63" stroke="#94a3b8" stroke-width="0.8" opacity="0.55"/>
  <rect x="22" y="66" width="8" height="8" fill="#475569" stroke="#1e293b" stroke-width="1"/>
  <rect x="80" y="66" width="8" height="8" fill="#475569" stroke="#1e293b" stroke-width="1"/>
  <rect x="18" y="73" width="16" height="3" rx="1" fill="#64748b" stroke="#1e293b" stroke-width="0.8"/>
  <rect x="76" y="73" width="16" height="3" rx="1" fill="#64748b" stroke="#1e293b" stroke-width="0.8"/>
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
