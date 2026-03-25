import type { WidgetControls } from '@thingsvis/schema';

export const controls: WidgetControls = {
  groups: [
    {
      id: 'tank-config',
      label: { zh: '液位罐配置', en: 'Tank Config' },
      fields: [
        {
          path: 'level',
          kind: 'number',
          label: { zh: '液位 (%)', en: 'Level (%)' },
          default: 50,
          min: 0,
          max: 100,
        },
        {
          path: 'tankColor',
          kind: 'color',
          label: { zh: '罐体颜色', en: 'Tank Color' },
          default: '#334155',
        },
        {
          path: 'liquidColor',
          kind: 'color',
          label: { zh: '液体颜色', en: 'Liquid Color' },
          default: '#0ea5e9',
        },
        {
          path: 'lowColor',
          kind: 'color',
          label: { zh: '低液位颜色', en: 'Low Level Color' },
          default: '#eab308',
        },
        {
          path: 'highColor',
          kind: 'color',
          label: { zh: '高液位颜色', en: 'High Level Color' },
          default: '#ef4444',
        },
        {
          path: 'lowThreshold',
          kind: 'number',
          label: { zh: '低液位阈值', en: 'Low Threshold' },
          default: 20,
          min: 0,
          max: 100,
        },
        {
          path: 'highThreshold',
          kind: 'number',
          label: { zh: '高液位阈值', en: 'High Threshold' },
          default: 80,
          min: 0,
          max: 100,
        },
        {
          path: 'hasError',
          kind: 'boolean',
          label: { zh: '故障告警', en: 'Has Error' },
          default: false,
        },
      ],
    },
  ],
};
