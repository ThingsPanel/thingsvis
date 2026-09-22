import { createControlPanel } from '@thingsvis/widget-sdk';

export const controls = createControlPanel()
  .addGroup(
    'Data',
    (builder) => {
      builder.addJsonEditor('data', {
        label: { zh: '绑定历史数据', en: 'Bound history data' },
        binding: true,
      });
    },
    { label: { zh: '数据', en: 'Data' } },
  )
  .build();
