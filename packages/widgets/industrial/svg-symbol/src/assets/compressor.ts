export const FAN_SVG = `<svg width="100%" height="100%" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="fanHousingGrad" cx="38%" cy="32%" r="62%">
      <stop offset="0%" style="stop-color:#6e86a4;stop-opacity:1" />
      <stop offset="55%" style="stop-color:#3d5068;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
    </radialGradient>
    <linearGradient id="fanPipeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#64748b;stop-opacity:1" />
      <stop offset="42%" style="stop-color:#94a3b8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="fanBladeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#38bdf8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0369a1;stop-opacity:0.88" />
    </linearGradient>
  </defs>
  <rect x="0" y="24" width="16" height="12" fill="url(#fanPipeGrad)"/>
  <line x1="0" y1="24" x2="16" y2="24" stroke="#94a3b8" stroke-width="1"/>
  <line x1="0" y1="36" x2="16" y2="36" stroke="#1e293b" stroke-width="1"/>
  <rect x="15" y="19" width="5" height="22" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1"/>
  <rect x="84" y="24" width="16" height="12" fill="url(#fanPipeGrad)"/>
  <line x1="84" y1="24" x2="100" y2="24" stroke="#94a3b8" stroke-width="1"/>
  <line x1="84" y1="36" x2="100" y2="36" stroke="#1e293b" stroke-width="1"/>
  <rect x="80" y="19" width="5" height="22" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1"/>
  <rect x="20" y="8.5" width="60" height="44" rx="4" fill="#0f172a" opacity="0.2"/>
  <rect x="20" y="7" width="60" height="44" rx="4" fill="url(#fanHousingGrad)" stroke="#1e293b" stroke-width="1.5"/>
  <path d="M 22 9 L 58 9" fill="none" stroke="#94a3b8" stroke-width="1" opacity="0.4" stroke-linecap="round"/>
  <circle cx="50" cy="29" r="17" fill="none" stroke="#1e293b" stroke-width="1.2"/>
  <g id="tv-rotor">
    <path d="M 50 29 C 49 20 53 13 50 13 Q 62 20 50 29" fill="url(#fanBladeGrad)" opacity="0.9"/>
    <path d="M 50 29 C 59 28 66 32 66 29 Q 59 43 50 29" fill="url(#fanBladeGrad)" opacity="0.8"/>
    <path d="M 50 29 C 51 38 47 45 50 45 Q 38 38 50 29" fill="url(#fanBladeGrad)" opacity="0.9"/>
    <path d="M 50 29 C 41 30 34 26 34 29 Q 41 15 50 29" fill="url(#fanBladeGrad)" opacity="0.8"/>
    <path d="M 50 29 C 56 19 62 22 57 27 Q 56 22 50 29" fill="url(#fanBladeGrad)" opacity="0.85"/>
    <path d="M 50 29 C 60 35 57 42 52 40 Q 57 38 50 29" fill="url(#fanBladeGrad)" opacity="0.85"/>
    <path d="M 50 29 C 44 39 38 36 43 31 Q 44 36 50 29" fill="url(#fanBladeGrad)" opacity="0.85"/>
    <path d="M 50 29 C 40 23 43 16 48 18 Q 43 22 50 29" fill="url(#fanBladeGrad)" opacity="0.85"/>
    <circle cx="50" cy="29" r="5.5" fill="#1e293b" stroke="#1e293b" stroke-width="1"/>
    <circle cx="50" cy="29" r="3.5" fill="#475569" stroke="#0f172a" stroke-width="0.8"/>
    <circle cx="48.8" cy="27.8" r="1.2" fill="#94a3b8" opacity="0.6"/>
  </g>
</svg>`;

export const AIR_COMPRESSOR_SVG = `<svg width="100%" height="100%" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="acTankGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#64748b;stop-opacity:1" />
      <stop offset="40%" style="stop-color:#7a94b0;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
    </linearGradient>
    <radialGradient id="acMotorGrad" cx="35%" cy="30%" r="65%">
      <stop offset="0%" style="stop-color:#6e86a4;stop-opacity:1" />
      <stop offset="55%" style="stop-color:#3d5068;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
    </radialGradient>
    <linearGradient id="acPipeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#64748b;stop-opacity:1" />
      <stop offset="42%" style="stop-color:#94a3b8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="0" y="24" width="16" height="12" fill="url(#acPipeGrad)"/>
  <line x1="0" y1="24" x2="16" y2="24" stroke="#94a3b8" stroke-width="1"/>
  <line x1="0" y1="36" x2="16" y2="36" stroke="#1e293b" stroke-width="1"/>
  <rect x="15" y="19" width="5" height="22" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1"/>
  <rect x="84" y="24" width="16" height="12" fill="url(#acPipeGrad)"/>
  <line x1="84" y1="24" x2="100" y2="24" stroke="#94a3b8" stroke-width="1"/>
  <line x1="84" y1="36" x2="100" y2="36" stroke="#1e293b" stroke-width="1"/>
  <rect x="80" y="19" width="5" height="22" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1"/>
  <rect x="20" y="10.5" width="38" height="40" rx="4" fill="#0f172a" opacity="0.2"/>
  <rect x="20" y="9" width="38" height="40" rx="4" fill="url(#acTankGrad)" stroke="#1e293b" stroke-width="1.5"/>
  <path d="M 22 11 L 48 11" fill="none" stroke="#94a3b8" stroke-width="1" opacity="0.4" stroke-linecap="round"/>
  <rect x="52" y="5.5" width="27" height="49" rx="2" fill="#0f172a" opacity="0.2"/>
  <rect x="52" y="4" width="27" height="49" rx="2" fill="url(#acMotorGrad)" stroke="#1e293b" stroke-width="1.5"/>
  <path d="M 54 6 L 72 6" fill="none" stroke="#7a94b0" stroke-width="1" opacity="0.4" stroke-linecap="round"/>
  <line x1="57" y1="5" x2="57" y2="53" stroke="#1e293b" stroke-width="0.8" opacity="0.35"/>
  <line x1="65" y1="5" x2="65" y2="53" stroke="#1e293b" stroke-width="0.8" opacity="0.35"/>
  <circle cx="34" cy="22" r="5.5" fill="#f8fafc" stroke="#94a3b8" stroke-width="1"/>
  <circle cx="32.5" cy="20.5" r="1.5" fill="#94a3b8" opacity="0.5"/>
  <line cx="34" cy="22" x1="34" y1="22" x2="34" y2="15" stroke="#0ea5e9" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="34" cy="22" r="1.5" fill="#0ea5e9"/>
  <rect x="57" y="25" width="11" height="15" rx="1" fill="#64748b" stroke="#1e293b" stroke-width="1.2"/>
  <line x1="62.5" y1="25" x2="62.5" y2="40" stroke="#1e293b" stroke-width="0.8"/>
  <circle cx="73" cy="18" r="2.5" fill="#0ea5e9" opacity="0.85"/>
</svg>`;
