export const ELBOW_PIPE_SVG = `<svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Main pipe body gradient (top-lit) -->
    <linearGradient id="epBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   style="stop-color:#64748b;stop-opacity:1"/>
      <stop offset="30%"  style="stop-color:#94a3b8;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1"/>
    </linearGradient>
    <!-- Pipe-mouth ellipse fill (inner dark hole) -->
    <radialGradient id="epHoleGrad" cx="40%" cy="35%" r="60%">
      <stop offset="0%"   style="stop-color:#334155;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#0f172a;stop-opacity:1"/>
    </radialGradient>
  </defs>

  <!-- ─── Elbow bend body ───
       Arc from horizontal (left) to vertical (down).
       Outer wall: arc centre (18, 82), R_out=62 �?sweeps from (18,20) to (80,82)
       Inner wall: arc centre (18, 82), R_in=42  �?sweeps from (18,40) to (60,82)
  -->
  <path d="
    M 18 20
    L 80 20
    A 62 62 0 0 1 80 82
    L 60 82
    A 42 42 0 0 0 60 40
    L 18 40
    Z
  " fill="url(#epBodyGrad)" stroke="#1e293b" stroke-width="1.5" stroke-linejoin="round"/>

  <!-- Top highlight line along outer arc top-edge -->
  <path d="M 19 22 L 79 22" stroke="#94a3b8" stroke-width="1" stroke-linecap="round" opacity="0.5"/>

  <!-- ─── Left pipe mouth ───
       Ellipse representing the circular opening, centred at x=18, mid-height of pipe bore y=30 -->
  <ellipse cx="18" cy="30" rx="4" ry="10" fill="url(#epBodyGrad)" stroke="#1e293b" stroke-width="1.2"/>
  <ellipse cx="18" cy="30" rx="2" ry="6.5" fill="url(#epHoleGrad)"/>
  <line x1="18" y1="23.5" x2="18" y2="25" stroke="#94a3b8" stroke-width="0.8" opacity="0.5"/>

  <!-- ─── Bottom pipe mouth ───
       Ellipse at the bottom opening, centred at x=70, bottom of bore y=82 -->
  <ellipse cx="70" cy="82" rx="10" ry="4" fill="url(#epBodyGrad)" stroke="#1e293b" stroke-width="1.2"/>
  <ellipse cx="70" cy="82" rx="6.5" ry="2" fill="url(#epHoleGrad)"/>
  <line x1="63.5" y1="82" x2="65" y2="82" stroke="#94a3b8" stroke-width="0.8" opacity="0.5"/>
</svg>`;

export const TEE_PIPE_SVG = `<svg width="100%" height="100%" viewBox="0 0 100 80" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="tpBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   style="stop-color:#64748b;stop-opacity:1"/>
      <stop offset="30%"  style="stop-color:#94a3b8;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1"/>
    </linearGradient>
    <linearGradient id="tpBranchGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   style="stop-color:#334155;stop-opacity:1"/>
      <stop offset="35%"  style="stop-color:#94a3b8;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#475569;stop-opacity:1"/>
    </linearGradient>
    <radialGradient id="tpHoleGrad" cx="40%" cy="35%" r="60%">
      <stop offset="0%"   style="stop-color:#334155;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#0f172a;stop-opacity:1"/>
    </radialGradient>
  </defs>

  <!-- ─── Main horizontal run (top wall + bottom wall, pipe bore in between) -->
  <!-- Top wall -->
  <rect x="14" y="18" width="72" height="18" rx="0"
        fill="url(#tpBodyGrad)" stroke="#1e293b" stroke-width="0"/>
  <!-- Bottom wall -->
  <rect x="14" y="18" width="72" height="22"
        fill="url(#tpBodyGrad)" stroke="#1e293b" stroke-width="1.5" rx="2"/>
  <!-- Inner bore (dark channel) -->
  <rect x="14" y="23" width="72" height="12" fill="#0f172a" opacity="0.5"/>
  <!-- Top highlight -->
  <line x1="15" y1="20" x2="85" y2="20" stroke="#94a3b8" stroke-width="1" opacity="0.5"/>

  <!-- ─── Down branch -->
  <rect x="43" y="40" width="14" height="24" fill="url(#tpBranchGrad)" stroke="#1e293b" stroke-width="1.5" rx="1"/>
  <!-- Branch bore -->
  <rect x="47" y="40" width="6" height="24" fill="#0f172a" opacity="0.5"/>
  <!-- Branch left edge highlight -->
  <line x1="44.5" y1="41" x2="44.5" y2="63" stroke="#94a3b8" stroke-width="0.8" opacity="0.4"/>

  <!-- ─── Left pipe mouth -->
  <ellipse cx="14" cy="29" rx="4" ry="11" fill="url(#tpBodyGrad)" stroke="#1e293b" stroke-width="1.2"/>
  <ellipse cx="14" cy="29" rx="2.2" ry="7" fill="url(#tpHoleGrad)"/>

  <!-- ─── Right pipe mouth -->
  <ellipse cx="86" cy="29" rx="4" ry="11" fill="url(#tpBodyGrad)" stroke="#1e293b" stroke-width="1.2"/>
  <ellipse cx="86" cy="29" rx="2.2" ry="7" fill="url(#tpHoleGrad)"/>

  <!-- ─── Bottom pipe mouth -->
  <ellipse cx="50" cy="64" rx="9" ry="3.5" fill="url(#tpBodyGrad)" stroke="#1e293b" stroke-width="1.2"/>
  <ellipse cx="50" cy="64" rx="5.5" ry="2" fill="url(#tpHoleGrad)"/>
</svg>`;