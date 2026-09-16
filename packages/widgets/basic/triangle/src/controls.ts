import { generateControls } from '@thingsvis/widget-sdk';
import { PropsSchema } from './schema';

export const controls = generateControls(PropsSchema, {
  groups: { Style: ['fill', 'opacity'] },
  overrides: {
    fill: { kind: 'color' },
  },
  bindings: {
    fill: { enabled: true, modes: ['static', 'field', 'expr'] },
  },
  exclude: ['stroke', 'strokeWidth', 'cornerRadius'],
});
