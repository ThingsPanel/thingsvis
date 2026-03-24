import { generateControls } from '@thingsvis/widget-sdk';
import { PropsSchema } from './schema';

export const controls = generateControls(PropsSchema, {
  groups: {
    Data: ['src'],
    Style: ['borderRadius'],
  },
  exclude: ['borderWidth', 'borderColor'],
  overrides: {
    borderRadius: { kind: 'number', min: 0, max: 100, step: 1 },
  },
  bindings: {
    src: { enabled: true, modes: ['static', 'field', 'expr'] },
  },
});
