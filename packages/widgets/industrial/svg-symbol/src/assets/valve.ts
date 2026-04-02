export const BALL_VALVE_SVG = `<svg width="100%" height="100%" viewBox="0 -10 100 70" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="ballValveGrad" cx="36%" cy="30%" r="64%">
      <stop offset="0%" style="stop-color:#7a94b0;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
    </radialGradient>
    <radialGradient id="ballDiscGrad" cx="34%" cy="30%" r="65%">
      <stop offset="0%" style="stop-color:#94a3b8;stop-opacity:1" />
      <stop offset="55%" style="stop-color:#64748b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
    </radialGradient>
    <linearGradient id="bvPipeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#64748b;stop-opacity:1" />
      <stop offset="42%" style="stop-color:#94a3b8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="bvStemGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="40%" style="stop-color:#94a3b8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#475569;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="0" y="24" width="16" height="12" fill="url(#bvPipeGrad)"/>
  <line x1="0" y1="24" x2="16" y2="24" stroke="#94a3b8" stroke-width="1"/>
  <line x1="0" y1="36" x2="16" y2="36" stroke="#1e293b" stroke-width="1"/>
  <rect x="15" y="19" width="6" height="22" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1"/>
  <line x1="16.5" y1="22" x2="16.5" y2="38" stroke="#94a3b8" stroke-width="0.8" opacity="0.5"/>
  <rect x="84" y="24" width="16" height="12" fill="url(#bvPipeGrad)"/>
  <line x1="84" y1="24" x2="100" y2="24" stroke="#94a3b8" stroke-width="1"/>
  <line x1="84" y1="36" x2="100" y2="36" stroke="#1e293b" stroke-width="1"/>
  <rect x="79" y="19" width="6" height="22" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1"/>
  <line x1="83.5" y1="22" x2="83.5" y2="38" stroke="#94a3b8" stroke-width="0.8" opacity="0.5"/>
  <circle cx="50" cy="31.5" r="24" fill="#0f172a" opacity="0.22"/>
  <circle cx="50" cy="30" r="24" fill="url(#ballValveGrad)" stroke="#1e293b" stroke-width="1.5"/>
  <path d="M 33 18 A 24 24 0 0 1 62 8" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
  <circle cx="50" cy="30" r="13" fill="url(#ballDiscGrad)" stroke="#1e293b" stroke-width="1.5"/>
  <ellipse cx="46" cy="26" rx="3.5" ry="2.5" fill="white" opacity="0.14"/>
  <rect x="46" y="7" width="8" height="6" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1.5"/>
  <line x1="47" y1="8.5" x2="47" y2="11.5" stroke="#94a3b8" stroke-width="0.8" opacity="0.6"/>
  <rect x="48" y="-1" width="4" height="8" fill="url(#bvStemGrad)" stroke="#1e293b" stroke-width="1"/>
  <rect x="46" y="-4" width="8" height="4" rx="1.5" fill="#64748b" stroke="#1e293b" stroke-width="1"/>
  <rect x="34" y="-9" width="32" height="5" rx="2.5" fill="#94a3b8" stroke="#1e293b" stroke-width="1.2"/>
  <circle cx="40" cy="-6.5" r="1" fill="#475569" opacity="0.55"/>
  <circle cx="50" cy="-6.5" r="1" fill="#475569" opacity="0.55"/>
  <circle cx="60" cy="-6.5" r="1" fill="#475569" opacity="0.55"/>
</svg>`;

