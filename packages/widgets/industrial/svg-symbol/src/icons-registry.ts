/**
 * Industrial SVG symbol registry.
 * Each entry contains an inline SVG string that is rendered directly in the widget.
 * Add new symbols here to expand the industrial icon library.
 */

import { IOT_DEVICE_SVG, CONTROL_CABINET_SVG } from './assets/general';
import { CENTRIFUGAL_PUMP_SVG, INLINE_PUMP_SVG } from './assets/pump';
import {
  BALL_VALVE_SVG,
  GATE_VALVE_SVG,
  GLOBE_VALVE_SVG,
  CHECK_VALVE_SVG,
  BUTTERFLY_VALVE_SVG,
} from './assets/valve';
import { Y_FILTER_SVG } from './assets/filter';
import { HEAT_EXCHANGER_SVG, BOILER_SVG } from './assets/heat-transfer';
import { HORIZONTAL_TANK_SVG, VERTICAL_TANK_SVG, PRESSURE_VESSEL_SVG } from './assets/tank';
import { THERMOMETER_SVG, LEVEL_GAUGE_SVG } from './assets/instrument';
import { FAN_SVG, AIR_COMPRESSOR_SVG } from './assets/compressor';
import { COOLING_TOWER_SVG } from './assets/cooling-tower';
import { PLC_CABINET_SVG, DISTRIBUTION_BOX_SVG } from './assets/electrical';
import { ELBOW_PIPE_SVG, TEE_PIPE_SVG } from './assets/pipe-fitting';

export interface IconEntry {
  /** Unique identifier, used as the value stored in Props.selectedIconId */
  id: string;
  /** Human-readable label in multiple locales */
  label: { zh: string; en: string };
  /** Category label shown in the select option group prefix */
  categoryLabel: { zh: string; en: string };
  /** Complete inline SVG markup */
  svgContent: string;
  /** Recommended default size so the canvas selection box fits tightly */
  defaultSize: { width: number; height: number };
}

// ---------------------------------------------------------------------------
// Registry export
// ---------------------------------------------------------------------------

