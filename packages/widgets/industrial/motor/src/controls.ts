import type { WidgetControls } from '@thingsvis/schema';

export const controls: WidgetControls = {
  groups: [
    {
      id: 'motor-config',
      label: { zh: '电机配置', en: 'Motor Config' },
      fields: [
        {
          path: 'baseColor',
          kind: 'color',
          label: { zh: '基础颜色', en: 'Base Color' },
          default: '#475569',
        },
        {
          path: 'isRunning',
          kind: 'boolean',
          label: { zh: '运行状态', en: 'Is Running' },
          default: false,
        },
        {
          path: 'hasError',
          kind: 'boolean',
          label: { zh: '故障告警', en: 'Has Error' },
          default: false,
        },
        {
          path: 'rpm',
          kind: 'number',
          label: { zh: '转速系数', en: 'RPM Factor' },
          default: 1,
          min: 0,
          max: 5,
          step: 0.1,
        },
      ],
    },
  ],
};
