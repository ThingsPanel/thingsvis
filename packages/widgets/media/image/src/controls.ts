import { generateControls } from '@thingsvis/widget-sdk';
import { PropsSchema } from './schema';

export const controls = generateControls(PropsSchema, {
  groups: {
    Content: ['dataUrl'],
    Style: ['objectFit', 'cornerRadius'],
  },
  exclude: ['opacity', 'borderColor', 'borderWidth'],
  overrides: {
    dataUrl: { kind: 'image' },
  },
  bindings: {
    dataUrl: { enabled: true, modes: ['static', 'field', 'expr'] },
  },
});
