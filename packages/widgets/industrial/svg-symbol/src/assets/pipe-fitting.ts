export const ELBOW_PIPE_SVG = `<svg width="100%" height="100%" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="elbowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="0" y="22" width="16" height="16" fill="#475569"/>
  <rect x="42" y="44" width="16" height="16" fill="#475569"/>
  <path d="M 16 22 L 42 22 Q 58 22 58 38 L 58 44" fill="none" stroke="url(#elbowGrad)" stroke-width="16" stroke-linecap="butt"/>
  <path d="M 16 22 L 42 22 Q 58 22 58 38 L 58 44" fill="none" stroke="#1e293b" stroke-width="2" stroke-linecap="round" opacity="0.8"/>
</svg>`;

export const TEE_PIPE_SVG = `<svg width="100%" height="100%" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="teeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#334155;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#475569;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="0" y="22" width="16" height="16" fill="#475569"/>
  <rect x="84" y="22" width="16" height="16" fill="#475569"/>
  <rect x="42" y="0" width="16" height="16" fill="#475569"/>
  <rect x="16" y="22" width="68" height="16" fill="url(#teeGrad)" stroke="#1e293b" stroke-width="2"/>
  <rect x="42" y="16" width="16" height="22" fill="url(#teeGrad)" stroke="#1e293b" stroke-width="2"/>
</svg>`;
