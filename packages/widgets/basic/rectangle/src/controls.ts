import { PropsSchema } from './schema';
import { generateControls } from '@thingsvis/widget-sdk';

export const controls = generateControls(PropsSchema, {
  groups: {
    Style: ['fill', 'opacity', 'blinkEnabled', 'blinkAlternateFill', 'blinkMinOpacity', 'blinkDurationMs'],
  },

  overrides: {
    fill: { kind: 'color' },
    blinkEnabled: { kind: 'boolean' },
    blinkAlternateFill: { kind: 'color' },
    blinkMinOpacity: { kind: 'number', min: 0, max: 1, step: 0.05 },
    blinkDurationMs: { kind: 'number', min: 200, max: 10000, step: 100 },
  },
});
