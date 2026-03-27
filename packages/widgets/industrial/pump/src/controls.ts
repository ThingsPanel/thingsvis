import type { WidgetControls } from '@thingsvis/schema';

export const controls: WidgetControls = {
  groups: [
    {
      id: 'pump-config',
      label: { zh: '泵体配置', en: 'Pump Config' },
      fields: [
        {
          path: 'baseColor',
          kind: 'color',
          label: { zh: '基础颜色', en: 'Base Color' },
          default: '#444444',
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
          label: { zh: '转速 (RPM)', en: 'Rotational Speed (RPM)' },
          default: 60,
          min: 0,
          max: 3000,
          step: 1,
        },
      ],
    },
  ],
};
