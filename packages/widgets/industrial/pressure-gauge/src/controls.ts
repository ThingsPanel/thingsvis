import type { WidgetControls } from '@thingsvis/schema';

export const controls: WidgetControls = {
  groups: [
    {
      id: 'gauge-config',
      label: 'controls.industrial-pressure-gauge.group',
      fields: [
        {
          path: 'value',
          kind: 'number',
          label: 'controls.industrial-pressure-gauge.value',
          default: 50,
          binding: { enabled: true, modes: ['static', 'field', 'expr'] },
        },
        {
          path: 'min',
          kind: 'number',
          label: 'controls.industrial-pressure-gauge.min',
          default: 0,
        },
        {
          path: 'max',
          kind: 'number',
          label: 'controls.industrial-pressure-gauge.max',
          default: 100,
        },
        {
          path: 'dialColor',
          kind: 'color',
          label: 'controls.industrial-pressure-gauge.dialColor',
          default: '#1e293b',
        },
        {
          path: 'pointerColor',
          kind: 'color',
          label: 'controls.industrial-pressure-gauge.pointerColor',
          default: '#fbbf24',
        },
        {
          path: 'hasError',
          kind: 'boolean',
          label: 'controls.industrial-pressure-gauge.hasError',
          default: false,
          binding: { enabled: true, modes: ['static', 'field', 'expr'] },
        },
      ],
    },
  ],
};
