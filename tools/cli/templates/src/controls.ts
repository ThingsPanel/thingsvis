import { PropsSchema } from './schema';
import { generateControls } from '@thingsvis/widget-sdk';

export const controls = generateControls(PropsSchema, {
  groups: {
    Style: ['fill', 'opacity'],
  },

  overrides: {
    fill: { kind: 'color' },
  },

  bindings: {
    fill: { enabled: true, modes: ['static', 'field', 'expr'] },
    opacity: { enabled: true, modes: ['static', 'field', 'expr'] },
  },
});
