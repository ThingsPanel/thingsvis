import type { WidgetControls } from '@thingsvis/schema';

export const controls: WidgetControls = {
  groups: [
    {
      id: 'valve-config',
      label: { zh: '阀门配置', en: 'Valve Config' },
      fields: [
        {
          path: 'openColor',
          kind: 'color',
          label: { zh: '开启颜色', en: 'Open Color' },
          default: '#52c41a',
        },
        {
          path: 'closedColor',
          kind: 'color',
          label: { zh: '关闭颜色', en: 'Closed Color' },
          default: '#5c5c5c',
        },
        {
          path: 'isOpen',
          kind: 'boolean',
          label: { zh: '是否开启', en: 'Is Open' },
          default: false,
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