export const INDUSTRIAL_ICONS: IconEntry[] = [
  // General / IoT
  {
    id: 'iot-device',
    label: { zh: 'IoT 设备', en: 'IoT Device' },
    categoryLabel: { zh: '通用设备', en: 'General' },
    svgContent: IOT_DEVICE_SVG,
    defaultSize: { width: 100, height: 100 },
  },
  {
    id: 'control-cabinet',
    label: { zh: '控制柜', en: 'Control Cabinet' },
    categoryLabel: { zh: '通用设备', en: 'General' },
    svgContent: CONTROL_CABINET_SVG,
    defaultSize: { width: 100, height: 100 },
  },

  // Electrical / Control
  {
    id: 'plc-cabinet',
    label: { zh: 'PLC 柜', en: 'PLC Cabinet' },
    categoryLabel: { zh: '电气控制', en: 'Electrical' },
    svgContent: PLC_CABINET_SVG,
    defaultSize: { width: 100, height: 100 },
  },
  {
    id: 'distribution-box',
    label: { zh: '配电箱', en: 'Distribution Box' },
    categoryLabel: { zh: '电气控制', en: 'Electrical' },
    svgContent: DISTRIBUTION_BOX_SVG,
    defaultSize: { width: 100, height: 100 },
  },

  // Pump category
  {
    id: 'centrifugal-pump',
    label: { zh: '离心泵', en: 'Centrifugal Pump' },
    categoryLabel: { zh: '泵类', en: 'Pump' },
    svgContent: CENTRIFUGAL_PUMP_SVG,
    defaultSize: { width: 100, height: 60 },
  },
  {
    id: 'inline-pump',
    label: { zh: '管道泵', en: 'Inline Pump' },
    categoryLabel: { zh: '泵类', en: 'Pump' },
    svgContent: INLINE_PUMP_SVG,
    defaultSize: { width: 100, height: 60 },
  },

  // Valve category
  {
    id: 'ball-valve',
    label: { zh: '球阀', en: 'Ball Valve' },
    categoryLabel: { zh: '阀门', en: 'Valve' },
    svgContent: BALL_VALVE_SVG,
    defaultSize: { width: 100, height: 70 },
  },
  {
    id: 'gate-valve',
    label: { zh: '闸阀', en: 'Gate Valve' },
    categoryLabel: { zh: '阀门', en: 'Valve' },
    svgContent: GATE_VALVE_SVG,
    defaultSize: { width: 100, height: 70 },
  },
  {
    id: 'globe-valve',
    label: { zh: '截止阀', en: 'Globe Valve' },
    categoryLabel: { zh: '阀门', en: 'Valve' },
    svgContent: GLOBE_VALVE_SVG,
    defaultSize: { width: 100, height: 70 },
  },
  {
    id: 'check-valve',
    label: { zh: '止回阀', en: 'Check Valve' },
    categoryLabel: { zh: '阀门', en: 'Valve' },
    svgContent: CHECK_VALVE_SVG,
    defaultSize: { width: 100, height: 60 },
  },
  {
    id: 'butterfly-valve',
    label: { zh: '蝶阀', en: 'Butterfly Valve' },
    categoryLabel: { zh: '阀门', en: 'Valve' },
    svgContent: BUTTERFLY_VALVE_SVG,
    defaultSize: { width: 100, height: 70 },
  },

  // Filter category
  {
    id: 'y-filter',
    label: { zh: 'Y 型过滤器', en: 'Y-Strainer' },
    categoryLabel: { zh: '管路附件', en: 'Pipe Fitting' },
    svgContent: Y_FILTER_SVG,
    defaultSize: { width: 100, height: 80 },
  },

  // Pipe fittings
  {
    id: 'elbow-pipe',
    label: { zh: '弯头', en: 'Elbow' },
    categoryLabel: { zh: '管路附件', en: 'Pipe Fitting' },
    svgContent: ELBOW_PIPE_SVG,
    defaultSize: { width: 100, height: 100 },
  },
  {
    id: 'tee-pipe',
    label: { zh: '三通', en: 'Tee' },
    categoryLabel: { zh: '管路附件', en: 'Pipe Fitting' },
    svgContent: TEE_PIPE_SVG,
    defaultSize: { width: 100, height: 80 },
  },

  // Heat transfer category
  {
    id: 'heat-exchanger',
    label: { zh: '换热器', en: 'Heat Exchanger' },
    categoryLabel: { zh: '换热设备', en: 'Heat Transfer' },
    svgContent: HEAT_EXCHANGER_SVG,
    defaultSize: { width: 60, height: 100 },
  },
  {
    id: 'boiler',
    label: { zh: '锅炉', en: 'Boiler' },
    categoryLabel: { zh: '换热设备', en: 'Heat Transfer' },
    svgContent: BOILER_SVG,
    defaultSize: { width: 60, height: 100 },
  },

  // Cooling
  {
    id: 'cooling-tower',
    label: { zh: '冷却塔', en: 'Cooling Tower' },
    categoryLabel: { zh: '冷却设备', en: 'Cooling' },
    svgContent: COOLING_TOWER_SVG,
    defaultSize: { width: 60, height: 100 },
  },

  // Tank category
  {
    id: 'horizontal-tank',
    label: { zh: '卧式储罐', en: 'Horizontal Tank' },
    categoryLabel: { zh: '储罐容器', en: 'Tank' },
    svgContent: HORIZONTAL_TANK_SVG,
    defaultSize: { width: 100, height: 60 },
  },
  {
    id: 'vertical-tank',
    label: { zh: '立式储罐', en: 'Vertical Tank' },
    categoryLabel: { zh: '储罐容器', en: 'Tank' },
    svgContent: VERTICAL_TANK_SVG,
    defaultSize: { width: 60, height: 100 },
  },
  {
    id: 'pressure-vessel',
    label: { zh: '压力容器', en: 'Pressure Vessel' },
    categoryLabel: { zh: '储罐容器', en: 'Tank' },
    svgContent: PRESSURE_VESSEL_SVG,
    defaultSize: { width: 60, height: 100 },
  },

  // Compressor / Fan
  {
    id: 'fan',
    label: { zh: '风机', en: 'Fan' },
    categoryLabel: { zh: '风机压缩机', en: 'Blower / Compressor' },
    svgContent: FAN_SVG,
    defaultSize: { width: 100, height: 60 },
  },
  {
    id: 'air-compressor',
    label: { zh: '空压机', en: 'Air Compressor' },
    categoryLabel: { zh: '风机压缩机', en: 'Blower / Compressor' },
    svgContent: AIR_COMPRESSOR_SVG,
    defaultSize: { width: 100, height: 60 },
  },

  // Instrument category
  {
    id: 'thermometer',
    label: { zh: '温度计', en: 'Thermometer' },
    categoryLabel: { zh: '仪表', en: 'Instrument' },
    svgContent: THERMOMETER_SVG,
    defaultSize: { width: 60, height: 60 },
  },
  {
    id: 'level-gauge',
    label: { zh: '液位计', en: 'Level Gauge' },
    categoryLabel: { zh: '仪表', en: 'Instrument' },
    svgContent: LEVEL_GAUGE_SVG,
    defaultSize: { width: 60, height: 60 },
  },
];

/** Quick lookup map: iconId → IconEntry */
export const INDUSTRIAL_ICONS_MAP: Record<string, IconEntry> = Object.fromEntries(
  INDUSTRIAL_ICONS.map((icon) => [icon.id, icon])
);
