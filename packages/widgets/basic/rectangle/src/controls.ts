import { PropsSchema } from './schema';
import { generateControls } from '@thingsvis/widget-sdk';

export const controls = generateControls(PropsSchema, {
  groups: {
    Style: ['fill', 'stroke', 'strokeWidth', 'cornerRadius', 'opacity'],
  },

  overrides: {
    fill: { kind: 'color' },
    stroke: { kind: 'color' },
  },
});
