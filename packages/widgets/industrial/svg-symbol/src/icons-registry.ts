/**
 * Industrial SVG symbol registry.
 * Each entry contains an inline SVG string that is rendered directly in the widget.
 * Add new symbols here to expand the industrial icon library.
 */

export interface IconEntry {
  /** Unique identifier, used as the value stored in Props.selectedIconId */
  id: string;
  /** Human-readable label in multiple locales */
  label: { zh: string; en: string };
  /** Category label shown in the select option group prefix */
  categoryLabel: { zh: string; en: string };
  /** Complete inline SVG markup */
  svgContent: string;
}

// ---------------------------------------------------------------------------
// General / Control
// ---------------------------------------------------------------------------

const CONTROL_CABINET_SVG = `<svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cabinetGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#64748b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#475569;stop-opacity:1" />
    </linearGradient>
  </defs>
  <!-- 柜体 -->
  <rect x="20" y="15" width="60" height="70" rx="4" fill="url(#cabinetGrad)" stroke="#1e293b" stroke-width="2"/>
  <!-- 柜门缝 -->
  <line x1="50" y1="20" x2="50" y2="80" stroke="#334155" stroke-width="1.5"/>
  <!-- 左门把手 -->
  <circle cx="45" cy="50" r="2" fill="#94a3b8"/>
  <!-- 右门把手 -->
  <circle cx="55" cy="50" r="2" fill="#94a3b8"/>
  <!-- 指示灯 - 绿 -->
  <circle cx="35" cy="25" r="3" fill="#22c55e" stroke="#1e293b" stroke-width="1"/>
  <!-- 指示灯 - 红 -->
  <circle cx="50" cy="25" r="3" fill="#ef4444" stroke="#1e293b" stroke-width="1"/>
  <!-- 指示灯 - 黄 -->
  <circle cx="65" cy="25" r="3" fill="#eab308" stroke="#1e293b" stroke-width="1"/>
  <!-- 底部通风口 -->
  <line x1="30" y1="85" x2="70" y2="85" stroke="#334155" stroke-width="2" stroke-dasharray="4,2"/>
</svg>`;

// ---------------------------------------------------------------------------
// Pump category
// ---------------------------------------------------------------------------

const PUMP_SVG = `<svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="70" width="60" height="10" fill="#777" />
  <rect x="55" y="30" width="30" height="40" fill="#555" rx="5" />
  <circle cx="40" cy="50" r="25" fill="#4a90e2" />
  <g transform="translate(40,50)">
    <circle cx="0" cy="0" r="15" fill="#222" />
    <path d="M 0 -15 A 15 15 0 0 0 15 0 L 0 0 Z" fill="#eee" />
    <path d="M 0 15 A 15 15 0 0 0 -15 0 L 0 0 Z" fill="#eee" />
    <path d="M -15 0 A 15 15 0 0 0 0 15 L 0 0 Z" fill="#ccc" />
    <path d="M 15 0 A 15 15 0 0 0 0 -15 L 0 0 Z" fill="#ccc" />
  </g>
</svg>`;

// ---------------------------------------------------------------------------
// Valve category
// ---------------------------------------------------------------------------

const VALVE_SVG = `<svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <path d="M 15 25 L 15 75 L 85 25 L 85 75 Z" fill="#52c41a" stroke="#222" stroke-width="2" stroke-linejoin="round"/>
  <rect x="46" y="30" width="8" height="20" fill="#666" />
  <circle cx="50" cy="50" r="12" fill="#333" />
  <rect x="25" y="25" width="50" height="10" fill="#444" rx="4" stroke="#111" stroke-width="1"/>
</svg>`;

// ---------------------------------------------------------------------------
// Tank category
// ---------------------------------------------------------------------------

