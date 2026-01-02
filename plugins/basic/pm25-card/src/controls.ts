import { PropsSchema } from './schema';
import { generateControls } from './lib/types';

export const controls = generateControls(PropsSchema, {
  groups: {
    Content: ['title', 'value', 'unit', 'status'],
    Style: ['backgroundColor', 'titleColor', 'valueColor', 'unitColor', 'iconColor', 'fontFamily'],
  },
  
  overrides: {
    backgroundColor: { kind: 'color' },
    titleColor: { kind: 'color' },
    valueColor: { kind: 'color' },
    unitColor: { kind: 'color' },
    iconColor: { kind: 'color' },
  },
  
  bindings: {
    title: { enabled: true, modes: ['static', 'field', 'expr'] },
    value: { enabled: true, modes: ['static', 'field', 'expr'] },
    unit: { enabled: true, modes: ['static', 'field', 'expr'] },
    status: { enabled: true, modes: ['static', 'field', 'expr'] },
  },
});
