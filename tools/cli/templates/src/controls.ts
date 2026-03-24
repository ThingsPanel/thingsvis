import { PropsSchema } from './schema';
import { generateControls } from '@thingsvis/widget-sdk';

export const controls = generateControls(PropsSchema, {
  groups: {
    Style: ['fill'],
  },

  groupOptions: {
    Style: { expanded: false },
  },

  overrides: {
    fill: { kind: 'color' },
  },

  bindings: {
    fill: { enabled: true, modes: ['static', 'field', 'expr'] },
  },
});
