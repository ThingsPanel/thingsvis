import type { WidgetControls } from '@thingsvis/schema';

export const controls: WidgetControls = {
  groups: [
    {
      id: 'tank-config',
      label: 'controls.industrial-tank.group',
      fields: [
        {
          path: 'maxMeters',
          kind: 'number',
          label: 'controls.industrial-tank.maxMeters',
          description: 'controls.industrial-tank.maxMetersHint',
          default: 3,
          min: 0.1,
          max: 100,
          step: 0.1,
        },
        {
          path: 'level',
          kind: 'number',
          label: 'controls.industrial-tank.level',
          default: 1.5,
          min: 0,
          max: 100,
          step: 0.01,
          binding: { enabled: true, modes: ['static', 'field', 'expr'] },
        },
        {
          path: 'tankColor',
          kind: 'color',
          label: 'controls.industrial-tank.tankColor',
          default: '#334155',
        },
        {
          path: 'liquidColor',
          kind: 'color',
          label: 'controls.industrial-tank.liquidColor',
          default: '#0ea5e9',
        },
        {
          path: 'lowColor',
          kind: 'color',
          label: 'controls.industrial-tank.lowColor',
          default: '#eab308',
        },
        {
          path: 'highColor',
          kind: 'color',
          label: 'controls.industrial-tank.highColor',
          default: '#ef4444',
        },
        {
          path: 'lowThreshold',
          kind: 'number',
          label: 'controls.industrial-tank.lowThreshold',
          default: 0.6,
          min: 0,
          max: 100,
          step: 0.01,
        },
        {
          path: 'highThreshold',
          kind: 'number',
          label: 'controls.industrial-tank.highThreshold',
          default: 2.4,
          min: 0,
          max: 100,
          step: 0.01,
        },
        {
          path: 'hasError',
          kind: 'boolean',
          label: 'controls.industrial-tank.hasError',
          default: false,
          binding: { enabled: true, modes: ['static', 'field', 'expr'] },
        },
      ],
    },
  ],
};
