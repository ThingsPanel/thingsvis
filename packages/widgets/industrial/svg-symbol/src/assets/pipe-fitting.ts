export const ELBOW_PIPE_SVG = `<svg width="100%" height="100%" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="elbowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="2" y="18" width="18" height="24" fill="#64748b"/>
  <rect x="48" y="42" width="24" height="16" fill="#64748b"/>
  <path d="M 20 18 L 48 18 A 24 24 0 0 1 72 42 L 72 42 L 20 42 Z" fill="url(#elbowGrad)" stroke="#1e293b" stroke-width="2"/>
</svg>`;

export const TEE_PIPE_SVG = `<svg width="100%" height="100%" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="teeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#334155;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#475569;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="2" y="18" width="18" height="24" fill="#64748b"/>
  <rect x="80" y="18" width="18" height="24" fill="#64748b"/>
  <rect x="38" y="42" width="24" height="16" fill="#64748b"/>
  <path d="M 20 18 L 80 18 L 80 42 L 62 42 Q 50 46 38 42 L 20 42 Z" fill="url(#teeGrad)" stroke="#1e293b" stroke-width="2"/>
</svg>`;