export const GATE_VALVE_SVG = `<svg width="100%" height="100%" viewBox="0 -10 100 70" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="gateValveGrad" cx="36%" cy="32%" r="64%">
      <stop offset="0%" style="stop-color:#7a94b0;stop-opacity:1" />
      <stop offset="52%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
    </radialGradient>
    <linearGradient id="gvPipeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#64748b;stop-opacity:1" />
      <stop offset="42%" style="stop-color:#94a3b8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="gvStemGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="40%" style="stop-color:#94a3b8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#475569;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="0" y="24" width="16" height="12" fill="url(#gvPipeGrad)"/>
  <line x1="0" y1="24" x2="16" y2="24" stroke="#94a3b8" stroke-width="1"/>
  <line x1="0" y1="36" x2="16" y2="36" stroke="#1e293b" stroke-width="1"/>
  <rect x="15" y="19" width="6" height="22" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1"/>
  <line x1="16.5" y1="22" x2="16.5" y2="38" stroke="#94a3b8" stroke-width="0.8" opacity="0.5"/>
  <rect x="84" y="24" width="16" height="12" fill="url(#gvPipeGrad)"/>
  <line x1="84" y1="24" x2="100" y2="24" stroke="#94a3b8" stroke-width="1"/>
  <line x1="84" y1="36" x2="100" y2="36" stroke="#1e293b" stroke-width="1"/>
  <rect x="79" y="19" width="6" height="22" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1"/>
  <line x1="83.5" y1="22" x2="83.5" y2="38" stroke="#94a3b8" stroke-width="0.8" opacity="0.5"/>
  <path d="M 21 31.5 L 50 5.5 L 79 31.5 L 50 57.5 Z" fill="#0f172a" opacity="0.22"/>
  <path d="M 21 30 L 50 4 L 79 30 L 50 56 Z" fill="url(#gateValveGrad)" stroke="#1e293b" stroke-width="1.5"/>
  <path d="M 29 17 L 50 5" fill="none" stroke="#94a3b8" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>
  <rect x="46" y="7" width="8" height="6" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1.5"/>
  <line x1="47" y1="8.5" x2="47" y2="11.5" stroke="#94a3b8" stroke-width="0.8" opacity="0.6"/>
  <rect x="48" y="-1" width="4" height="8" fill="url(#gvStemGrad)" stroke="#1e293b" stroke-width="1"/>
  <circle cx="50" cy="-5" r="6" fill="none" stroke="#94a3b8" stroke-width="2"/>
  <line x1="50" y1="-11" x2="50" y2="-9" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="50" y1="1" x2="50" y2="3" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="44" y1="-5" x2="46" y2="-5" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="54" y1="-5" x2="56" y2="-5" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="50" cy="-5" r="2" fill="#64748b"/>
</svg>`;

export const GLOBE_VALVE_SVG = `<svg width="100%" height="100%" viewBox="0 -10 100 70" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="globeValveGrad" cx="36%" cy="30%" r="64%">
      <stop offset="0%" style="stop-color:#7a94b0;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
    </radialGradient>
    <linearGradient id="gloVPipeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#64748b;stop-opacity:1" />
      <stop offset="42%" style="stop-color:#94a3b8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="gloVStemGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="40%" style="stop-color:#94a3b8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#475569;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="0" y="24" width="16" height="12" fill="url(#gloVPipeGrad)"/>
  <line x1="0" y1="24" x2="16" y2="24" stroke="#94a3b8" stroke-width="1"/>
  <line x1="0" y1="36" x2="16" y2="36" stroke="#1e293b" stroke-width="1"/>
  <rect x="15" y="19" width="6" height="22" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1"/>
  <line x1="16.5" y1="22" x2="16.5" y2="38" stroke="#94a3b8" stroke-width="0.8" opacity="0.5"/>
  <rect x="84" y="24" width="16" height="12" fill="url(#gloVPipeGrad)"/>
  <line x1="84" y1="24" x2="100" y2="24" stroke="#94a3b8" stroke-width="1"/>
  <line x1="84" y1="36" x2="100" y2="36" stroke="#1e293b" stroke-width="1"/>
  <rect x="79" y="19" width="6" height="22" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1"/>
  <line x1="83.5" y1="22" x2="83.5" y2="38" stroke="#94a3b8" stroke-width="0.8" opacity="0.5"/>
  <circle cx="50" cy="31.5" r="24" fill="#0f172a" opacity="0.22"/>
  <circle cx="50" cy="30" r="24" fill="url(#globeValveGrad)" stroke="#1e293b" stroke-width="1.5"/>
  <path d="M 33 18 A 24 24 0 0 1 62 8" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
  <path d="M 34 30 Q 50 18 66 30" fill="none" stroke="#64748b" stroke-width="3" stroke-linecap="round"/>
  <path d="M 34 30 Q 50 19 66 30" fill="none" stroke="#94a3b8" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
  <rect x="46" y="7" width="8" height="6" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1.5"/>
  <line x1="47" y1="8.5" x2="47" y2="11.5" stroke="#94a3b8" stroke-width="0.8" opacity="0.6"/>
  <rect x="48" y="-1" width="4" height="8" fill="url(#gloVStemGrad)" stroke="#1e293b" stroke-width="1"/>
  <rect x="46" y="-4" width="8" height="4" rx="1.5" fill="#64748b" stroke="#1e293b" stroke-width="1"/>
  <rect x="34" y="-9" width="32" height="5" rx="2.5" fill="#94a3b8" stroke="#1e293b" stroke-width="1.2"/>
  <circle cx="40" cy="-6.5" r="1" fill="#475569" opacity="0.55"/>
  <circle cx="50" cy="-6.5" r="1" fill="#475569" opacity="0.55"/>
  <circle cx="60" cy="-6.5" r="1" fill="#475569" opacity="0.55"/>
</svg>`;

