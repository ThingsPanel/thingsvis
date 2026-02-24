import { PropsSchema } from './schema';
import { generateControls } from './lib/types';

export const controls = generateControls(PropsSchema, {
  groups: {
    Style: ['fill', 'stroke', 'strokeWidth', 'opacity'],
  },

  overrides: {
    fill: { kind: 'color' },
    stroke: { kind: 'color' },
  },
});