const TANK_SVG = `<svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="20" width="60" height="60" rx="8" fill="#2a6496" stroke="#1a4a7a" stroke-width="2"/>
  <rect x="20" y="55" width="60" height="25" rx="0" fill="#1d4e89" />
  <ellipse cx="50" cy="20" rx="30" ry="8" fill="#3a7ab9"/>
  <ellipse cx="50" cy="80" rx="30" ry="8" fill="#1d4e89"/>
  <rect x="44" y="78" width="12" height="15" fill="#666"/>
  <rect x="38" y="90" width="24" height="4" fill="#555"/>
  <text x="50" y="52" font-family="Arial" font-size="10" fill="rgba(255,255,255,0.6)" text-anchor="middle">TANK</text>
</svg>`;

// ---------------------------------------------------------------------------
// Motor category
// ---------------------------------------------------------------------------

const MOTOR_SVG = `<svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <rect x="15" y="30" width="55" height="40" rx="5" fill="#5a5a8a" stroke="#3a3a6a" stroke-width="2"/>
  <rect x="70" y="45" width="20" height="10" fill="#888"/>
  <circle cx="42" cy="50" r="14" fill="#3a3a6a" stroke="#6a6aaa" stroke-width="2"/>
  <circle cx="42" cy="50" r="6" fill="#8888cc"/>
  <line x1="30" y1="30" x2="30" y2="28" stroke="#aaa" stroke-width="3"/>
  <line x1="42" y1="30" x2="42" y2="28" stroke="#aaa" stroke-width="3"/>
  <line x1="54" y1="30" x2="54" y2="28" stroke="#aaa" stroke-width="3"/>
</svg>`;

// ---------------------------------------------------------------------------
// Heat Exchanger category
// ---------------------------------------------------------------------------

const HEAT_EXCHANGER_SVG = `<svg width="100%" height="100%" viewBox="0 0 80 120" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="hxBody" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#334155;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="hxHot" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#f97316;stop-opacity:0.9" />
      <stop offset="100%" style="stop-color:#ea580c;stop-opacity:0.6" />
    </linearGradient>
    <linearGradient id="hxCold" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#06b6d4;stop-opacity:0.6" />
      <stop offset="100%" style="stop-color:#0891b2;stop-opacity:0.9" />
    </linearGradient>
  </defs>
  
  <!-- 上左接口 -->
  <rect x="2" y="12" width="10" height="6" fill="#64748b" rx="1"/>
  
  <!-- 上右接口 -->
  <rect x="68" y="12" width="10" height="6" fill="#64748b" rx="1"/>
  
  <!-- 主体 - 竖直胶囊形状 -->
  <rect x="15" y="8" width="50" height="104" rx="25" ry="25" fill="url(#hxBody)" stroke="#1e293b" stroke-width="2"/>
  
  <!-- 顶部椭圆 -->
  <ellipse cx="40" cy="8" rx="25" ry="6" fill="#64748b" stroke="#1e293b" stroke-width="1"/>
  
  <!-- 内部简化盘管 - 高温侧(上) -->
  <path d="M 25 25 Q 40 32 55 25" fill="none" stroke="url(#hxHot)" stroke-width="3" stroke-linecap="round"/>
  <path d="M 25 38 Q 40 45 55 38" fill="none" stroke="url(#hxHot)" stroke-width="3" stroke-linecap="round"/>
  
  <!-- 内部简化盘管 - 低温侧(下) -->
  <path d="M 25 75 Q 40 82 55 75" fill="none" stroke="url(#hxCold)" stroke-width="3" stroke-linecap="round"/>
  <path d="M 25 88 Q 40 95 55 88" fill="none" stroke="url(#hxCold)" stroke-width="3" stroke-linecap="round"/>
  
  <!-- 下左接口 -->
  <rect x="2" y="102" width="10" height="6" fill="#64748b" rx="1"/>
  
  <!-- 下右接口 -->
  <rect x="68" y="102" width="10" height="6" fill="#64748b" rx="1"/>
  
  <!-- 底部椭圆 -->
  <ellipse cx="40" cy="112" rx="25" ry="6" fill="#334155" stroke="#1e293b" stroke-width="1"/>
</svg>`;

// ---------------------------------------------------------------------------
// Sensor / Instrument category
// ---------------------------------------------------------------------------

