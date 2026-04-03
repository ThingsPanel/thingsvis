import type { WidgetControls } from '@thingsvis/schema';

export const controls: WidgetControls = {
  groups: [
    {
      id: 'flow-config',
      label: 'controls.industrial-flow-meter.group',
      fields: [
        {
          path: 'value',
          kind: 'number',
          label: 'controls.industrial-flow-meter.value',
          default: 50,
          binding: { enabled: true, modes: ['static', 'field', 'expr'] },
        },
        {
          path: 'min',
          kind: 'number',
          label: 'controls.industrial-flow-meter.min',
          default: 0,
        },
        {
          path: 'max',
          kind: 'number',
          label: 'controls.industrial-flow-meter.max',
          default: 100,
        },
        {
          path: 'baseColor',
          kind: 'color',
          label: 'controls.industrial-flow-meter.baseColor',
          default: '#475569',
        },
        {
          path: 'liquidColor',
          kind: 'color',
          label: 'controls.industrial-flow-meter.liquidColor',
          default: '#0ea5e9',
        },
        {
          path: 'flowSpeed',
          kind: 'number',
          label: 'controls.industrial-flow-meter.flowSpeed',
          default: 1,
          min: 0,
          max: 5,
          step: 0.5,
        },
        {
          path: 'hasError',
          kind: 'boolean',
          label: 'controls.industrial-flow-meter.hasError',
          default: false,
          binding: { enabled: true, modes: ['static', 'field', 'expr'] },
        },
        {
          path: 'showValue',
          kind: 'boolean',
          label: 'controls.industrial-flow-meter.showValue',
          default: true,
        },
      ],
    },
  ],
};
