import type { WidgetControls } from '@thingsvis/schema';

export const controls: WidgetControls = {
  groups: [
    {
      id: 'tank-config',
      label: 'controls.industrial-tank.group',
      fields: [
        {
          path: 'level',
          kind: 'number',
          label: 'controls.industrial-tank.level',
          default: 50,
          min: 0,
          max: 100,
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
          default: 20,
          min: 0,
          max: 100,
        },
        {
          path: 'highThreshold',
          kind: 'number',
          label: 'controls.industrial-tank.highThreshold',
          default: 80,
          min: 0,
          max: 100,
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
