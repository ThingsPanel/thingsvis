import type { WidgetControls } from '@thingsvis/schema';

export const controls: WidgetControls = {
  groups: [
    {
      id: 'svg-config',
      label: { zh: 'SVG 配置', en: 'SVG Configuration' },
      fields: [
        {
          path: 'svgContent',
          kind: 'code',
          label: { zh: 'SVG 源代码', en: 'SVG Source Code' },
          default: '',
        },
      ],
    },
  ],
};

