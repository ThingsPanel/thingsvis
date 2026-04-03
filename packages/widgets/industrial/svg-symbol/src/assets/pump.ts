export const CENTRIFUGAL_PUMP_SVG = `<svg width="100%" height="100%" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="pumpGrad" cx="38%" cy="32%" r="62%">
      <stop offset="0%" style="stop-color:#7a94b0;stop-opacity:1" />
      <stop offset="55%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
    </radialGradient>
    <linearGradient id="pumpPipeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#64748b;stop-opacity:1" />
      <stop offset="42%" style="stop-color:#94a3b8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="pumpFlangeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#64748b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2d3f54;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="pumpBladeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#38bdf8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0369a1;stop-opacity:0.88" />
    </linearGradient>
  </defs>
  <rect x="0" y="24" width="16" height="12" fill="url(#pumpPipeGrad)"/>
  <line x1="0" y1="24" x2="16" y2="24" stroke="#94a3b8" stroke-width="1"/>
  <line x1="0" y1="36" x2="16" y2="36" stroke="#1e293b" stroke-width="1"/>
  <rect x="15" y="19" width="6" height="22" rx="1" fill="url(#pumpFlangeGrad)" stroke="#1e293b" stroke-width="1"/>
  <line x1="16.5" y1="22" x2="16.5" y2="38" stroke="#94a3b8" stroke-width="0.8" opacity="0.5"/>
  <rect x="84" y="24" width="16" height="12" fill="url(#pumpPipeGrad)"/>
  <line x1="84" y1="24" x2="100" y2="24" stroke="#94a3b8" stroke-width="1"/>
  <line x1="84" y1="36" x2="100" y2="36" stroke="#1e293b" stroke-width="1"/>
  <rect x="79" y="19" width="6" height="22" rx="1" fill="url(#pumpFlangeGrad)" stroke="#1e293b" stroke-width="1"/>
  <line x1="83.5" y1="22" x2="83.5" y2="38" stroke="#94a3b8" stroke-width="0.8" opacity="0.5"/>
  <circle cx="50" cy="31.5" r="24" fill="#0f172a" opacity="0.22"/>
  <circle cx="50" cy="30" r="24" fill="url(#pumpGrad)" stroke="#1e293b" stroke-width="1.5"/>
  <path d="M 31 19 A 24 24 0 0 1 60 8" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
  <g id="tv-rotor">
    <path d="M 50 30 C 49 21 53 14 50 14 Q 62 21 50 30" fill="url(#pumpBladeGrad)" opacity="0.92"/>
    <path d="M 50 30 C 59 29 66 33 66 30 Q 59 44 50 30" fill="url(#pumpBladeGrad)" opacity="0.82"/>
    <path d="M 50 30 C 51 39 47 46 50 46 Q 38 39 50 30" fill="url(#pumpBladeGrad)" opacity="0.92"/>
    <path d="M 50 30 C 41 31 34 27 34 30 Q 41 16 50 30" fill="url(#pumpBladeGrad)" opacity="0.82"/>
    <circle cx="50" cy="30" r="7.5" fill="#1e293b" stroke="#1e293b" stroke-width="1"/>
    <circle cx="50" cy="30" r="5.5" fill="#475569" stroke="#0f172a" stroke-width="1"/>
    <circle cx="48.5" cy="28.5" r="1.8" fill="#94a3b8" opacity="0.6"/>
    <circle cx="50" cy="30" r="2" fill="#0f172a"/>
  </g>
</svg>`;

export const INLINE_PUMP_SVG = `<svg width="100%" height="100%" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="inlineBodyGrad" cx="35%" cy="30%" r="65%">
      <stop offset="0%" style="stop-color:#7a94b0;stop-opacity:1" />
      <stop offset="55%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
    </radialGradient>
    <radialGradient id="inlineMotorGrad" cx="38%" cy="30%" r="62%">
      <stop offset="0%" style="stop-color:#6e86a4;stop-opacity:1" />
      <stop offset="55%" style="stop-color:#3d5068;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
    </radialGradient>
    <linearGradient id="inlinePipeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#64748b;stop-opacity:1" />
      <stop offset="42%" style="stop-color:#94a3b8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="0" y="24" width="16" height="12" fill="url(#inlinePipeGrad)"/>
  <line x1="0" y1="24" x2="16" y2="24" stroke="#94a3b8" stroke-width="1"/>
  <line x1="0" y1="36" x2="16" y2="36" stroke="#1e293b" stroke-width="1"/>
  <rect x="15" y="19" width="5" height="22" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1"/>
  <rect x="84" y="24" width="16" height="12" fill="url(#inlinePipeGrad)"/>
  <line x1="84" y1="24" x2="100" y2="24" stroke="#94a3b8" stroke-width="1"/>
  <line x1="84" y1="36" x2="100" y2="36" stroke="#1e293b" stroke-width="1"/>
  <rect x="80" y="19" width="5" height="22" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1"/>
  <rect x="20" y="11.5" width="62" height="40" rx="4" fill="#0f172a" opacity="0.2"/>
  <rect x="20" y="10" width="62" height="40" rx="4" fill="url(#inlineBodyGrad)" stroke="#1e293b" stroke-width="1.5"/>
  <path d="M 22 12 L 72 12" fill="none" stroke="#94a3b8" stroke-width="1" stroke-linecap="round" opacity="0.45"/>
  <rect x="36" y="6" width="28" height="48" rx="3" fill="url(#inlineMotorGrad)" stroke="#1e293b" stroke-width="1.5"/>
  <path d="M 38 8 L 58 8" fill="none" stroke="#7a94b0" stroke-width="1" stroke-linecap="round" opacity="0.45"/>
  <line x1="42" y1="7" x2="42" y2="53" stroke="#1e293b" stroke-width="0.8" opacity="0.4"/>
  <line x1="50" y1="7" x2="50" y2="53" stroke="#1e293b" stroke-width="0.8" opacity="0.4"/>
  <line x1="58" y1="7" x2="58" y2="53" stroke="#1e293b" stroke-width="0.8" opacity="0.4"/>
  <rect x="43" y="2" width="14" height="5" rx="1" fill="#64748b" stroke="#1e293b" stroke-width="1"/>
  <circle cx="50" cy="30" r="4" fill="#0ea5e9" opacity="0.85"/>
  <circle cx="49" cy="29" r="1.5" fill="#7dd3fc" opacity="0.65"/>
</svg>`;
