import type { WidgetControls } from '@thingsvis/schema';

export const controls: WidgetControls = {
  groups: [
    {
      id: 'gauge-config',
      label: { zh: '仪表配置', en: 'Gauge Config' },
      fields: [
        {
          path: 'value',
          kind: 'number',
          label: { zh: '当前数值', en: 'Current Value' },
          default: 50,
        },
        {
          path: 'min',
          kind: 'number',
          label: { zh: '最小值', en: 'Min Value' },
          default: 0,
        },
        {
          path: 'max',
          kind: 'number',
          label: { zh: '最大值', en: 'Max Value' },
          default: 100,
        },
        {
          path: 'dialColor',
          kind: 'color',
          label: { zh: '表盘颜色', en: 'Dial Color' },
          default: '#1e293b',
        },
        {
          path: 'pointerColor',
          kind: 'color',
          label: { zh: '指针颜色', en: 'Pointer Color' },
          default: '#fbbf24',
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
