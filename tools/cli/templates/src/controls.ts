import { PropsSchema } from './schema';
import { generateControls } from '@thingsvis/widget-sdk';

export const controls = generateControls(PropsSchema, {
  groups: {
    Style: ['fill', 'opacity'],
  },

  groupOptions: {
    Style: { label: 'widgets.{{COMPONENT_ID}}.style', expanded: false },
  },

  overrides: {
    fill: { kind: 'color', label: 'widgets.{{COMPONENT_ID}}.fillColor' },
    opacity: { kind: 'slider', label: 'widgets.{{COMPONENT_ID}}.opacity', min: 0, max: 1, step: 0.01 },
  },

  bindings: {
    fill: { enabled: true, modes: ['static', 'field', 'expr'] },
    opacity: { enabled: true, modes: ['static', 'field', 'expr'] },
  },
});
