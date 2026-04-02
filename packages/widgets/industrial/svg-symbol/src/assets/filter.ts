export const Y_FILTER_SVG = `<svg width="100%" height="100%" viewBox="0 0 100 80" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Main body: slightly wider than a plain pipe to show filter housing -->
    <linearGradient id="yfBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   style="stop-color:#64748b;stop-opacity:1"/>
      <stop offset="28%"  style="stop-color:#94a3b8;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1"/>
    </linearGradient>
    <linearGradient id="yfBranchGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   style="stop-color:#334155;stop-opacity:1"/>
      <stop offset="35%"  style="stop-color:#94a3b8;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#475569;stop-opacity:1"/>
    </linearGradient>
    <linearGradient id="yfCapGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   style="stop-color:#7a94b0;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1"/>
    </linearGradient>
    <radialGradient id="yfHoleGrad" cx="40%" cy="35%" r="60%">
      <stop offset="0%"   style="stop-color:#334155;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#0f172a;stop-opacity:1"/>
    </radialGradient>
  </defs>

  <!-- ─── Main filter body (wider/taller than plain pipe) ─── -->
  <rect x="10" y="14" width="80" height="26" rx="2"
        fill="url(#yfBodyGrad)" stroke="#1e293b" stroke-width="1.5"/>
  <!-- Inner bore -->
  <rect x="10" y="19" width="80" height="16" fill="#0f172a" opacity="0.5"/>
  <!-- Top highlight -->
  <line x1="11" y1="16" x2="89" y2="16" stroke="#94a3b8" stroke-width="1" opacity="0.5"/>
  <!-- Filter-element indicator: 3 short vertical lines in bore centre -->
  <line x1="43" y1="20" x2="43" y2="34" stroke="#475569" stroke-width="1.2" stroke-dasharray="2,2" opacity="0.7"/>
  <line x1="50" y1="20" x2="50" y2="34" stroke="#475569" stroke-width="1.2" stroke-dasharray="2,2" opacity="0.7"/>
  <line x1="57" y1="20" x2="57" y2="34" stroke="#475569" stroke-width="1.2" stroke-dasharray="2,2" opacity="0.7"/>

  <!-- ─── Down drain branch ─── -->
  <rect x="43" y="40" width="14" height="18" fill="url(#yfBranchGrad)" stroke="#1e293b" stroke-width="1.5" rx="1"/>
  <!-- Branch bore -->
  <rect x="47" y="40" width="6" height="18" fill="#0f172a" opacity="0.5"/>

  <!-- Drain cap (hex flat) -->
  <rect x="39" y="58" width="22" height="8" rx="3"
        fill="url(#yfCapGrad)" stroke="#1e293b" stroke-width="1.2"/>
  <line x1="40" y1="60" x2="61" y2="60" stroke="#94a3b8" stroke-width="0.8" opacity="0.45"/>
  <!-- Cap bolts -->
  <circle cx="44" cy="62" r="1.3" fill="#0f172a" opacity="0.55"/>
  <circle cx="50" cy="62" r="1.3" fill="#0f172a" opacity="0.55"/>
  <circle cx="56" cy="62" r="1.3" fill="#0f172a" opacity="0.55"/>

  <!-- ─── Left pipe mouth ─── -->
  <ellipse cx="10" cy="27" rx="4" ry="13" fill="url(#yfBodyGrad)" stroke="#1e293b" stroke-width="1.2"/>
  <ellipse cx="10" cy="27" rx="2.2" ry="8.5" fill="url(#yfHoleGrad)"/>

  <!-- ─── Right pipe mouth ─── -->
  <ellipse cx="90" cy="27" rx="4" ry="13" fill="url(#yfBodyGrad)" stroke="#1e293b" stroke-width="1.2"/>
  <ellipse cx="90" cy="27" rx="2.2" ry="8.5" fill="url(#yfHoleGrad)"/>

  <!-- ─── Bottom drain mouth ─── -->
  <ellipse cx="50" cy="66" rx="9" ry="3.5" fill="url(#yfBodyGrad)" stroke="#1e293b" stroke-width="1.2"/>
  <ellipse cx="50" cy="66" rx="5.5" ry="2" fill="url(#yfHoleGrad)"/>
</svg>`;