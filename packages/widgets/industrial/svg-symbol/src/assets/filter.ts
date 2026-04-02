export const Y_FILTER_SVG = `<svg width="100%" height="100%" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="yFilterBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#64748b;stop-opacity:1" />
      <stop offset="40%" style="stop-color:#7a94b0;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="yFilterPipeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#64748b;stop-opacity:1" />
      <stop offset="42%" style="stop-color:#94a3b8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="yFilterCapGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#64748b;stop-opacity:1" />
      <stop offset="42%" style="stop-color:#94a3b8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="0" y="24" width="16" height="12" fill="url(#yFilterPipeGrad)"/>
  <line x1="0" y1="24" x2="16" y2="24" stroke="#94a3b8" stroke-width="1"/>
  <line x1="0" y1="36" x2="16" y2="36" stroke="#1e293b" stroke-width="1"/>
  <rect x="15" y="19" width="6" height="22" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1"/>
  <rect x="84" y="24" width="16" height="12" fill="url(#yFilterPipeGrad)"/>
  <line x1="84" y1="24" x2="100" y2="24" stroke="#94a3b8" stroke-width="1"/>
  <line x1="84" y1="36" x2="100" y2="36" stroke="#1e293b" stroke-width="1"/>
  <rect x="79" y="19" width="6" height="22" rx="1" fill="#475569" stroke="#1e293b" stroke-width="1"/>
  <rect x="42" y="47" width="16" height="11" rx="1" fill="url(#yFilterCapGrad)" stroke="#1e293b" stroke-width="1.5"/>
  <line x1="43" y1="49" x2="57" y2="49" stroke="#94a3b8" stroke-width="0.8" opacity="0.5"/>
  <path d="M 21 18 L 79 18 L 79 42 L 60 42 L 50 56 L 40 42 L 21 42 Z" fill="url(#yFilterBodyGrad)" stroke="#1e293b" stroke-width="1.5"/>
  <line x1="22" y1="20" x2="78" y2="20" stroke="#94a3b8" stroke-width="1" opacity="0.4"/>
  <line x1="42" y1="24" x2="58" y2="40" stroke="#64748b" stroke-width="1.5" stroke-dasharray="3,2" opacity="0.7"/>
</svg>`;
