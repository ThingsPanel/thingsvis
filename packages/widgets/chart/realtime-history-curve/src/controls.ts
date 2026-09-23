import type { WidgetControls } from '@thingsvis/widget-sdk';

export const controls: WidgetControls = {
  groups: [
    {
      id: 'Data',
      label: { zh: '数据', en: 'Data' },
      expanded: true,
      fields: [
        {
          path: 'config',
          label: { zh: '数据设置', en: 'Data settings' },
          kind: 'timeSeriesConfig',
        },
      ],
    },
  ],
};