const PRESSURE_GAUGE_SVG = `<svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="48" r="35" fill="#f0f0f0" stroke="#555" stroke-width="3"/>
  <circle cx="50" cy="48" r="28" fill="none" stroke="#ccc" stroke-width="1"/>
  <path d="M 22 68 A 32 32 0 1 1 78 68" fill="none" stroke="#ddd" stroke-width="6" stroke-linecap="round"/>
  <path d="M 22 68 A 32 32 0 0 1 61 20" fill="none" stroke="#e76f51" stroke-width="6" stroke-linecap="round"/>
  <line x1="50" y1="48" x2="62" y2="22" stroke="#e63946" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="50" cy="48" r="4" fill="#555"/>
  <rect x="44" y="82" width="12" height="10" fill="#888"/>
  <rect x="38" y="90" width="24" height="4" fill="#666"/>
</svg>`;

const FLOW_METER_SVG = `<svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="30" width="60" height="40" rx="6" fill="#264653" stroke="#1a3040" stroke-width="2"/>
  <rect x="5" y="44" width="15" height="12" fill="#888"/>
  <rect x="80" y="44" width="15" height="12" fill="#888"/>
  <text x="50" y="52" font-family="Arial" font-size="9" fill="#2dd4bf" text-anchor="middle">FLOW</text>
  <line x1="30" y1="62" x2="42" y2="62" stroke="#2dd4bf" stroke-width="1.5"/>
  <line x1="46" y1="62" x2="58" y2="62" stroke="#2dd4bf" stroke-width="1.5"/>
  <line x1="62" y1="62" x2="70" y2="62" stroke="#2dd4bf" stroke-width="1.5"/>
</svg>`;

// ---------------------------------------------------------------------------
// Registry export
// ---------------------------------------------------------------------------

export const INDUSTRIAL_ICONS: IconEntry[] = [
  {
    id: 'control-cabinet',
    label: { zh: '控制柜', en: 'Control Cabinet' },
    categoryLabel: { zh: '通用设备', en: 'General' },
    svgContent: CONTROL_CABINET_SVG,
  },
  {
    id: 'pump-centrifugal',
    label: { zh: '离心泵', en: 'Centrifugal Pump' },
    categoryLabel: { zh: '泵阀', en: 'Pump & Valve' },
    svgContent: PUMP_SVG,
  },
  {
    id: 'valve-butterfly',
    label: { zh: '管路阀门', en: 'Pipe Valve' },
    categoryLabel: { zh: '泵阀', en: 'Pump & Valve' },
    svgContent: VALVE_SVG,
  },
  {
    id: 'tank-storage',
    label: { zh: '储罐', en: 'Storage Tank' },
    categoryLabel: { zh: '容器', en: 'Vessel' },
    svgContent: TANK_SVG,
  },
  {
    id: 'motor-electric',
    label: { zh: '电动机', en: 'Electric Motor' },
    categoryLabel: { zh: '驱动设备', en: 'Drive' },
    svgContent: MOTOR_SVG,
  },
  {
    id: 'heat-exchanger',
    label: { zh: '换热器', en: 'Heat Exchanger' },
    categoryLabel: { zh: '换热设备', en: 'Heat Transfer' },
    svgContent: HEAT_EXCHANGER_SVG,
  },
  {
    id: 'instrument-pressure',
    label: { zh: '压力计', en: 'Pressure Gauge' },
    categoryLabel: { zh: '仪表', en: 'Instrument' },
    svgContent: PRESSURE_GAUGE_SVG,
  },
  {
    id: 'instrument-flow',
    label: { zh: '流量计', en: 'Flow Meter' },
    categoryLabel: { zh: '仪表', en: 'Instrument' },
    svgContent: FLOW_METER_SVG,
  },
];

/** Quick lookup map: iconId → IconEntry */
export const INDUSTRIAL_ICONS_MAP: Record<string, IconEntry> = Object.fromEntries(
  INDUSTRIAL_ICONS.map((icon) => [icon.id, icon])
);
