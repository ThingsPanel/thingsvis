import { generateControls } from '@thingsvis/widget-sdk';
import { PropsSchema } from './schema';

const W = 'controls.basic-straight-line';

export const controls = generateControls(PropsSchema, {
  groups: { Style: ['stroke', 'strokeWidth', 'strokeStyle', 'opacity'] },
  overrides: {
    stroke: { kind: 'color', label: `${W}.stroke` },
    strokeWidth: { label: `${W}.strokeWidth` },
    strokeStyle: {
      kind: 'segmented',
      label: `${W}.strokeStyle`,
      options: [
        { label: `${W}.solid`, value: 'solid' },
        { label: `${W}.dashed`, value: 'dashed' },
        { label: `${W}.dotted`, value: 'dotted' },
      ],
    },
    opacity: { label: `${W}.opacity` },
  },
  bindings: {
    stroke: { enabled: true, modes: ['static', 'field', 'expr'] },
  },
});
