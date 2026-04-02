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
          default: 'heat-exchanger',
          options: buildIconOptions(),
          binding: { enabled: true, modes: ['static', 'field', 'expr'] },
        },
      ],
    },
    {
      id: 'display-basic',
      label: 'controls.industrial-svg-symbol.displayBasic',
      fields: [
        {
          path: 'stateMode',
          kind: 'select',
          label: 'controls.industrial-svg-symbol.stateMode',
          options: [
            {
              label: 'controls.industrial-svg-symbol.stateModeNone',
              value: '',
            },
            {
              label: 'controls.industrial-svg-symbol.stateModeNormal',
              value: 'normal',
            },
            {
              label: 'controls.industrial-svg-symbol.stateModeRunning',
              value: 'running',
            },
            {
              label: 'controls.industrial-svg-symbol.stateModeWarning',
              value: 'warning',
            },
            {
              label: 'controls.industrial-svg-symbol.stateModeFault',
              value: 'fault',
            },
            {
              label: 'controls.industrial-svg-symbol.stateModeOffline',
              value: 'offline',
            },
          ],
          binding: { enabled: true, modes: ['static', 'field', 'expr'] },
        },
        {
          path: 'animateEnabled',
          kind: 'boolean',
          label: 'controls.industrial-svg-symbol.animateEnabled',
          binding: { enabled: true, modes: ['static', 'field', 'expr'] },
        },
      ],
    },
    {
      id: 'advanced',
      label: 'controls.industrial-svg-symbol.advanced',
      fields: [
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
