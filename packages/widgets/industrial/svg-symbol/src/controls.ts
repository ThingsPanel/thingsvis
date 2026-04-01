import type { WidgetControls } from '@thingsvis/schema';
import { INDUSTRIAL_ICONS } from './icons-registry';

function buildIconOptions() {
  return INDUSTRIAL_ICONS.map((icon) => ({
    label: {
      zh: `${icon.categoryLabel.zh} > ${icon.label.zh}`,
      en: `${icon.categoryLabel.en} > ${icon.label.en}`,
    },
    value: icon.id,
  }));
}

export const controls: WidgetControls = {
  groups: [
    {
      id: 'svg-config',
      label: 'controls.industrial-svg-symbol.group',
      fields: [
        {
          path: 'selectedIconId',
          kind: 'select',
          label: 'controls.industrial-svg-symbol.selectedIconId',
          default: '',
          options: buildIconOptions(),
          binding: { enabled: true, modes: ['static', 'field', 'expr'] },
        },
        {
          path: 'iconColor',
          kind: 'color',
          label: 'controls.industrial-svg-symbol.iconColor',
          default: '',
          description: 'controls.industrial-svg-symbol.iconColorDescription',
          binding: { enabled: true, modes: ['static', 'field', 'expr'] },
        },
        {
          path: 'svgContent',
          kind: 'code',
          label: 'controls.industrial-svg-symbol.svgContent',
          default: '',
          description: 'controls.industrial-svg-symbol.svgContentDescription',
        },
      ],
    },
  ],
};
