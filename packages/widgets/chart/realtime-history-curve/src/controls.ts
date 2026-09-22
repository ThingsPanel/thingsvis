import type { WidgetControls } from '@thingsvis/widget-sdk';

export const controls: WidgetControls = {
  groups: [
    {
      id: 'Data',
      label: { zh: '数据', en: 'Data' },
      expanded: true,
      fields: [
        {
          path: 'data',
          label: { zh: '绑定历史数据', en: 'Bound history data' },
          kind: 'json',
          binding: { enabled: true, modes: ['static', 'field', 'expr'] },
        },
        {
          path: 'config',
          label: { zh: '数据设置', en: 'Data settings' },
          kind: 'timeSeriesConfig',
        },
      ],
    },
  ],
};
