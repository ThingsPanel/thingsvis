import type { WidgetControls } from '@thingsvis/schema';

export const controls: WidgetControls = {
  groups: [
    {
      id: 'pump-config',
      label: 'controls.industrial-pump.group',
      fields: [
        {
          path: 'baseColor',
          kind: 'color',
          label: 'controls.industrial-pump.baseColor',
          default: '#444444',
        },
        {
          path: 'isRunning',
          kind: 'boolean',
          label: 'controls.industrial-pump.isRunning',
          default: false,
          binding: { enabled: true, modes: ['static', 'field', 'expr'] },
        },
        {
          path: 'hasError',
          kind: 'boolean',
          label: 'controls.industrial-pump.hasError',
          default: false,
          binding: { enabled: true, modes: ['static', 'field', 'expr'] },
        },
        {
          path: 'rpm',
          kind: 'number',
          label: 'controls.industrial-pump.rpm',
          default: 60,
          min: 0,
          max: 3000,
          step: 1,
          binding: { enabled: true, modes: ['static', 'field', 'expr'] },
        },
      ],
    },
  ],
};
