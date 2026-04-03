import type { WidgetControls } from '@thingsvis/schema';

export const controls: WidgetControls = {
  groups: [
    {
      id: 'motor-config',
      label: 'controls.industrial-motor.group',
      fields: [
        {
          path: 'baseColor',
          kind: 'color',
          label: 'controls.industrial-motor.baseColor',
          default: '#475569',
        },
        {
          path: 'isRunning',
          kind: 'boolean',
          label: 'controls.industrial-motor.isRunning',
          default: false,
          binding: { enabled: true, modes: ['static', 'field', 'expr'] },
        },
        {
          path: 'hasError',
          kind: 'boolean',
          label: 'controls.industrial-motor.hasError',
          default: false,
          binding: { enabled: true, modes: ['static', 'field', 'expr'] },
        },
        {
          path: 'rpm',
          kind: 'number',
          label: 'controls.industrial-motor.rpm',
          default: 1,
          min: 0,
          max: 5,
          step: 0.1,
          binding: { enabled: true, modes: ['static', 'field', 'expr'] },
        },
      ],
    },
  ],
};
