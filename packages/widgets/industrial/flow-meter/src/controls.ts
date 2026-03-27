import type { WidgetControls } from '@thingsvis/schema';

export const controls: WidgetControls = {
  groups: [
    {
      id: 'flow-config',
      label: { zh: '流量配置', en: 'Flow Config' },
      fields: [
        {
          path: 'value',
          kind: 'number',
          label: { zh: '当前流量', en: 'Flow Value' },
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
          path: 'baseColor',
          kind: 'color',
          label: { zh: '外壳颜色', en: 'Case Color' },
          default: '#475569',
        },
        {
          path: 'liquidColor',
          kind: 'color',
          label: { zh: '液体颜色', en: 'Liquid Color' },
          default: '#0ea5e9',
        },
        {
          path: 'flowSpeed',
          kind: 'number',
          label: { zh: '流动速度', en: 'Flow Speed' },
          default: 1,
          min: 0,
          max: 5,
          step: 0.5,
        },
        {
          path: 'hasError',
          kind: 'boolean',
          label: { zh: '故障告警', en: 'Has Error' },
          default: false,
        },
        {
          path: 'showValue',
          kind: 'boolean',
          label: { zh: '显示数值', en: 'Show Value' },
          default: true,
        },
      ],
    },
  ],
};
