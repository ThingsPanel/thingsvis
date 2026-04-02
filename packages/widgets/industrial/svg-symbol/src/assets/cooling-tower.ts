export const COOLING_TOWER_SVG = `<svg width="100%" height="100%" viewBox="0 0 60 100" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ctBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#1e293b;stop-opacity:1" />
      <stop offset="30%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="55%" style="stop-color:#7a94b0;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
    <radialGradient id="ctTopGrad" cx="38%" cy="35%" r="62%">
      <stop offset="0%" style="stop-color:#7a94b0;stop-opacity:1" />
      <stop offset="55%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
    </radialGradient>
  </defs>
  <rect x="18" y="2" width="24" height="6" fill="#64748b"/>
  <path d="M 6 20.5 L 54 20.5 L 44 92.5 L 16 92.5 Z" fill="#0f172a" opacity="0.2"/>
  <path d="M 6 20 L 54 20 L 44 92 L 16 92 Z" fill="url(#ctBodyGrad)" stroke="#1e293b" stroke-width="1.5"/>
  <ellipse cx="30" cy="20" rx="24" ry="5" fill="url(#ctTopGrad)" stroke="#1e293b" stroke-width="1"/>
  <path d="M 9 20 L 9 85" fill="none" stroke="#94a3b8" stroke-width="0.8" opacity="0.3" stroke-linecap="round"/>
  <line x1="8" y1="38" x2="52" y2="38" stroke="#1e293b" stroke-width="1" opacity="0.35"/>
  <line x1="10" y1="58" x2="50" y2="58" stroke="#1e293b" stroke-width="1" opacity="0.35"/>
  <line x1="12" y1="78" x2="48" y2="78" stroke="#1e293b" stroke-width="1" opacity="0.35"/>
  <circle cx="30" cy="30" r="5.5" fill="none" stroke="#0ea5e9" stroke-width="1.5"/>
  <circle cx="28.5" cy="28.5" r="1.5" fill="#0ea5e9" opacity="0.4"/>
  <path d="M 30 24.5 L 30 20.5 M 30 35.5 L 30 39.5 M 24.5 30 L 20.5 30 M 35.5 30 L 39.5 30" stroke="#0ea5e9" stroke-width="1.5" stroke-linecap="round"/>
  <rect x="18" y="92" width="24" height="6" fill="#475569"/>
</svg>`;
