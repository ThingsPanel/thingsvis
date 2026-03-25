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
    id: 'heat-exchanger',
    label: { zh: '换热器', en: 'Heat Exchanger' },
    categoryLabel: { zh: '换热设备', en: 'Heat Transfer' },
    svgContent: HEAT_EXCHANGER_SVG,
  },
];

/** Quick lookup map: iconId → IconEntry */
export const INDUSTRIAL_ICONS_MAP: Record<string, IconEntry> = Object.fromEntries(
  INDUSTRIAL_ICONS.map((icon) => [icon.id, icon])
);