export const CHECK_VALVE_SVG = `<svg width="100%" height="100%" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="checkValveBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#5e728a;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="checkValveFlapGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="chkPipeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#64748b;stop-opacity:1" />
      <stop offset="42%" style="stop-color:#94a3b8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="0" y="24" width="16" height="12" fill="url(#chkPipeGrad)"/>
  <line x1="0" y1="24" x2="16" y2="24" stroke="#94a3b8" stroke-width="1"/>
  <line x1="0" y1="36" x2="16" y2="36" stroke="#1e293b" stroke-width="1"/>
  <rect x="15" y="19" width="6" height="22" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1"/>
  <line x1="16.5" y1="22" x2="16.5" y2="38" stroke="#94a3b8" stroke-width="0.8" opacity="0.5"/>
  <rect x="84" y="24" width="16" height="12" fill="url(#chkPipeGrad)"/>
  <line x1="84" y1="24" x2="100" y2="24" stroke="#94a3b8" stroke-width="1"/>
  <line x1="84" y1="36" x2="100" y2="36" stroke="#1e293b" stroke-width="1"/>
  <rect x="79" y="19" width="6" height="22" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1"/>
  <line x1="83.5" y1="22" x2="83.5" y2="38" stroke="#94a3b8" stroke-width="0.8" opacity="0.5"/>
  <rect x="21" y="18" width="58" height="24" rx="1" fill="url(#checkValveBodyGrad)" stroke="#1e293b" stroke-width="1.5"/>
  <line x1="21" y1="19" x2="79" y2="19" stroke="#94a3b8" stroke-width="0.8" opacity="0.4"/>
  <line x1="50" y1="18" x2="50" y2="42" stroke="#1e293b" stroke-width="2"/>
  <path d="M 50 18 L 70 30 L 50 42 Z" fill="url(#checkValveFlapGrad)" stroke="#1e293b" stroke-width="1.5"/>
  <line x1="50" y1="18" x2="70" y2="30" stroke="#94a3b8" stroke-width="0.8" opacity="0.5"/>
  <circle cx="50" cy="30" r="3" fill="#1e293b" stroke="#475569" stroke-width="1"/>
  <circle cx="50" cy="30" r="1.5" fill="#64748b"/>
</svg>`;

export const BUTTERFLY_VALVE_SVG = `<svg width="100%" height="100%" viewBox="0 -10 100 70" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="butterflyValveGrad" cx="36%" cy="30%" r="64%">
      <stop offset="0%" style="stop-color:#7a94b0;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
    </radialGradient>
    <linearGradient id="bflyPipeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#64748b;stop-opacity:1" />
      <stop offset="42%" style="stop-color:#94a3b8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="bflyStemGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="40%" style="stop-color:#94a3b8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#475569;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="0" y="24" width="16" height="12" fill="url(#bflyPipeGrad)"/>
  <line x1="0" y1="24" x2="16" y2="24" stroke="#94a3b8" stroke-width="1"/>
  <line x1="0" y1="36" x2="16" y2="36" stroke="#1e293b" stroke-width="1"/>
  <rect x="15" y="19" width="6" height="22" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1"/>
  <line x1="16.5" y1="22" x2="16.5" y2="38" stroke="#94a3b8" stroke-width="0.8" opacity="0.5"/>
  <rect x="84" y="24" width="16" height="12" fill="url(#bflyPipeGrad)"/>
  <line x1="84" y1="24" x2="100" y2="24" stroke="#94a3b8" stroke-width="1"/>
  <line x1="84" y1="36" x2="100" y2="36" stroke="#1e293b" stroke-width="1"/>
  <rect x="79" y="19" width="6" height="22" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1"/>
  <line x1="83.5" y1="22" x2="83.5" y2="38" stroke="#94a3b8" stroke-width="0.8" opacity="0.5"/>
  <circle cx="50" cy="31.5" r="24" fill="#0f172a" opacity="0.22"/>
  <circle cx="50" cy="30" r="24" fill="url(#butterflyValveGrad)" stroke="#1e293b" stroke-width="1.5"/>
  <path d="M 33 18 A 24 24 0 0 1 62 8" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
  <line x1="21" y1="30" x2="79" y2="30" stroke="#1e293b" stroke-width="2"/>
  <path d="M 50 10 Q 58 20 58 30 Q 58 40 50 50" fill="none" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M 50 10 Q 42 20 42 30 Q 42 40 50 50" fill="none" stroke="#64748b" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="50" cy="30" r="3" fill="#1e293b" stroke="#475569" stroke-width="1"/>
  <rect x="47" y="7" width="6" height="6" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1.5"/>
  <rect x="48" y="-1" width="4" height="8" fill="url(#bflyStemGrad)" stroke="#1e293b" stroke-width="1"/>
  <rect x="42" y="-8" width="16" height="8" rx="2" fill="#94a3b8" stroke="#1e293b" stroke-width="1.2"/>
  <circle cx="50" cy="-4" r="2.5" fill="#475569" stroke="#1e293b" stroke-width="1"/>
</svg>`;
