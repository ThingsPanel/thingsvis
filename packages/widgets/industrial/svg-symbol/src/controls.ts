import type { WidgetControls } from '@thingsvis/schema';
import { INDUSTRIAL_ICONS } from './icons-registry';

/** Flatten icon registry into select options: "泵阀 > 离心泵" / "Pump & Valve > Centrifugal Pump" */
function buildIconOptions() {
  return INDUSTRIAL_ICONS.map((icon) => ({
    label: `${icon.categoryLabel.zh} > ${icon.label.zh}`,
    value: icon.id,
  }));
}

export const controls: WidgetControls = {
  groups: [
    {
      id: 'svg-config',
      label: { zh: 'SVG 配置', en: 'SVG Configuration' },
      fields: [
        {
          path: 'selectedIconId',
          kind: 'select',
          label: { zh: '工业符号', en: 'Industrial Symbol' },
          default: '',
          options: buildIconOptions(),
        },
        {
          path: 'iconColor',
          kind: 'color',
          label: { zh: '图标颜色（覆盖）', en: 'Icon Color (Override)' },
          default: '',
          description: 'Leave empty to keep original SVG colors',
        },
        {
          path: 'svgContent',
          kind: 'code',
          label: { zh: '自定义 SVG 源码', en: 'Custom SVG Source' },
          default: '',
          description: 'Used when no symbol is selected above',
        },
      ],
    },
  ],
};
