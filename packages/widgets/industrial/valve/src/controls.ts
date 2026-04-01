import type { WidgetControls } from '@thingsvis/schema';

export const controls: WidgetControls = {
  groups: [
    {
      id: 'valve-config',
      label: 'controls.industrial-valve.group',
      fields: [
        {
          path: 'openColor',
          kind: 'color',
          label: 'controls.industrial-valve.openColor',
          default: '#52c41a',
        },
        {
          path: 'closedColor',
          kind: 'color',
          label: 'controls.industrial-valve.closedColor',
          default: '#5c5c5c',
        },
        {
          path: 'isOpen',
          kind: 'boolean',
          label: 'controls.industrial-valve.isOpen',
          default: false,
          binding: { enabled: true, modes: ['static', 'field', 'expr'] },
        },
        {
          path: 'hasError',
          kind: 'boolean',
          label: 'controls.industrial-valve.hasError',
          default: false,
          binding: { enabled: true, modes: ['static', 'field', 'expr'] },
        },
      ],
    },
  ],
};
