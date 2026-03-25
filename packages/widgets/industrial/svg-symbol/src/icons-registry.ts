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

const HEAT_EXCHANGER_SVG = `<svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="35" width="80" height="30" rx="4" fill="#2c7873" stroke="#1a5754" stroke-width="2"/>
  <line x1="25" y1="35" x2="25" y2="65" stroke="#1a5754" stroke-width="1.5"/>
  <line x1="40" y1="35" x2="40" y2="65" stroke="#1a5754" stroke-width="1.5"/>
  <line x1="55" y1="35" x2="55" y2="65" stroke="#1a5754" stroke-width="1.5"/>
  <line x1="70" y1="35" x2="70" y2="65" stroke="#1a5754" stroke-width="1.5"/>
  <rect x="5" y="45" width="10" height="10" fill="#888"/>
  <rect x="85" y="45" width="10" height="10" fill="#888"/>
  <text x="50" y="55" font-family="Arial" font-size="8" fill="rgba(255,255,255,0.7)" text-anchor="middle">HX</text>
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
